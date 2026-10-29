import { onRequest } from './functions/api/[[path]]';

type ApiEnvironment = Parameters<typeof onRequest>[0]['env'];

interface WorkerEnvironment extends ApiEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  fetch(request: Request, env: WorkerEnvironment): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return onRequest({ request, env });
    }
    return env.ASSETS.fetch(request);
  },
};