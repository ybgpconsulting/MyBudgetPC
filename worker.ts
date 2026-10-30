import { onRequest } from './functions/api/[[path]]';

type ApiEnvironment = Parameters<typeof onRequest>[0]['env'];

interface WorkerEnvironment extends ApiEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: WorkerEnvironment): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return onRequest({ request, env });
    }
    const response = await env.ASSETS.fetch(request);
    const isFilePath = /\.[^/]+$/.test(pathname);
    const isHtmlDocumentPath = /\.html?$/i.test(pathname);
    if (response.status === 200 && isFilePath && !isHtmlDocumentPath
      && response.headers.get('content-type')?.startsWith('text/html')) {
      return new Response(null, { status: 404 });
    }
    return response;
  },
};