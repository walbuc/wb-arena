import {Link, useLoaderData} from '@remix-run/react'
import type {LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {getBlogMdxListItems, getBannerAltProp} from '~/utils/mdx'
import {getServerTimeHeader} from '~/utils/timing.server'
import {Grid} from '~/components/Grid'
import {H3, Paragraph} from '~/components/Typography'
import {Navbar} from '~/components/Nav'
import type {PropsWithChildren} from 'react'
import {useSnakeEffect} from '~/utils/hooks'

export async function loader({request}: LoaderArgs) {
  console.log('me llama')
  const timings = {}

  const [posts] = await Promise.all([
    getBlogMdxListItems({request, forceFresh: true}).then(allPosts =>
      allPosts.filter(p => !p.frontmatter.draft),
    ),
  ])

  const tags = new Set<string>()
  for (const post of posts) {
    for (const category of post.frontmatter.categories ?? []) {
      tags.add(category)
    }
  }

  const data = {
    posts,
    tags: Array.from(tags),
  }

  return json(data, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      Vary: 'Cookie',
      'Server-Timing': getServerTimeHeader(timings),
    },
  })
}

const green = [1, 3, 5, 7]
const greenStyles = {
  '--color1': 'green',
  '--color2': 'blue',
  '--padding': '5px',
} as React.CSSProperties

function Wrapper({children}: PropsWithChildren) {
  return (
    <div className="flex h-full min-h-screen flex-col">
      <Navbar />
      <main className="flex h-full">
        <div className="flex-1 p-4">{children}</div>
      </main>
    </div>
  )
}

export default function BlogIndexPage() {
  useSnakeEffect()
  const {posts, tags} = useLoaderData<typeof loader>()
  return (
    <Wrapper>
      <Grid className="sm:gap-6 gap-y-6 md:gap-x-12">
        {posts.map((p, i) => (
          <div className="col-span-full grid md:col-span-4" key={p.slug}>
            <div
              className="card snake"
              style={green.includes(i) ? greenStyles : void 0}
            >
              <div className="flex flex-col justify-between p-6">
                <div>
                  <H3>{p.frontmatter.title}</H3>
                  <Paragraph className="my-5">
                    {p.frontmatter.description}
                  </Paragraph>
                </div>
                <Link
                  to={`/blog/${p.slug}`}
                  className="w-48 min-w-fit  self-center bg-white px-4 text-center dark:bg-gray-900"
                >
                  {p.slug}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </Grid>
    </Wrapper>
  )
}
