import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "./session.server";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Remix Notes",
  viewport: "width=device-width,initial-scale=1",
});

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request),
  });
}

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

// import type {
//   LinksFunction,
//   LoaderArgs,
//   MetaFunction,
//   SerializeFrom,
// } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import {
//   Links,
//   LiveReload,
//   Meta,
//   Outlet,
//   Scripts,
//   ScrollRestoration,
//   useLoaderData,
// } from "@remix-run/react";
// import clsx from "clsx";
// import {
//   Theme,
//   useTheme,
//   ThemeProvider,
//   NonFlashOfWrongThemeEls,
// } from "./utils/theme-provider";

// import tailwindStyles from "./styles/tailwind.css";
// import appStyles from "./styles/app.css";
// import proseStyles from "./styles/prose.css";
// import { getUser } from "./session.server";
// import { useNonce } from "./utils/nonce-provider";

// export const links: LinksFunction = () => {
//   return [
//     { rel: "stylesheet", href: tailwindStyles },
//     { rel: "stylesheet", href: appStyles },
//     { rel: "stylesheet", href: proseStyles },
//   ];
// };

// export const meta: MetaFunction = () => ({
//   charset: "utf-8",
//   title: "Arena WB",
//   viewport: "width=device-width,initial-scale=1",
// });

// export async function loader({ request }: LoaderArgs) {
//   return json({
//     user: await getUser(request),
//   });
// }

// export type LoaderData = SerializeFrom<typeof loader>;

// // async function loaderss({ request }: DataFunctionArgs) {
// //   const timings = {};
// //   const session = await getSession(request);
// //   const user = await session.getUser({ timings });
// //   const themeSession = await getThemeSession(request);
// //   const clientSession = await getClientSession(request, user);
// //   const loginInfoSession = await getLoginInfoSession(request);
// //   const { primaryInstance } = await getInstanceInfo();

// //   const randomFooterImageKeys = Object.keys(illustrationImages);
// //   const randomFooterImageKey = randomFooterImageKeys[
// //     Math.floor(Math.random() * randomFooterImageKeys.length)
// //   ] as keyof typeof illustrationImages;

// //   const data = {
// //     user,
// //     //userInfo: user ? await getUserInfo(user, {request, timings}) : null,
// //     //ENV: getEnv(),
// //     randomFooterImageKey,
// //     requestInfo: {
// //       //origin: getDomainUrl(request),
// //       path: new URL(request.url).pathname,
// //       flyPrimaryInstance: primaryInstance,
// //       session: {
// //         email: loginInfoSession.getEmail(),
// //         magicLinkVerified: loginInfoSession.getMagicLinkVerified(),
// //         theme: themeSession.getTheme(),
// //       },
// //     },
// //   };

// //   const headers: HeadersInit = new Headers();
// //   // this can lead to race conditions if a child route is also trying to commit
// //   // the cookie as well. This is a bug in remix that will hopefully be fixed.
// //   // we reduce the likelihood of a problem by only committing if the value is
// //   // different.
// //   await session.getHeaders(headers);
// //   await clientSession.getHeaders(headers);
// //   await loginInfoSession.getHeaders(headers);
// //   headers.append("Server-Timing", getServerTimeHeader(timings));

// //   return json(data, { headers });
// // }

// function App() {
//   const [theme] = useTheme();
//   const nonce = useNonce();

//   return (
//     <html lang="en" className={clsx(theme)}>
//       <head>
//         <Meta />
//         <Links />
//         <NonFlashOfWrongThemeEls nonce={nonce} ssrTheme={false} />
//       </head>
//       <body className="bg-white transition duration-500 dark:bg-gray-900">
//         <Outlet />
//         <ScrollRestoration />
//         <Scripts />
//         <LiveReload />
//       </body>
//     </html>
//   );
// }

// export default function AppWithProviders() {
//   const data = useLoaderData<LoaderData>();
//   console.log(data, "user");
//   //specifiedTheme={data.requestInfo.session.theme}
//   return (
//     <ThemeProvider specifiedTheme={null}>
//       <App />
//     </ThemeProvider>
//   );
// }
