import { describe, expect, it, vi } from 'vite-plus/test';
import type { NormalizedOptions } from 'ky';
import type { BackgroundChallengeHandler } from './challenge-hook';
import { createChallengeAfterResponse, isChallengeResponse } from './challenge-hook';

function challengeResponse() {
  return new Response('{}', {
    status: 403,
    headers: { 'cf-mitigated': 'challenge' },
  });
}

function handler(overrides: Partial<BackgroundChallengeHandler> = {}) {
  return {
    isCriticalRequest: vi.fn(async () => false),
    handleChallenge: vi.fn(async () => {}),
    waitForSolve: vi.fn(async () => true),
    ...overrides,
  } satisfies BackgroundChallengeHandler;
}

const request = new Request('https://zpi.zerion.io/wallet/get-portfolio/v1');
const options = {
  headers: new Headers(),
  hooks: { afterResponse: [() => undefined] },
} as unknown as NormalizedOptions;

describe('isChallengeResponse', () => {
  it('detects the Cloudflare header only', () => {
    expect(isChallengeResponse(challengeResponse())).toBe(true);
    expect(isChallengeResponse(new Response('{}', { status: 403 }))).toBe(false);
  });
});

describe('background challenge afterResponse hook', () => {
  it('detects the challenge and retries the request after the clearance is solved', async () => {
    const challengeHandler = handler();
    const retried = new Response('{"ok":true}', { status: 200 });
    const retry = vi.fn(async (..._args: [Request, NormalizedOptions]) => retried);
    const hook = createChallengeAfterResponse({
      getHandler: () => challengeHandler,
      retry,
    });

    await expect(hook(request, options, challengeResponse())).resolves.toBe(retried);

    expect(challengeHandler.handleChallenge).toHaveBeenCalledWith({
      endpoint: '/wallet/get-portfolio/v1',
    });
    expect(retry).toHaveBeenCalledTimes(1);
    const retryOptions = retry.mock.calls[0][1];
    expect('hooks' in retryOptions).toBe(false);
  });

  it('returns the challenge response when the solve times out', async () => {
    const challengeHandler = handler({ waitForSolve: vi.fn(async () => false) });
    const retry = vi.fn(async () => new Response('{}'));
    const hook = createChallengeAfterResponse({
      getHandler: () => challengeHandler,
      retry,
    });
    const response = challengeResponse();

    await expect(hook(request, options, response)).resolves.toBe(response);
    expect(retry).not.toHaveBeenCalled();
  });

  it('passes criticality from the handler to the wait', async () => {
    const challengeHandler = handler({ isCriticalRequest: vi.fn(async () => true) });
    const hook = createChallengeAfterResponse({
      getHandler: () => challengeHandler,
      retry: vi.fn(async () => new Response('{}', { status: 200 })),
    });

    await hook(request, options, challengeResponse());
    expect(challengeHandler.waitForSolve).toHaveBeenCalledWith(true);
  });

  it('ignores responses that are not challenges', async () => {
    const challengeHandler = handler();
    const retry = vi.fn(async () => new Response('{}'));
    const hook = createChallengeAfterResponse({
      getHandler: () => challengeHandler,
      retry,
    });
    const response = new Response('{"ok":true}', { status: 200 });

    await expect(hook(request, options, response)).resolves.toBe(response);
    expect(challengeHandler.isCriticalRequest).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
  });

  it('leaves the request alone when the feature is off', async () => {
    const response = challengeResponse();
    const hook = createChallengeAfterResponse({
      getHandler: () => null,
      retry: vi.fn(async () => new Response('{}')),
    });

    await expect(hook(request, options, response)).resolves.toBe(response);
  });

  it('does not fail the request when the coordinator throws', async () => {
    const response = challengeResponse();
    const challengeHandler = handler({
      handleChallenge: vi.fn(async () => {
        throw new Error('chrome api unavailable');
      }),
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const hook = createChallengeAfterResponse({
        getHandler: () => challengeHandler,
        retry: vi.fn(async () => new Response('{}')),
      });
      await expect(hook(request, options, response)).resolves.toBe(response);
    } finally {
      warn.mockRestore();
    }
  });
});
