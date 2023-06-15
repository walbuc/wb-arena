import * as React from 'react'
import {cache, cachified} from './cache.server'
import type {GitHubFile, MdxListItem, MdxPage} from '~/types'
import {buildImageUrl} from 'cloudinary-build-url'
import LRU from 'lru-cache'
import * as mdxBundler from 'mdx-bundler/client'
import {compileMdx} from './compile-mdx.server'
import {markdownToHtmlUnwrapped, stripHtml} from './markdown.server'
import {
  downloadMdxFileOrDirectory,
  downloadDirList,
} from '~/utils/github.server'
import {AnchorOrLink, getDisplayUrl, getUrl, typedBoolean} from '~/utils/misc'
import {Themed} from './theme-provider'

// 30 min
const defaultTTL = 1000 * 60 * 60 * 24 * 14
//24 / hs
const defaultSWR = 1000 * 60 * 60 * 24 * 30

const mdxComponents = {
  a: AnchorOrLink,
  Themed,
  // CloudinaryVideo,
  // ThemedBlogImage,
  // BlogImage,
  // SubscribeForm,
  // OptionalUser,
}

type CachifiedOptions = {
  forceFresh?: boolean | string
  request?: Request
  ttl?: number
  timings?: any
}

async function getMdxPage(
  {contentDir, slug}: {contentDir: string; slug: string},
  options: CachifiedOptions,
): Promise<MdxPage | null> {
  const {forceFresh, request, ttl = defaultTTL, timings} = options

  const key = `mdx-page:${contentDir}:${slug}:compiled`
  const page = await cachified({
    key,
    cache,
    request,
    timings,
    ttl,
    staleWhileRevalidate: defaultSWR,
    forceFresh,
    checkValue: checkCompiledValue,
    getFreshValue: async () => {
      const pageFiles = await downloadMdxFilesCached(contentDir, slug, options)
      const compiledPage = await compileMdxCached({
        contentDir,
        slug,
        ...pageFiles,
        options,
      }).catch(err => {
        console.error(`Failed to get a fresh value for mdx:`, {
          contentDir,
          slug,
        })
        return Promise.reject(err)
      })
      return compiledPage
    },
  })
  if (!page) {
    cache.delete(key)
  }
  return page
}

export async function downloadMdxFilesCached(
  contentDir: string,
  slug: string,
  options: CachifiedOptions,
) {
  const {forceFresh, ttl = defaultTTL, request, timings} = options
  const key = `${contentDir}:${slug}:downloaded`
  const downloaded = await cachified({
    cache,
    request,
    timings,
    ttl,
    staleWhileRevalidate: defaultSWR,
    forceFresh,
    key,
    checkValue: (value: unknown) => {
      if (typeof value !== 'object') {
        return `value is not an object`
      }
      if (value === null) {
        return `value is null`
      }

      const download = value as Record<string, unknown>
      if (!Array.isArray(download.files)) {
        return `value.files is not an array`
      }
      if (typeof download.entry !== 'string') {
        return `value.entry is not a string`
      }

      return true
    },
    getFreshValue: async () =>
      downloadMdxFileOrDirectory(`${contentDir}/${slug}`),
  })
  // if there aren't any files, remove it from the cache
  if (!downloaded.files.length) {
    void cache.delete(key)
  }
  return downloaded
}

const checkCompiledValue = (value: unknown) =>
  typeof value === 'object' &&
  (value === null || ('code' in value && 'frontmatter' in value))

async function getDataUrlForImage(imageUrl: string) {
  const res = await fetch(imageUrl)
  const arrayBuffer = await res.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mime = res.headers.get('Content-Type') ?? 'image/webp'
  const dataUrl = `data:${mime};base64,${base64}`
  return dataUrl
}

async function getBlurDataUrl(cloudinaryId: string) {
  const imageURL = buildImageUrl(cloudinaryId, {
    transformations: {
      resize: {width: 100},
      quality: 'auto',
      format: 'webp',
      effect: {
        name: 'blur',
        value: '1000',
      },
    },
  })
  const dataUrl = await getDataUrlForImage(imageURL)
  return dataUrl
}

async function compileMdxCached({
  contentDir,
  slug,
  entry,
  files,
  options,
}: {
  contentDir: string
  slug: string
  entry: string
  files: Array<GitHubFile>
  options: CachifiedOptions
}) {
  const key = `${contentDir}:${slug}:compiled`
  const page = await cachified({
    cache,
    ttl: defaultTTL,
    staleWhileRevalidate: defaultSWR,
    ...options,
    key,
    checkValue: checkCompiledValue,
    getFreshValue: async () => {
      const compiledPage = await compileMdx<MdxPage['frontmatter']>(slug, files)
      if (compiledPage) {
        if (
          compiledPage.frontmatter.bannerCloudinaryId &&
          !compiledPage.frontmatter.bannerBlurDataUrl
        ) {
          try {
            console.log(compiledPage)
            compiledPage.frontmatter.bannerBlurDataUrl = await getBlurDataUrl(
              compiledPage.frontmatter.bannerCloudinaryId,
            )
          } catch (error: unknown) {
            console.error(
              'oh no, there was an error getting the blur image data url',
              error,
            )
          }
        }
        if (compiledPage.frontmatter.bannerCredit) {
          const credit = await markdownToHtmlUnwrapped(
            compiledPage.frontmatter.bannerCredit,
          )
          compiledPage.frontmatter.bannerCredit = credit
          const noHtml = await stripHtml(credit)
          // Just grab the text from node tree
          if (!compiledPage.frontmatter.bannerAlt) {
            compiledPage.frontmatter.bannerAlt = noHtml
              .replace(/(photo|image)/i, '')
              .trim()
          }
          if (!compiledPage.frontmatter.bannerTitle) {
            compiledPage.frontmatter.bannerTitle = noHtml
          }
        }
        return {
          ...compiledPage,
          slug,
          editLink: `https://github.com/walbuc/blog/edit/main/${entry}`,
        }
      } else {
        return null
      }
    },
  })
  // if there's no page, remove it from the cache
  if (!page) {
    void cache.delete(key)
  }
  return page
}

// This exists so we don't have to call new Function for the given code
// for every request for a given blog post/mdx file.
const mdxComponentCache = new LRU<string, ReturnType<typeof getMdxComponent>>({
  max: 1000,
})

/**
 * This should be rendered within a useMemo
 * @param code the code to get the component from
 * @returns the component
 */
function getMdxComponent(code: string) {
  // Avoid getting component from code every time
  const Component = mdxBundler.getMDXComponent(code)
  // return component
  function MdxComponent({
    components,
    ...rest
  }: Parameters<typeof Component>['0']) {
    return (
      // @ts-expect-error the types are wrong here
      <Component components={{...mdxComponents, ...components}} {...rest} />
    )
  }
  return MdxComponent
}

function useMdxComponent(code: string) {
  return React.useMemo(() => {
    if (mdxComponentCache.has(code)) {
      return mdxComponentCache.get(code)!
    }
    const component = getMdxComponent(code)
    mdxComponentCache.set(code, component)
    return component
  }, [code])
}

function getBannerAltProp(frontmatter: MdxPage['frontmatter']) {
  return (
    frontmatter.bannerAlt ??
    frontmatter.bannerTitle ??
    frontmatter.bannerCredit ??
    frontmatter.title ??
    'Post banner'
  )
}

function getBannerTitleProp(frontmatter: MdxPage['frontmatter']) {
  return (
    frontmatter.bannerTitle ?? frontmatter.bannerAlt ?? frontmatter.bannerCredit
  )
}

/**
 * This is useful for when you don't want to send all the code for a page to the client.
 */
function mapFromMdxPageToMdxListItem(page: MdxPage): MdxListItem {
  const {code, ...mdxListItem} = page
  return mdxListItem
}

const getDirListKey = (contentDir: string) => `${contentDir}:dir-list`

async function getMdxDirList(contentDir: string, options?: CachifiedOptions) {
  const {forceFresh, ttl = defaultTTL, request, timings} = options ?? {}
  const key = getDirListKey(contentDir)
  return cachified({
    cache,
    request,
    timings,
    ttl,
    staleWhileRevalidate: defaultSWR,
    forceFresh,
    key,
    checkValue: (value: unknown) => Array.isArray(value),
    getFreshValue: async () => {
      const fullContentDirPath = `content/${contentDir}`
      const dirList = (await downloadDirList(fullContentDirPath))
        .map(({name, path}) => ({
          name,
          slug: path
            .replace(`${fullContentDirPath}/`, '')
            .replace(/\.mdx$/, ''),
        }))
        .filter(({name}) => name !== 'README.md')
      return dirList
    },
  })
}

async function getMdxPagesInDirectory(
  contentDir: string,
  options: CachifiedOptions,
) {
  const dirList = await getMdxDirList(contentDir, options)

  // our octokit throttle plugin will make sure we don't hit the rate limit
  const pageDatas = await Promise.all(
    dirList.map(async ({slug}) => {
      return {
        ...(await downloadMdxFilesCached(contentDir, slug, options)),
        slug,
      }
    }),
  )

  const pages = await Promise.all(
    pageDatas.map(pageData =>
      compileMdxCached({contentDir, ...pageData, options}),
    ),
  )
  return pages.filter(typedBoolean)
}

async function getBlogMdxListItems(options: CachifiedOptions) {
  const {request, forceFresh, ttl = defaultTTL, timings} = options
  const key = 'blog:mdx-list-items'
  return cachified({
    cache,
    request,
    timings,
    ttl,
    staleWhileRevalidate: defaultSWR,
    forceFresh,
    key,
    getFreshValue: async () => {
      console.log('getting fresh')
      let pages = await getMdxPagesInDirectory('blog', options).then(allPosts =>
        allPosts.filter(p => !p.frontmatter.draft && !p.frontmatter.unlisted),
      )
      pages = pages.sort((a, z) => {
        const aTime = new Date(a.frontmatter.date ?? '').getTime()
        const zTime = new Date(z.frontmatter.date ?? '').getTime()
        return aTime > zTime ? -1 : aTime === zTime ? 0 : 1
      })

      return pages.map(mapFromMdxPageToMdxListItem)
    },
  })
}

export {
  getMdxPage,
  useMdxComponent,
  getBannerTitleProp,
  getBannerAltProp,
  getBlogMdxListItems,
}
