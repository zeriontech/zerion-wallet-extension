/* eslint-env node */
import http from 'node:http';
import https from 'node:https';

/**
 * Test-only reverse proxy for ZPI.
 *
 * The Cloudflare bypass secret must never reach Chromium: Playwright traces
 * record request headers and the HTML report is uploaded as a CI artifact.
 * The extension is built with ZERION_API_URL pointing here, and this process
 * adds the header on the way out. The header is only ever sent to the ZPI
 * upstreams in ROUTES — never to any other host.
 *
 * The server binds to loopback, strips any incoming bypass header, and does
 * not log request headers or URLs.
 */

const PORT = Number(process.env.E2E_PROXY_PORT || 4789);
const SECRET =
  process.env.ZERION_API_DEVELOPMENT_KEY ||
  process.env.CF_ZPI_DEV_BYPASS_SECRET;

const ROUTES = [
  {
    prefix: '/zpi/',
    upstream: process.env.ZPI_UPSTREAM_URL || 'https://zpi.zerion.io/',
  },
  {
    prefix: '/zpi-testnet/',
    upstream:
      process.env.ZPI_TESTNET_UPSTREAM_URL || 'https://zpi-testnet.zerion.io/',
  },
];

const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

function buildTarget(route, requestUrl) {
  const rest = requestUrl.slice(route.prefix.length - 1);
  const queryIndex = rest.indexOf('?');
  const path = queryIndex === -1 ? rest : rest.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : rest.slice(queryIndex);

  const target = new URL(route.upstream);
  target.pathname = `${target.pathname.replace(/\/$/, '')}${path}`;
  target.search = search;
  return target;
}

function rewriteLocation(location, route) {
  if (!location) {
    return location;
  }
  const upstream = new URL(route.upstream);
  if (location.startsWith(upstream.origin)) {
    return `http://127.0.0.1:${PORT}${route.prefix}${location.slice(
      `${upstream.origin}/`.length
    )}`;
  }
  return location;
}

function handleRequest(request, response) {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('ok');
    return;
  }

  const route = ROUTES.find(({ prefix }) => request.url.startsWith(prefix));
  if (!route) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }

  const target = buildTarget(route, request.url);
  const headers = { ...request.headers };

  // Never trust a header coming from the browser, and never forward proxy
  // routing headers.
  delete headers['zerion-development-secret'];
  delete headers.connection;
  delete headers['proxy-connection'];
  headers.host = target.host;
  if (SECRET) {
    headers['zerion-development-secret'] = SECRET;
  }

  const client = target.protocol === 'https:' ? https : http;
  const proxyRequest = client.request(
    target,
    { method: request.method, headers },
    (proxyResponse) => {
      const responseHeaders = { ...proxyResponse.headers };
      for (const header of HOP_BY_HOP_HEADERS) {
        delete responseHeaders[header];
      }
      if (responseHeaders.location) {
        responseHeaders.location = rewriteLocation(
          responseHeaders.location,
          route
        );
      }
      response.writeHead(proxyResponse.statusCode || 502, responseHeaders);
      proxyResponse.pipe(response);
    }
  );

  proxyRequest.on('error', () => {
    if (!response.headersSent) {
      response.writeHead(502, { 'content-type': 'text/plain' });
    }
    response.end('Bad gateway');
  });
  response.on('close', () => {
    if (!response.writableEnded) {
      proxyRequest.destroy();
    }
  });
  request.pipe(proxyRequest);
}

const server = http.createServer(handleRequest);
server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(
    `E2E proxy listening on 127.0.0.1:${PORT} (ZPI bypass header ${
      SECRET ? 'enabled' : 'disabled'
    })\n`
  );
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
