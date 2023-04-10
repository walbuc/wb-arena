import {RemixBrowser} from '@remix-run/react'
import {startTransition, StrictMode} from 'react'
import {hydrateRoot} from 'react-dom/client'
import {handleDarkAndLightModeEls} from './utils/theme-provider'

const hydrate = () => {
  handleDarkAndLightModeEls()
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>,
    )
  })
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate)
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1)
}
