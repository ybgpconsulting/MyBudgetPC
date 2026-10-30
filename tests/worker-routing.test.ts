import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker';

function makeEnvironment(assetResponse: (request: Request) => Response | Promise<Response>) {
  const assetRequests: string[] = [];
  return {
    assetRequests,
    env: {
      ASSETS: {
        fetch: async (request: Request) => {
          assetRequests.push(new URL(request.url).pathname);
          return assetResponse(request);
        },
      },
    },
  };
}

test('Worker preserves SPA navigation responses', async () => {
  const index = new Response('<!doctype html><div id="root"></div>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const { env } = makeEnvironment(() => index.clone());

  const response = await worker.fetch(new Request('https://store.example/catalog'), env);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /^text\/html/);
  assert.match(await response.text(), /id="root"/);
});

test('Worker preserves content types for existing static assets', async () => {
  const assets = [
    ['/assets/app.js', 'text/javascript; charset=utf-8'],
    ['/assets/app.css', 'text/css; charset=utf-8'],
    ['/images/logo.png', 'image/png'],
  ] as const;

  for (const [path, contentType] of assets) {
    const { env } = makeEnvironment(() => new Response('asset', {
      headers: { 'content-type': contentType },
    }));
    const response = await worker.fetch(new Request(`https://store.example${path}`), env);

    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), contentType, path);
  }
});

test('Worker returns 404 instead of SPA HTML for missing file-like assets', async () => {
  const missingPaths = [
    '/assets/missing.js',
    '/assets/missing.css',
    '/images/missing.png',
    '/fonts/missing.woff2',
    '/downloads/missing.json',
  ];

  for (const path of missingPaths) {
    const { env } = makeEnvironment(() => new Response('<html>SPA</html>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }));
    const response = await worker.fetch(new Request(`https://store.example${path}`), env);

    assert.equal(response.status, 404, path);
    assert.equal(await response.text(), '', path);
  }
});

test('Worker routes API errors to the API handler without asset fallback', async () => {
  const { env, assetRequests } = makeEnvironment(() => new Response('<html>SPA</html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));

  const response = await worker.fetch(new Request('https://store.example/api/health'), env);
  const body = await response.json() as { error: string };

  assert.equal(response.status, 503);
  assert.match(response.headers.get('content-type') || '', /^application\/json/);
  assert.match(body.error, /D1 database is not configured/);
  assert.deepEqual(assetRequests, []);
});
