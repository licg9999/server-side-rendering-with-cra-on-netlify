# Server-side rendering for any React app on any FaaS provider

By this document, I'd like to introduce a general method to set up server-side rendering(SSR) for any React app on any FaaS provider. A "React app" is a web app with its client side (or frontend) built with React. A "FaaS provider" is a serverless computing platform, such as AWS Lambda. To state the idea clearly, a runnable demo app is constructed step by step below. I would guide you through the steps, then summarize the idea.

Thinking that the demo app should be practical but not overwelmed by details, its React client side would be constructed with commonly seen features, such as styling, routing, data fetching and assets loading, but at a limited cost. Meanwhile, it would be deployed on a widely accepted FaaS provider that has an easy setup. So, I'm going to use [create-react-app(CRA)](https://github.com/facebook/create-react-app) to initialize the demo app, enhance it, then get it deployed on [Netlify](https://www.netlify.com/) with SSR added.

## The demo app

### Constructing the React client side without SSR

Firstly, let me initialize the React client side of the demo app using CRA. As TypeScript is being commonly used in [today's](https://2022.stateofjs.com/en-US/usage/) frontend development, the option `--template typescript` is used here:

```sh
$ npx create-react-app the-demo-app --template typescript
# ...
$ cd the-demo-app
```

The version of CRA in use is `5.0.1` and the generated directory structure looks as below:

```sh
$ tree -I node_modules
.
├── README.md
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src
│   ├── App.css
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── index.tsx
│   ├── logo.svg
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   └── setupTests.ts
└── tsconfig.json

2 directories, 19 files
```

Among the generated files, `src/App.css` is importing and using `src/App.css` and `src/logo.svg`, which means features of styling and assets loading has been included:

```tsx
// src/App.tsx
import './App.css';
import logo from './logo.svg';

function App() {
  return (
    <div className="App">
      ...
      <img src={logo} className="App-logo" alt="logo" />
      ...
    </div>
  );
}

export default App;
```

Now, to ensure the commonly seen features are all set, routing and data fetching are to be included, too. For the routing, `react-router-dom`, [de facto](https://ui.dev/react-router-tutorial) routing lib in React, would be used:

```sh
$ npm i react-router-dom
```

To get the routing to work at a minimum cost, 2 pages and the routing logics that can switch them are needed. The content of `src/App.tsx` can be replaced with the routing logics while the old content gets moved to `src/pages/Home/Page.tsx` serving as one needed page. Then, a not-found page `src/pages/NotFound/Page.tsx` can be added serving as the other needed page. When the path `/` is visited, the former page gets shown. When any other path is visited, the latter page gets shown:

```tsx
// src/App.tsx
import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/Home/Page';
import { NotFoundPage } from './pages/NotFound/Page';

export const App: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
```

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';

jest.mock('./pages/Home/Page', () => ({
  HomePage: () => 'Home Page',
}));

jest.mock('./pages/NotFound/Page', () => ({
  NotFoundPage: () => 'Not Found Page',
}));

for (const [path, page] of Object.entries({
  '/': 'Home Page',
  '/somewhere-else': 'Not Found Page',
})) {
  test(`renders "${page}" if "${path}" is visited`, () => {
    render(
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    );
    expect(screen.getByText(page)).toBeInTheDocument();
  });
}
```

```tsx
// src/pages/Home/Page.tsx
import { FC } from 'react';
import logo from '../../logo.svg';
import styles from './Page.module.css';

export const HomePage: FC = () => {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <img src={logo} className={styles.logo} alt="logo" />
        <p>
          Edit <code>src/**/*.tsx</code> and save to reload.
        </p>
        <a
          className={styles.link}
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
};
```

```css
/* src/pages/Home/Page.module.css */
.root {
  text-align: center;
}

.logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.link {
  color: #61dafb;
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

```tsx
// src/pages/NotFound/Page.tsx
import { FC } from 'react';
import styles from './Page.module.css';

export const NotFoundPage: FC = () => {
  return (
    <div className={styles.root}>
      <h1>Not Found</h1>
    </div>
  );
};
```

```css
/* src/pages/NotFound/Page.tsx */
.root {
  text-align: center;
}
```

After that, to make the routing logics take effect, `<BrowserRouter>` is applied in `src/index.tsx`:

```tsx
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

For the data fetching, 2 other libs, `@tanstack/react-query`(whose old package name is `react-query`) and `axios`, are used:

```sh
$ npm i @tanstack/react-query axios
```

The data fetching logics are, the `Home/Page.tsx` invokes a query function that fetches the star count of a GitHub repo, then gets the result rendered:

```diff
// src/pages/Home/Page.tsx
-import { FC } from 'react';
+import { FC, useMemo } from 'react';
import logo from '../../logo.svg';
+import { ParamsOfGetRepoStarCount, useGhRepoStarCountQuery } from '../../queries/gh';
import styles from './Page.module.css';

+export const paramOfGhRepoStarCountQuery: ParamsOfGetRepoStarCount = {
+  userName: 'facebook',
+  repoName: 'react',
+};

export const HomePage: FC = () => {
+  const numberFormat = useMemo(() => new Intl.NumberFormat(), []);
+  const { isLoading, isSuccess, data } = useGhRepoStarCountQuery(paramOfGhRepoStarCountQuery);
+
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <img src={logo} className={styles.logo} alt="logo" />
        <p>
          Edit <code>src/**/*.tsx</code> and save to reload.
        </p>
        <a
          className={styles.link}
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
-          Learn React
+          Learn React (⭐️ = {isLoading && 'loading...'}
+          {isSuccess && numberFormat.format(data.result)})
        </a>
      </header>
    </div>
  );
};
```

And here is the query function in `src/queries/gh.ts`:

```ts
// src/queries/gh.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export type ParamsOfGetRepoStarCount = Partial<{ userName: string; repoName: string }>;

export type ReturnOfGetRepoStarCount = { result: number };

export function getKeyOfGhRepoStarCountQuery(params: ParamsOfGetRepoStarCount) {
  return ['ghRepoStarCountQuery', params];
}

export function useGhRepoStarCountQuery(params: ParamsOfGetRepoStarCount) {
  return useQuery(getKeyOfGhRepoStarCountQuery(params), async () => {
    const { data: repoInfo } = await axios.get(
      `https://api.github.com/repos/${params.userName}/${params.repoName}`
    );
    return { result: repoInfo.stargazers_count } as ReturnOfGetRepoStarCount;
  });
}
```

As well as its base setup:

```ts
// src/queries/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient();
}
```

```diff
// src/index.tsx
+ import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';
+import { createQueryClient } from './queries/queryClient';
import reportWebVitals from './reportWebVitals';

+const queryClient = createQueryClient();
+
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
-    <BrowserRouter>
-      <App />
-    </BrowserRouter>
+    <QueryClientProvider client={queryClient}>
+      <BrowserRouter>
+        <App />
+      </BrowserRouter>
+    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

By far, the client side of the demo app with commonly seen features of a React app is constructed. You may check it by running `scripts` from `package.json`.:

```json
// package.json
  ...
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
  ...
```

The commands are `npm start` for previewing, `npm run build` for building, `npm test` for unit-testing. In some versions of CRA, with the features above, pages can't get refreshed automatically on edited in the previewing. If it is your case, setting `FAST_REFRESH=false` will help:

```sh
$ npm i cross-env
```

```diff
// package.json
  ...
  "scripts": {
-    "start": "react-scripts start",
+    "start": "cross-env FAST_REFRESH=false react-scripts start",
  ...
```

### Adding SSR and deploying the app on Netlify

On diving into the SSR and the deployment on Netlify, let's take a look at how the essential logics of SSR in a React app work:

1. When a request for a page comes, the app's server side prepares the data that the requested page would request on the client side. Then, the data together with the root client-side React component are used to generate the server-side rendered html of the requested page. With the data serialized, the server side inserts it along with the server-side rendered html into the top-level html to make the final html as the response.
1. When the response of the requested page arrives, the app's client side deserializes the serialized data from the response, then uses it together with the root client-side React component to hydrate the server-side rendered html from the response to initialize the React client side.

So, in the first place, a server side that is able to import and use `src/App.tsx` (which is the root client-side React component here) should be set up. Also, as server-side logics on Netlify are primarily done by Netlify Functions, the [convention of registering functions by files paths](https://docs.netlify.com/functions/build/#name-your-function) should be followed.

To use types in Netlify Functions, `@netlify/functions` is installed:

```sh
$ npm i @netlify/functions
```

Then, the Netlify function for SSR is created in `src/server/functions/render_pages.tsx` with a placeholder string returned for now:

```tsx
// src/server/functions/render_pages.tsx
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  return { statusCode: 200, body: 'It works!' };
};
```

And the client-side webpack config is as much as possibly reused to create a server-side webpack config. It is adjusted for transpiling the Netlify functions files as well as the files imported by them, preserving the directory structure and stopping assets getting emitted. The server-side webpack config is created in `webpack.server.config.js`:

```js
// webpack.server.config.js
const glob = require('glob');
const { set } = require('lodash');
const TranspilePlugin = require('transpile-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const envInQuestion = process.env.NODE_ENV ?? 'development';
const shouldPrintConfig = Boolean(process.env.PRINT_CONFIG);

process.env.NODE_ENV = envInQuestion;
process.env.FAST_REFRESH = 'false';
const webpackConfig = require('react-scripts/config/webpack.config')(envInQuestion);

webpackConfig.entry = () => glob.sync('src/server/**/*', { nodir: true, absolute: true });
webpackConfig.target = 'node';
webpackConfig.externals = [nodeExternals()];

removeAssetsEmitting();
removeUnusedPluginsAndOptimizers();

webpackConfig.plugins.push(
  new TranspilePlugin({
    longestCommonDir: __dirname + '/src',
    extentionMapping: { '.ts': '.js', '.tsx': '.js' },
  })
);

if (shouldPrintConfig) {
  console.dir(webpackConfig, { depth: Infinity });
}

function removeAssetsEmitting() {
  webpackConfig.module.rules.forEach(({ oneOf }) => {
    oneOf?.forEach((rule) => {
      if (rule.type?.startsWith('asset')) {
        set(rule, 'generator.emit', false);
      }

      const fileLoaderUseItem = rule.use?.find(({ loader }) => loader?.includes('file-loader'));
      if (fileLoaderUseItem) {
        set(fileLoaderUseItem, 'options.emitFile', false);
      }

      const cssLoaderUseItemIndex = rule.use?.findIndex(({ loader }) =>
        loader?.includes('css-loader')
      );
      if (cssLoaderUseItemIndex >= 0) {
        const cssLoaderOptionModules = rule.use[cssLoaderUseItemIndex].options?.modules;
        if (cssLoaderOptionModules) {
          cssLoaderOptionModules.exportOnlyLocals = true;
        }
        rule.use = rule.use.slice(cssLoaderUseItemIndex);
      }
    });
  });
}

function removeUnusedPluginsAndOptimizers() {
  webpackConfig.plugins = webpackConfig.plugins.filter((p) => {
    const ctorName = p.constructor.name;
    if (ctorName.includes('Html')) return false;
    if (ctorName.includes('Css')) return false;
    if (ctorName === 'WebpackManifestPlugin') return false;
    if (ctorName === 'DefinePlugin') return false;
    return true;
  });

  webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter((m) => {
    const ctorName = m.constructor.name;
    if (ctorName.includes('Css')) return false;
    return true;
  });
}

module.exports = webpackConfig;
```

Also, the packages used in `webpack.server.config.js` need to be installed:

```sh
$ npm i webpack glob lodash transpile-webpack-plugin webpack-node-externals
```

The webpack plugin [`transpile-webpack-plugin`](https://github.com/licg9999/transpile-webpack-plugin) collects files directly or indirectly imported by the entry, then gets them compiled and ouputted preserving the directory structure. The webpack helper [`webpack-node-externals`](https://github.com/liady/webpack-node-externals) externalizes installed deps to reduce the outputted file count.

After that, to run webpack, webpack CLI is needed:

```sh
$ npm i webpack-cli npm-run-all
```

To run multiple `scripts` from `package.json`, `npm-run-all` is needed:

```sh
$ npm i npm-run-all
```

To launch the previewing of the whole demo app including the client side and the server side, [Netlify CLI](https://cli.netlify.com/) is needed but installing it globally is good enough:

```sh
$ npm i -g netlify-cli
```

Then, `scripts` in `package.json` is extended and `netlify.toml` is created:

```diff
// package.json
...
  "scripts": {
-    "start": "cross-env FAST_REFRESH=false react-scripts start",
+    "start:client": "cross-env BROWSER=none FAST_REFRESH=false react-scripts start",
+    "start:server": "cross-env BUILD_PATH=server webpack -w -c webpack.server.config.js",
+    "start-all": "run-p start:*",
+    "dev": "netlify dev",
...
```

```toml
# netlify.toml
[functions]
directory = "server/server/functions"


[dev]
port = 8888
command = "npm run start-all"
targetPort = 3000
```

Now, executing the command `npm run dev` on the local machine launches the previewing, which starts the client-side dev server on port `3000`, the server-side transpilation in watch mode and the server-side dev server on port `8888`, with the url `http://127.0.0.1:8888/` opened on the default browser. The `Home/Page.tsx` is rendered on the path `/` visited. The `NotFound/Page.tsx` is rendered on the path like `/zxcv` visited. The content `It works!` is rendered on the path `/.netlify/functions/render_pages` visited. The initial setup of the demo app's server side is made and the demo app becomes initially previewable as a whole.

Notice that, the previewing generates 2 directories, `.netlify` and `server`, which should be untracked by the version control. On the command `netlify dev` executed, `.netlify` is automatically added to `.gitignore`. And `server` needs to be manually added to `.gitignore`:

```diff
# .gitignore
...
# production
/build
+/server
...
```

Thinking that, in a real-world web app, the client side usually fetches http endpoints built in its own server side. To emulate that closely, another Netlify function is to be added for returning the star count of a GitHub repo and the client-side query function is to fetch data from it instead of directly from the GitHub endpoint. So, the new Netlify function is created in `src/server/functions/gh_repo_star_count.ts` and its data accessing logics and types are extracted into `src/server/gh.ts` which gets reused by the client side and the SSR:

```ts
// src/server/functions/gh_repo_star_count.ts
import { Handler } from '@netlify/functions';
import { getGhRepoStarCount } from '../gh/repo';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(await getGhRepoStarCount(event.queryStringParameters ?? {})),
  };
};
```

```ts
// src/server/gh/repo.ts
import axios from 'axios';

export type ParamsOfGetRepoStarCount = Partial<{ userName: string; repoName: string }>;

export type ReturnOfGetRepoStarCount = { result: number };

export async function getGhRepoStarCount(
  params: ParamsOfGetRepoStarCount
): Promise<ReturnOfGetRepoStarCount> {
  if (!params.userName || !params.repoName) throw new Error('Bad params');
  const { data: repoInfo } = await axios.get(
    `https://api.github.com/repos/${params.userName}/${params.repoName}`
  );
  return { result: repoInfo.stargazers_count };
}
```

```diff
// src/queries/gh.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
-
-export type ParamsOfGetRepoStarCount = Partial<{ userName: string; repoName: string }>;
-
-export type ReturnOfGetRepoStarCount = { result: number };
+import type { ParamsOfGetRepoStarCount, ReturnOfGetRepoStarCount } from '../server/gh/repo';

export function getKeyOfGhRepoStarCountQuery(params: ParamsOfGetRepoStarCount) {
  return ['ghRepoStarCountQuery', params];
}

export function useGhRepoStarCountQuery(params: ParamsOfGetRepoStarCount) {
  return useQuery(getKeyOfGhRepoStarCountQuery(params), async () => {
-    const { data: repoInfo } = await axios.get(
-      `https://api.github.com/repos/${params.userName}/${params.repoName}`
-    );
-    return { result: repoInfo.stargazers_count } as ReturnOfGetRepoStarCount;
+    const { data } = await axios.get(
+      '/.netlify/functions/gh_repo_star_count?' + new URLSearchParams(params).toString()
+    );
+    return data as ReturnOfGetRepoStarCount;
  });
}
```

```diff
// src/pages/Home/Page.tsx
import { FC, useMemo } from 'react';
import logo from '../../logo.svg';
-import { ParamsOfGetRepoStarCount, useGhRepoStarCountQuery } from '../../queries/gh';
+import { useGhRepoStarCountQuery } from '../../queries/gh';
+import type { ParamsOfGetRepoStarCount } from '../../server/gh/repo';
import styles from './Page.module.css';
...
```

Sometimes, a GitHub endpoint may fail because of the rate limit. If it is your case, setting a fallback value or introducing a cache will help:

```diff
// src/server/gh/repo.ts
...
+const fallbackResultOfGetRepoStarCount = 12345;
+
export async function getGhRepoStarCount(
  params: ParamsOfGetRepoStarCount
): Promise<ReturnOfGetRepoStarCount> {
  if (!params.userName || !params.repoName) throw new Error('Bad params');
-  const { data: repoInfo } = await axios.get(
-    `https://api.github.com/repos/${params.userName}/${params.repoName}`
-  );
-  return { result: repoInfo.stargazers_count };
+  try {
+    const { data: repoInfo } = await axios.get(
+      `https://api.github.com/repos/${params.userName}/${params.repoName}`
+    );
+    return { result: repoInfo.stargazers_count };
+  } catch {
+    return { result: fallbackResultOfGetRepoStarCount };
+  }
}
```

In addition, here is an optional patch in case debugging with the client-side dev server is wanted. Declaring the `proxy` field in `package.json` pointing at `http://127.0.0.1:8888` can help pages in `http://127.0.0.1:3000` to fetch the server-side endpoints:

```diff
// package.json
...
+  "proxy": "http://127.0.0.1:8888",
...
```

Next, it's time to do the SSR. Only requests for pages are supposed to be handled, but, limited by available [routing](https://docs.netlify.com/routing/overview/) options of Netlify, requests that are possibly for pages all need to be redirected to the `functions/render_pages.tsx`:

```diff
# netlify.toml
[functions]
directory = "server/server/functions"


+[[redirects]]
+from = "/"
+to = "/.netlify/functions/render_pages"
+status = 200
+force = true
+
+[[redirects]]
+from = "/*"
+to = "/.netlify/functions/render_pages"
+status = 200
+
+
[dev]
port = 8888
command = "npm run start-all"
targetPort = 3000
+
+
+[context.dev.environment]
+CLIENT_DEV_ORIGIN = "http://127.0.0.1:3000"
```

Here, the environment variable `CLIENT_DEV_ORIGIN` is injected to the previewing so that the existence and the url origin of the client-side dev server is exposed.

On `CLIENT_DEV_ORIGIN` presented, when a get request to the `functions/render_pages.tsx` has its path ending with an non-empty file extension, the request is dispatched to the client-side dev server:

```tsx
// src/server/functions/render_pages.tsx
import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import axios from 'axios';
import path from 'node:path';

const { CLIENT_DEV_ORIGIN } = process.env;

export const handler: Handler = async (event, context) => {
  const shouldGetFromClientDevServer =
    CLIENT_DEV_ORIGIN && event.httpMethod === 'GET' && path.parse(event.path).ext;
  if (shouldGetFromClientDevServer) {
    return await getFromClientDevServer(event);
  }

  return { statusCode: 200, body: 'It works!' };
};

async function getFromClientDevServer(event: HandlerEvent): Promise<HandlerResponse> {
  const { status, data, headers } = await axios.get(`${CLIENT_DEV_ORIGIN}${event.path}`, {
    responseType: 'text',
    responseEncoding: 'binary',
  });
  return {
    statusCode: status,
    headers: headers as {},
    body: Buffer.from(data, 'binary').toString('base64'),
    isBase64Encoded: true,
  };
}
```

The rest requests are the ones for pages and SSR is to be added for them. To manipulate html, `jsdom` is installed:

```sh
$ npm i jsdom @types/jsdom
```

Then, `src/server/functions/render_pages.tsx` is extended along with `src/pages/Home/ssrData.ts` and `src/types.ts` created:

```tsx
// src/server/functions/render_pages.tsx
import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { dehydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from '../../App';
import { createQueryClient } from '../../queries/queryClient';
import { ParamsOfFillInSsrData } from '../../types';

const { CLIENT_DEV_ORIGIN } = process.env;

export const handler: Handler = async (event, context) => {
  const shouldGetFromClientDevServer =
    CLIENT_DEV_ORIGIN && event.httpMethod === 'GET' && path.parse(event.path).ext;
  if (shouldGetFromClientDevServer) {
    return await getFromClientDevServer(event);
  }

  const clientIndexDom = new JSDOM(await getClientIndexHtml());
  const { document } = clientIndexDom.window;

  try {
    const queryClient = createQueryClient();
    await autoFillInSsrData({ event, context, queryClient });
    addDehydratedScript(document, queryClient);
    const rootHtml = renderToString(
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={event.path}>
          <App />
        </StaticRouter>
      </QueryClientProvider>
    );
    document.querySelector('#root')!.innerHTML = rootHtml;
    queryClient.clear();
  } catch (e) {
    console.error(e);
  }

  return { statusCode: 200, body: clientIndexDom.serialize() };
};

async function getFromClientDevServer(event: HandlerEvent): Promise<HandlerResponse> {
  const { status, data, headers } = await axios.get(`${CLIENT_DEV_ORIGIN}${event.path}`, {
    responseType: 'text',
    responseEncoding: 'binary',
  });
  return {
    statusCode: status,
    headers: headers as {},
    body: Buffer.from(data, 'binary').toString('base64'),
    isBase64Encoded: true,
  };
}

async function getClientIndexHtml(): Promise<string> {
  if (!getClientIndexHtml.cachedResult) {
    let result: string;
    if (CLIENT_DEV_ORIGIN) {
      const { data } = await axios.get(`${CLIENT_DEV_ORIGIN}/`, { responseType: 'text' });
      result = data;
    } else {
      result = '<div id="root"></div>';
    }
    getClientIndexHtml.cachedResult = result;
  }
  return getClientIndexHtml.cachedResult;
}
getClientIndexHtml.cachedResult = false as string | false;

async function autoFillInSsrData(params: ParamsOfFillInSsrData): Promise<void> {
  const { event } = params;

  let pageName: string | false = false;
  if (event.path === '/') {
    pageName = 'Home';
  }

  if (pageName) {
    const { fillInSsrData } = await import(`../../pages/${pageName}/ssrData`);
    await fillInSsrData(params);
  }
}

function addDehydratedScript(document: Document, queryClient: QueryClient): void {
  const scriptAsStr = `window.__REACT_QUERY_STATE__=${JSON.stringify(dehydrate(queryClient))};`;
  const scriptAsElm = document.createElement('script');
  scriptAsElm.innerHTML = scriptAsStr;
  document.head.append(scriptAsElm);
}
```

```tsx
// src/pages/Home/ssrData.ts
import { paramOfGhRepoStarCountQuery } from './Page';
import { getKeyOfGhRepoStarCountQuery } from '../../queries/gh';
import { getGhRepoStarCount } from '../../server/gh/repo';
import type { ParamsOfFillInSsrData } from '../../types';

export async function fillInSsrData({ queryClient }: ParamsOfFillInSsrData): Promise<void> {
  await queryClient.prefetchQuery(getKeyOfGhRepoStarCountQuery(paramOfGhRepoStarCountQuery), () =>
    getGhRepoStarCount(paramOfGhRepoStarCountQuery)
  );
}
```

```tsx
// src/types.ts
import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import type { QueryClient } from '@tanstack/react-query';

export type ParamsOfFillInSsrData = {
  event: HandlerEvent;
  context: HandlerContext;
  queryClient: QueryClient;
};
```

For each page that requests server-side data, a `ssrData.ts` file is given for preparing its own SSR data. The `functions/render_pages.tsx` selects the proper `ssrData.ts` file based on the request path to prepare the proper SSR data. Together with the client-side root React component `<App>`, the server-side rendered html is generated. Afterwards, the SSR data is serialized as the global variable `__REACT_QUERY_STATE__` inside a script html element. Meanwhile, on `CLIENT_DEV_ORIGIN` presented, the top-level html is fetched from the client-side dev server. With the script html element and the server-side rendered html inserted, the top-level html is returned as the response.

That's the server-side part of SSR. For the client-side part, the global variable `__REACT_QUERY_STATE__` is deserialized for the hydration:

```diff
// src/react-app-env.d.ts
/// <reference types="react-scripts" />

+interface Window {
+  __REACT_QUERY_STATE__?: {};
+}
```

```diff
// src/index.tsx
-import { QueryClientProvider } from '@tanstack/react-query';
+import { Hydrate, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';
import { createQueryClient } from './queries/queryClient';
import reportWebVitals from './reportWebVitals';

const queryClient = createQueryClient();
+const dehydratedState = window.__REACT_QUERY_STATE__ ?? {};

-const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
-root.render(
+ReactDOM.hydrateRoot(
+  document.getElementById('root') as HTMLElement,
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
-      <BrowserRouter>
-        <App />
-      </BrowserRouter>
+      <Hydrate state={dehydratedState}>
+        <BrowserRouter>
+          <App />
+        </BrowserRouter>
+      </Hydrate>
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

Now, with the previewing launched, visiting the path `/` or `/zxcv` verifies the SSR result of the `Home/Page.tsx` or `NotFound/Page.tsx`, which is also doable by using `curl`:

```sh
$ curl http://127.0.0.1:8888/
...
<div id="root"><div class="Page_root__VJmx-"><header class="Page_header__LpSVE"><img src="/static/media/logo.6ce24c58023cc2f8fd88fe9d219db6c6.svg" class="Page_logo__KFvWL" alt="logo"><p>Edit <code>src/**/*.tsx</code> and save to reload.</p><a class="Page_link__iAwDC" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">Learn React (⭐️ = <!-- -->201,386<!-- -->)</a></header></div></div>
...

$ curl http://127.0.0.1:8888/zxcv
...
<div id="root"><div class="Page_root__3XcfJ"><h1>Not Found</h1></div></div>
...
```

Wth the SSR added in the previewing, a flash of unstyled content([FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content)) can happen because, on browser, the server-side rendered html appears prior to the styles inserted on the JS files loaded. Though, it's expected when `style-loader` is used. CRA uses `style-loader` in `react-scripts start` to do the hot module replacement([HMR](https://webpack.js.org/guides/hot-module-replacement/)) for the styles in the previewing. But when the app gets built and deployed to the remote environment, CRA inserts the styles into the top-level html at compile time in `react-scripts build`, so the FOUC problem won't exist in the end. (But if you still think the FOUC problem matters, controlling the visibility of the server-side rendered html with checking `process.env.NODE_ENV === 'development'` may help.)

With the previewing made ready, the demo app is getting built and deployed to the remote environment. In the remote environment, there is no client-side dev server launched but are only the built client-side assets. And I need to extend `package.json`, `netlify.toml` and `src/server/functions/render_pages.tsx`:

```diff
// package.json
...
"scripts": {
    "start:client": "cross-env BROWSER=none FAST_REFRESH=false react-scripts start",
    "start:server": "cross-env BUILD_PATH=server webpack -w -c webpack.server.config.js",
    "start-all": "run-p start:*",
    "dev": "netlify dev",
-    "build": "react-scripts build",
+    "build:client": "cross-env BUILD_PATH=client react-scripts build",
+    "build:server": "cross-env BUILD_PATH=server NODE_ENV=production webpack -c webpack.server.config.js",
+    "build-all": "run-s build:*",
...
```

```diff
# netlify.toml
[functions]
directory = "server/server/functions"
+node_bundler = "nft"
+included_files = ["server/**/*", "client/**/*.html"]
...
+[build]
+command = "npm run build-all"
+publish = "client"
+
+[build.environment]
+NODE_ENV = "production"
...
```

```diff
// src/server/functions/render_pages.tsx
import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { dehydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { JSDOM } from 'jsdom';
+import fs from 'node:fs';
import path from 'node:path';
+import { promisify } from 'node:util';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from '../../App';
import { createQueryClient } from '../../queries/queryClient';
import { ParamsOfFillInSsrData } from '../../types';

const { CLIENT_DEV_ORIGIN } = process.env;
+const CLIENT_INDEX_HTML_PATH = path.resolve('client/index.html');
...
async function getClientIndexHtml(): Promise<string> {
  if (!getClientIndexHtml.cachedResult) {
    let result: string;
    if (CLIENT_DEV_ORIGIN) {
      const { data } = await axios.get(`${CLIENT_DEV_ORIGIN}/`, { responseType: 'text' });
      result = data;
    } else {
-      result = '<div id="root"></div>';
+      result = await promisify(fs.readFile)(CLIENT_INDEX_HTML_PATH, 'utf8');
    }
    getClientIndexHtml.cachedResult = result;
  }
  return getClientIndexHtml.cachedResult;
}
getClientIndexHtml.cachedResult = false as string | false;
...
```

The build directory of the client-side assets is adjusted from `build` to `client` and is used as the publish directory of Netlify. In the remote environment, with the current routing options of Netlify, for a get request whose path matches an asset path in the publish directory, the matched asset is returned. Meanwhile, in the `functions/render_pages.tsx`, the top-level html is read from the file `client/index.html`. Notice that, as the server-side transpilation is already done, `node_bundler = "nft"` is used in `netlify.toml` to stop Netlify doing any extra processing in the deploying.

By the way, to untrack the generated directory `client`, `.gitignore` needs to be modified:

```diff
# .gitignore
...
# production
-/build
+/client
/server
...
```

Finally, following the guide [Import from an existing repository](https://docs.netlify.com/welcome/add-new-site/#import-from-an-existing-repository) in the Netlify docs, the demo app is deployed. The final codebase of the demo app is in the GitHub repo [licg9999/server-side-rendering-with-cra-on-netlify](https://github.com/licg9999/server-side-rendering-with-cra-on-netlify). And its url after the deployment is https://bucolic-sprinkles-002beb.netlify.app/. The SSR can be verified by visiting the path `/` or `/zxcv`, which is also doable by using `curl`:

```sh
$ curl https://bucolic-sprinkles-002beb.netlify.app/
...<div id="root"><div class="Page_root__VJmx-"><header class="Page_header__LpSVE"><img src="/static/media/logo.6ce24c58023cc2f8fd88fe9d219db6c6.svg" class="Page_logo__KFvWL" alt="logo"><p>Edit <code>src/**/*.tsx</code> and save to reload.</p><a class="Page_link__iAwDC" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">Learn React (⭐️ = <!-- -->201,431<!-- -->)</a></header></div></div>...

$ curl https://bucolic-sprinkles-002beb.netlify.app/zxcv
...<div id="root"><div class="Page_root__3XcfJ"><h1>Not Found</h1></div></div>...
```

By far, the demo app of a React app that has commonly seen features and is deployed on Netlify with SSR added is fully constructed.

## The idea under the hood

Going over the construction of the demo app, the idea of setting up SSR for any React app on any FaaS provider is summarized as below:

1. A server side that is able to import and use the client-side root React component needs to be made first. The client-side compilation config is as much as possibly reused to create the server-side transpilation config, with the key adjustments of preserving the directory structure and stopping assets getting emitted, for the files of the FaaS entries.
1. For each page that requests server-side data, a SSR sibling file is given for preparing its own SSR data. On a page request coming, the server side selects the proper SSR sibling file based on the request path to prepare the proper SSR data. The logics and types of the data accessing to the data source can be extracted, then be reused by the client-side data fetching, the server-side data returing and the SSR data preparing.
1. The SSR data together with the client-side root component are used to generate the server-side rendered html. The top-level html can be fetched from the client-side dev server in the local environment (or the previewing), or be read from the built client-side assets in the remote environment. With the SSR data serialized then inserted along with the server-side rendered html, the top-level html is returned as the response.
1. The client side deserializes the SSR data from the response, then uses it together with the root client-side React component to hydrate the server-side rendered html from the response to initialize the React client side.
1. The extra processing by the FaaS provider in the deploying needs to be stopped, if there is any, because the server-side transpilation is already done. Also, some dispatching needs to be added to help launch the app as a whole in the local environment.

Among the points, I think the #1 can be the most important one. The reason is, the rest ones are only suggesting possible best practices, but the server side that is able to import and use the client-side root React component always constitutes the foundation of SSR. So, once the server-side transpilation can be made from the reuse of the client-side compilation config, just like this demo app of SSR with CRA on Neltify, SSR can be added to any React app on any FaaS provider.
