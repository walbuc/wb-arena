import {PassThrough} from 'stream'
import type {EntryContext, HandleDocumentRequestFunction} from '@remix-run/node'
import {Response} from '@remix-run/node'
import {RemixServer} from '@remix-run/react'
import isbot from 'isbot'
import {renderToPipeableStream} from 'react-dom/server'
import {NonceProvider} from './utils/nonce-provider'

const ABORT_DELAY = 5000
type DocRequestArgs = Parameters<HandleDocumentRequestFunction>

export default async function handleRequest(...args: DocRequestArgs) {
  const [
    request,
    responseStatusCode,
    responseHeaders,
    remixContext,
    loadContext,
  ] = args

  if (process.env.NODE_ENV !== 'production') {
    responseHeaders.set('Cache-Control', 'no-store')
  }
  // when cloudinary service is set up
  // responseHeaders.append(
  //   "Link",
  //   '<https://res.cloudinary.com>; rel="preconnect"'
  // );

  const callbackName = isbot(request.headers.get('user-agent'))
    ? 'onAllReady'
    : 'onShellReady'

  const nonce = loadContext.cspNonce ? String(loadContext.cspNonce) : undefined

  return new Promise((resolve, reject) => {
    let didError = false

    const {pipe, abort} = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </NonceProvider>,
      {
        [callbackName]: () => {
          const body = new PassThrough()

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          )

          pipe(body)
        },
        onShellError: (err: unknown) => {
          reject(err)
        },
        onError: (error: unknown) => {
          didError = true

          console.error(error)
        },
      },
    )

    setTimeout(abort, ABORT_DELAY)
  })
}
