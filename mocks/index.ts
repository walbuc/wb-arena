import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {githubHandlers} from './github'

import {isConnectedToTheInternet, cloudName} from './utils'

const miscHandlers = [
  rest.get('https://api.backend.dev/user', (req, res, ctx) => {
    return res(ctx.json({firstName: 'John'}))
  }),
  rest.get(
    `https://res.cloudinary.com/${cloudName}/image/upload/w_100,q_auto,f_webp,e_blur:1000/unsplash/:photoId`,
    async (req, res, ctx) => {
      if (await isConnectedToTheInternet()) return req.passthrough()

      const base64 =
        'UklGRhoBAABXRUJQVlA4IA4BAABwCgCdASpkAEMAPqVInUq5sy+hqvqpuzAUiWcG+BsvrZQel/iYPLGE154ZiYwzeF8UJRAKZ0oAzLdTpjlp8qBuGwW1ntMTe6iQZbxzyP4gBeg7X7SH7NwyBcUDAAD+8MrTwbAD8OLmsoaL1QDPwEE+GrfqLQPn6xkgFHCB8lyjV3K2RvcQ7pSvgA87LOVuDtMrtkm+tTV0x1RcIe4Uvb6J+yygkV48DSejuyrMWrYgoZyjkf/0/L9+bAZgCam6+oHqjBSWTq5jF7wzBxYwfoGY7OdYZOdeGb4euuuLaCzDHz/QRbDCaIsJWJW3Jo4bkbz44AI/8UfFTGX4tMTRcKLXTDIviU+/u7UnlVaDQAA='
      const buffer = Buffer.from(base64)
      return res(ctx.body(buffer))
    },
  ),
  rest.get(/res.cloudinary.com\/${cloudName}\//, req => {
    return req.passthrough()
  }),
  rest.get(/http:\/\/localhost:\d+\/.*/, async req => req.passthrough()),
  rest.post(/http:\/\/localhost:\d+\/.*/, async req => req.passthrough()),
]

const server = setupServer(...githubHandlers, ...miscHandlers)

server.listen({onUnhandledRequest: 'warn'})
console.info('🔶 Mock server installed')

process.once('SIGINT', () => server.close())
process.once('SIGTERM', () => server.close())
