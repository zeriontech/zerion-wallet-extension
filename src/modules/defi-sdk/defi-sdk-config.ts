import type { Hooks } from 'defi-sdk';

const willSendRequestHooks: Set<Hooks['willSendRequest']> = new Set();

export function registerRequestHooks(hooks: Partial<Hooks>) {
  if (hooks.willSendRequest) {
    willSendRequestHooks.add(hooks.willSendRequest);
  }
}

export const hooks: Hooks = {
  willSendRequest: (request, options) => {
    const finalRequest = Array.from(willSendRequestHooks).reduce(
      (nextRequest, hook) => hook(nextRequest, options),
      request
    );
    return finalRequest;
  },
};
