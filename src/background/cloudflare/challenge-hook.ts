import type { AfterResponseHook, NormalizedOptions } from 'ky';

export interface BackgroundChallengeHandler {
  isCriticalRequest(url: string): Promise<boolean>;
  handleChallenge(options: { endpoint: string }): Promise<void>;
  /** True when the clearance was obtained and the request should be retried. */
  waitForSolve(critical: boolean): Promise<boolean>;
}

type Retry = (request: Request, options: NormalizedOptions) => Promise<Response>;

export function isChallengeResponse(response: Response): boolean {
  return response.headers.get('cf-mitigated') === 'challenge';
}

function requestEndpoint(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/**
 * ky afterResponse hook shared by all background ZPI calls.
 *
 * Detection and retry live here; the coordinator owns deduplication, surfaces,
 * timeouts and the single resolution. The retry strips this hook so a stale
 * clearance cannot loop.
 */
export function createChallengeAfterResponse({
  getHandler,
  retry,
}: {
  getHandler: () => BackgroundChallengeHandler | null;
  retry: Retry;
}): AfterResponseHook {
  return async (request, options, response) => {
    if (!isChallengeResponse(response)) {
      return response;
    }
    const handler = getHandler();
    if (!handler) {
      return response;
    }
    try {
      const critical = await handler.isCriticalRequest(request.url);
      await handler.handleChallenge({ endpoint: requestEndpoint(request.url) });
      const solved = await handler.waitForSolve(critical);
      if (!solved) {
        return response;
      }
      // NormalizedOptions carries `hooks` at runtime even though ky's type
      // omits it. Strip them so the retry cannot run this hook again.
      const retryOptions = { ...options } as NormalizedOptions & { hooks?: unknown };
      delete retryOptions.hooks;
      return await retry(request, retryOptions);
    } catch (error) {
      console.warn('Background Cloudflare challenge handling failed', error); // eslint-disable-line no-console
      return response;
    }
  };
}
