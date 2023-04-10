import * as React from 'react'
import {useFetcher} from '@remix-run/react'

enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
}
const themes: Array<Theme> = Object.values(Theme)

type ThemeContextType = [
  Theme | null,
  React.Dispatch<React.SetStateAction<Theme | null>>,
]

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined,
)
ThemeContext.displayName = 'ThemeContext'

const prefersLightMQ = '(prefers-color-scheme: light)'

//Only on browser
const getPreferredTheme = () =>
  window.matchMedia(prefersLightMQ).matches ? Theme.LIGHT : Theme.DARK

function ThemeProvider({
  children,
  specifiedTheme,
}: {
  children: React.ReactNode
  specifiedTheme: Theme | null
}) {
  const [theme, setThemeState] = React.useState<Theme | null>(() => {
    // On the server, if we don't have a specified theme then we should
    // return null and the clientThemeCode will set the theme for us
    // before hydration. Then (during hydration), this code will get the same
    // value that clientThemeCode got so hydration is happy.
    if (specifiedTheme) {
      // if it is set and it is not light or dark, return null
      if (themes.includes(specifiedTheme)) return specifiedTheme
      else return null
    }

    // there's no way for us to know what the theme should be in this context
    // the client will have to figure it out before hydration.
    if (typeof window !== 'object') return null

    // if we are in the client get preffered theme from media api
    return getPreferredTheme()
  })

  // const persistTheme = useFetcher()
  // // TODO: remove this when persistTheme is memoized properly
  // const persistThemeRef = React.useRef(persistTheme)
  // React.useEffect(() => {
  //   persistThemeRef.current = persistTheme
  // }, [persistTheme])

  // // Only runs on client
  // React.useEffect(() => {
  //   const mediaQuery = window.matchMedia(prefersLightMQ)
  //   const handleChange = () => {
  //     setThemeState(mediaQuery.matches ? Theme.DARK : Theme.DARK)
  //   }
  //   mediaQuery.addEventListener('change', handleChange)
  //   return () => mediaQuery.removeEventListener('change', handleChange)
  // }, [])

  // Action / mutatation
  const setTheme = React.useCallback(
    (cb: Parameters<typeof setThemeState>[0]) => {
      const newTheme = typeof cb === 'function' ? cb(theme) : cb
      if (newTheme) {
        // persistThemeRef.current.submit(
        //   {theme: newTheme},
        //   {action: 'action/set-theme', method: 'post'},
        // )
      }
      setThemeState(newTheme)
    },
    [theme],
  )

  return (
    <ThemeContext.Provider value={[theme, setTheme]}>
      {children}
    </ThemeContext.Provider>
  )
}

const clientThemeCode = `
// hi there dear reader 👋
// this is how I make certain we avoid a flash of the wrong theme. If you select
// a theme, then I'll know what you want in the future and you'll not see this
// script anymore.
;(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersLightMQ)}).matches
    ? 'light'
    : 'dark';
  
  const cl = document.documentElement.classList;
  
  const themeAlreadyApplied = cl.contains('light') || cl.contains('dark');
  if (themeAlreadyApplied) {
    // this script shouldn't exist if the theme is already applied!
    console.warn(
      "Hi there, could you let Kent know you're seeing this message? Thanks!",
    );
  } else {
    cl.add(theme);
  }
  
  // the <dark-mode> and <light-mode> approach won't work for meta tags,
  // so we have to do it manually.
  const meta = document.querySelector('meta[name=color-scheme]');
  // update value and correct it to proper user settings. Only client side
  if (meta) {
    if (theme === 'dark') {
      meta.content = 'dark light';
    } else if (theme === 'light') {
      meta.content = 'light dark';
    }
  } else {
    console.warn(
      "Heya, could you let Kent know you're seeing this message? Thanks!",
    );
  }
})();
`

// Server and client
// inside Root
// Default to dark
function NonFlashOfWrongThemeEls({
  ssrTheme,
  nonce,
}: {
  ssrTheme: boolean
  nonce?: string
}) {
  const [theme] = useTheme()
  console.log('Use Theme', theme)
  return (
    <>
      {/*
        On the server, "theme" might be `null`, so clientThemeCode ensures that
        this is correct before hydration.
      */}
      <meta
        name="color-scheme"
        content={theme === 'light' ? 'light dark' : 'dark light'}
      />
      {/*
        If we know what the theme is from the server then we don't need
        to do fancy tricks prior to hydration to make things match.
      */}
      {ssrTheme ? null : (
        <script
          nonce={nonce}
          // Allowlist inline script to be executed with number used once
          // NOTE: we cannot use type="module" because that automatically makes
          // the script "defer". That doesn't work for us because we need
          // this script to run synchronously before the rest of the document
          // is finished loading.
          dangerouslySetInnerHTML={{__html: clientThemeCode}}
        />
      )}
    </>
  )
}

// Only client before hydration
// Try to get client preferred theme from media
// or default if not set
function handleDarkAndLightModeEls() {
  const theme = getPreferredTheme()
  const darkEls = document.querySelectorAll('dark-mode')
  const lightEls = document.querySelectorAll('light-mode')
  for (const darkEl of darkEls) {
    if (theme === 'dark') {
      for (const child of darkEl.childNodes) {
        darkEl.parentElement?.append(child)
      }
    }
    darkEl.remove()
  }
  for (const lightEl of lightEls) {
    if (theme === 'light') {
      for (const child of lightEl.childNodes) {
        lightEl.parentElement?.append(child)
      }
    }
    lightEl.remove()
  }
}

function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * @dark  React.Node
 * @light React.Node
 * This allows you to render something that depends on the theme without
 * worrying about whether it'll SSR properly when we don't actually know
 * the user's preferred theme.
 */
function Themed({
  dark,
  light,
  initialOnly = false,
}: {
  dark: React.ReactNode | string
  light: React.ReactNode | string
  initialOnly?: boolean
}) {
  const [theme] = useTheme()
  const [initialTheme] = React.useState(theme)
  const themeToReference = initialOnly ? initialTheme : theme
  const serverRenderWithUnknownTheme = !theme && typeof window !== 'object'
  if (serverRenderWithUnknownTheme) {
    // stick them both in and our little script will update the DOM to match
    // what we'll render in the client during hydration.
    return (
      <>
        {React.createElement('dark-mode', null, dark)}
        {React.createElement('light-mode', null, light)}
      </>
    )
  } else {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{themeToReference === 'light' ? light : dark}</>
  }
}

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && themes.includes(value as Theme)
}

export {
  handleDarkAndLightModeEls,
  ThemeProvider,
  useTheme,
  themes,
  Theme,
  isTheme,
  Themed,
  NonFlashOfWrongThemeEls,
}
