import path from 'path'
import express from 'express'
import compression from 'compression'
import morgan from 'morgan'
import {createRequestHandler} from '@remix-run/express'

const BUILD_DIR = path.join(process.cwd(), 'build')

const app = express()

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// Remix fingerprints its assets so we can cache forever.
app.use(
  '/build',
  express.static('public/build', {immutable: true, maxAge: '1y'}),
)

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', {maxAge: '1h'}))

app.use(morgan('tiny'))

app.all(
  '*',
  process.env.NODE_ENV === 'development'
    ? (req, res, next) => {
        purgeRequireCache()

        return createRequestHandler({
          build: require(BUILD_DIR),
          mode: process.env.NODE_ENV,
        })(req, res, next)
      }
    : createRequestHandler({
        build: require(BUILD_DIR),
        mode: process.env.NODE_ENV,
      }),
)
const port = process.env.PORT || 3000

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Express server listening on port ${port}`)
})

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key]
    }
  }
}

// import path from "path";
// import crypto from "crypto";
// import express from "express";
// import compression from "compression";
// import onFinished from "on-finished";
// import morgan from "morgan";
// import { createRequestHandler } from "@remix-run/express";
// import {
//   combineGetLoadContexts,
//   createMetronomeGetLoadContext,
//   registerMetronome,
// } from "@metronome-sh/express";
// import { getInstanceInfo } from "litefs-js";
// import helmet from "helmet";

// const MODE = process.env.NODE_ENV;
// const BUILD_DIR = path.join(process.cwd(), "build");

// const app = express();

// const here = (...a: Array<string>) => path.join(__dirname, ...a);
// const primaryHost = "blog.com";

// const getHost = (req: { get: (key: string) => string | undefined }) =>
//   req.get("X-Forwarded-Host") ?? req.get("host") ?? "";

// const publicAbsolutePath = here("../public");
// // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
// app.disable("x-powered-by");

// // Remix fingerprints its assets so we can cache forever.
// app.use(
//   "/build",
//   express.static(`${publicAbsolutePath}/build`, {
//     immutable: true,
//     maxAge: "1y",
//   })
// );

// // Everything else (like favicon.ico) is cached for an hour. You may want to be
// // more aggressive with this caching.
// app.use(express.static(publicAbsolutePath, { maxAge: "1h" }));

// app.use(morgan("tiny"));

// app.use(async (req, res, next) => {
//   const { currentInstance, primaryInstance } = await getInstanceInfo();
//   res.set("X-Powered-By", "WB dev");
//   // fly provider data
//   res.set("X-Fly-Region", process.env.FLY_REGION ?? "unknown");
//   res.set("X-Fly-App", process.env.FLY_APP_NAME ?? "unknown");
//   res.set("X-Fly-Instance", currentInstance);
//   res.set("X-Fly-Primary-Instance", primaryInstance);
//   res.set("X-Frame-Options", "SAMEORIGIN");

//   const host = getHost(req);
//   if (!host.endsWith(primaryHost)) {
//     res.set("X-Robots-Tag", "noindex");
//   }
//   res.set("Access-Control-Allow-Origin", `https://${host}`);

//   // if they connect once with HTTPS, then they'll connect with HTTPS for the next hundred years
//   res.set("Strict-Transport-Security", `max-age=${60 * 60 * 24 * 365 * 100}`);
//   next();
// });

// app.use(async (req, res, next) => {
//   if (req.get("cf-visitor")) {
//     // console.log(`👺 disallowed cf-visitor`, req.headers) // <-- this can be kinda noisy
//     // make them wait for it... Which should cost them money...
//     await new Promise((resolve) => setTimeout(resolve, 90_000));
//     return res.send("nothig to see...");
//   } else {
//     return next();
//   }
// });

// app.use((req, res, next) => {
//   if (req.path.endsWith("/") && req.path.length > 1) {
//     const query = req.url.slice(req.path.length);
//     const safepath = req.path.slice(0, -1).replace(/\/+/g, "/");
//     res.redirect(301, safepath + query);
//   } else {
//     next();
//   }
// });

// app.use(compression());

// app.use(
//   express.static(publicAbsolutePath, {
//     maxAge: "1w",
//     setHeaders(res, resourcePath) {
//       const relativePath = resourcePath.replace(`${publicAbsolutePath}/`, "");
//       if (relativePath.startsWith("build/info.json")) {
//         res.setHeader("cache-control", "no-cache");
//         return;
//       }
//       // If we ever change our font (which we quite possibly never will)
//       // then we'll just want to change the filename or something...
//       // Remix fingerprints its assets so we can cache forever
//       if (
//         relativePath.startsWith("fonts") ||
//         relativePath.startsWith("build")
//       ) {
//         res.setHeader("cache-control", "public, max-age=31536000, immutable");
//       }
//     },
//   })
// );

// // log the referrer for 404s
// app.use((req, res, next) => {
//   onFinished(res, () => {
//     const referrer = req.get("referer");
//     if (res.statusCode === 404 && referrer) {
//       console.info(
//         `👻 404 on ${req.method} ${req.path} referred by: ${referrer}`
//       );
//     }
//   });
//   next();
// });

// //tokens??
// app.use(
//   morgan((tokens, req, res) => {
//     const host = getHost(req);
//     return [
//       tokens.method?.(req, res),
//       `${host}${tokens.url?.(req, res)}`,
//       tokens.status?.(req, res),
//       tokens.res?.(req, res, "content-length"),
//       "-",
//       tokens["response-time"]?.(req, res),
//       "ms",
//     ].join(" ");
//   })
// );

// app.use((req, res, next) => {
//   // generate number used once string
//   res.locals.cspNonce = crypto.randomBytes(16).toString("hex");
//   next();
// });

// // make sure prisma-studio requests proxy to Remix properly
// app.all("*", (req, res, next) => {
//   if (
//     req.headers.referer?.includes("prisma-studio") &&
//     !req.url.includes("prisma-studio") &&
//     !req.path.includes("prisma-studio")
//   ) {
//     req.url = `/prisma-studio${req.path}`;
//   }
//   return next();
// });

// app.get(
//   "/prisma-studio",
//   helmet.contentSecurityPolicy({ useDefaults: false }),
//   helmet.referrerPolicy({ policy: "same-origin" })
// );

// function getRequestHandlerOptions(): Parameters<
//   typeof createRequestHandler
// >[0] {
//   const build = require("../build");

//   function getLoadContext(req: any, res: any) {
//     return { cspNonce: res.locals.cspNonce };
//   }
//   // check metronome perf
//   if (MODE === "production" && !process.env.DISABLE_METRONOME) {
//     const buildWithMetronome = registerMetronome(build);
//     // const metronomeGetLoadContext =
//     //   createMetronomeGetLoadContext(buildWithMetronome);
//     return {
//       //build: buildWithMetronome,
//       build,
//       getLoadContext,
//       //getLoadContext: combineGetLoadContexts(
//       //   getLoadContext
//       //   // @ts-expect-error huh... metronome isn't happy with itself.
//       //   //metronomeGetLoadContext
//       // ),
//       mode: MODE,
//     };
//   }
//   return { build, mode: MODE, getLoadContext };
// }

// // it is the same call
// if (MODE === "production") {
//   app.all("*", createRequestHandler(getRequestHandlerOptions()));
// } else {
//   app.all("*", (req, res, next) => {
//     purgeRequireCache();
//     return createRequestHandler(getRequestHandlerOptions())(req, res, next);
//   });
// }

// const port = process.env.PORT ?? 3000;

// app.listen(port, () => {
//   // preload the build so we're ready for the first request
//   // we want the server to start accepting requests asap, so we wait until now
//   // to preload the build
//   require("../build");
//   console.log(`Express server listening on port ${port}`);
// });

// function purgeRequireCache() {
//   // purge require cache on requests for "server side HMR" this won't let
//   // you have in-memory objects between requests in development,
//   // alternatively you can set up nodemon/pm2-dev to restart the server on
//   // file changes, but then you'll have to reconnect to databases/etc on each
//   // change. We prefer the DX of this, so we've included it for you by default
//   for (const key in require.cache) {
//     if (key.startsWith(BUILD_DIR)) {
//       delete require.cache[key];
//     }
//   }
// }
