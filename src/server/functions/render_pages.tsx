import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { dehydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from '../../App';
import { createQueryClient } from '../../queries/queryClient';
import { ParamsOfFillInSsrData } from '../../types';

const { CLIENT_DEV_ORIGIN } = process.env;
const CLIENT_INDEX_HTML_PATH = path.resolve('client/index.html');

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
      result = await promisify(fs.readFile)(CLIENT_INDEX_HTML_PATH, 'utf8');
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
