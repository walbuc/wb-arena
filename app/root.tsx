import type {LinksFunction, LoaderArgs, MetaFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'

import clsx from 'clsx'
import {
  Theme,
  useTheme,
  ThemeProvider,
  NonFlashOfWrongThemeEls,
} from './utils/theme-provider'

import tailwindStyles from './styles/tailwind.css'
import appStyles from './styles/app.css'
import proseStyles from './styles/prose.css'
import {getUser} from './session.server'
import {useNonce} from './utils/nonce-provider'
import {getEnv} from './utils/env.server'

export const links: LinksFunction = () => {
  return [
    {
      rel: 'preload',
      as: 'font',
      href: '/fonts/Matter-Medium.woff2',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      as: 'font',
      href: '/fonts/Matter-Regular.woff2',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    // {
    //   rel: 'apple-touch-icon',
    //   sizes: '180x180',
    //   href: '/favicons/apple-touch-icon.png',
    // },
    // {
    //   rel: 'icon',
    //   type: 'image/png',
    //   sizes: '32x32',
    //   href: '/favicons/favicon-32x32.png',
    // },
    // {
    //   rel: 'icon',
    //   type: 'image/png',
    //   sizes: '16x16',
    //   href: '/favicons/favicon-16x16.png',
    // },
    //{rel: 'manifest', href: '/site.webmanifest'},
    {rel: 'icon', href: '/favicon.ico'},
    {rel: 'stylesheet', href: tailwindStyles},
    {rel: 'stylesheet', href: appStyles},
    {rel: 'stylesheet', href: proseStyles},
  ]
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'WB Arena',
  viewport: 'width=device-width,initial-scale=1',
})

export async function loader({request}: LoaderArgs) {
  return json({
    user: await getUser(request),
  })
}

function App() {
  const nonce = useNonce()
  const [theme] = useTheme()
  console.log(theme, 'Theme ')
  console.log(nonce, 'Theme ')
  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        <Meta />
        <Links />
        <NonFlashOfWrongThemeEls nonce={nonce} ssrTheme={false} />
      </head>
      <body className="bg-white transition duration-300 dark:bg-gray-900">
        <Outlet />
        <ScrollRestoration />
        <Scripts nonce={nonce} />
        <LiveReload />
      </body>
    </html>
  )
}

export default function AppWithProviders() {
  //save in session
  // const data = useLoaderData<LoaderData>()
  return (
    <ThemeProvider specifiedTheme={Theme.DARK}>
      <App />
    </ThemeProvider>
  )
}
