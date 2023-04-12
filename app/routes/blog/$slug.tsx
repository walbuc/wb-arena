import * as React from 'react'
import type {DataFunctionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useLoaderData, useParams} from '@remix-run/react'
import {getServerTimeHeader} from '~/utils/timing.server'
import {
  getMdxPage,
  useMdxComponent,
  getBannerTitleProp,
  getBannerAltProp,
} from '~/utils/mdx'
import {H2, H6} from '~/components/Typography'
import {Grid} from '~/components/Grid'
import {formatDate, formatNumber} from '~/utils/misc'
import {getImageBuilder, getImgProps} from '~/images'
import {BackLink} from '~/components/ArrowButton'
import {BlurrableImage} from '~/components/BlurrableImage'

export async function loader({request, params}: DataFunctionArgs) {
  if (!params.slug) {
    throw new Error('params.slug is not defined')
  }
  const timings = {}

  const page = await getMdxPage(
    {contentDir: 'blog', slug: params.slug},
    {request, timings, forceFresh: false},
  )

  if (!page) {
    throw json('Page not found ', {status: 404})
  }

  const headers = {
    'Cache-Control': 'private, max-age=3600',
    Vary: 'Cookie',
    'Server-Timing': getServerTimeHeader(timings),
  }

  return json({page}, {status: 200, headers})
}

export default function BlogMdx() {
  const data = useLoaderData<typeof loader>()
  const {code, frontmatter} = data.page
  const params = useParams()
  const Component = useMdxComponent(code)
  const isDraft = false
  const isArchived = false

  return (
    <div>
      <Grid key={params.slug} className="m-0 mb-6">
        <div className="col-span-full lg:col-span-7 lg:col-start-3">
          {isDraft ? (
            <div className="prose prose-light mb-6 max-w-full dark:prose-dark">
              {React.createElement(
                'callout-warning',
                {},
                `This blog post is a draft. Please don't share it in its current state.`,
              )}
            </div>
          ) : null}
          {isArchived ? (
            <div className="prose prose-light mb-6 max-w-full dark:prose-dark">
              {React.createElement(
                'callout-warning',
                {},
                `This blog post is archived. It's no longer maintained and may contain outdated information.`,
              )}
            </div>
          ) : null}
          <H2>{frontmatter.title}</H2>
          <H6 as="p" variant="secondary" className="mt-2">
            {frontmatter.date
              ? formatDate(frontmatter.date)
              : 'some day in the past'}{' '}
            — {data.page.readTime?.text ?? 'a quick read'}
          </H6>
        </div>
        <div className="mb-10 mt-12  lg:mb-12">
          <BackLink to="/">Back</BackLink>
        </div>
      </Grid>
      <Grid>
        {frontmatter.bannerCloudinaryId ? (
          <div className="col-span-full mb-10 lg:col-span-8 lg:col-start-3 lg:mb-16">
            <BlurrableImage
              key={frontmatter.bannerCloudinaryId}
              blurDataUrl={frontmatter.bannerBlurDataUrl}
              className="aspect-h-4 aspect-w-3 md:aspect-w-3 md:aspect-h-2"
              img={
                // eslint-disable-next-line jsx-a11y/alt-text
                <img
                  data-testid="banner-image"
                  className="rounded-lg object-cover object-center"
                  title={getBannerTitleProp(frontmatter)}
                  {...getImgProps(
                    getImageBuilder(
                      frontmatter.bannerCloudinaryId,
                      getBannerAltProp(frontmatter),
                    ),
                    {
                      widths: [280, 560, 840, 1100, 1650, 2500, 2100, 3100],
                      sizes: [
                        '(max-width:1023px) 80vw',
                        '(min-width:1024px) and (max-width:1620px) 67vw',
                        '1100px',
                      ],
                      transformations: {
                        background: 'rgb:e6e9ee',
                      },
                    },
                  )}
                />
              }
            />
          </div>
        ) : null}
      </Grid>
      <Grid>
        <div className="prose prose-light col-span-full mb-24 break-words dark:prose-dark lg:col-span-7  lg:col-start-3">
          <Component />
        </div>
      </Grid>
    </div>
  )
}
