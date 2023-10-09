import type { Hooks } from 'defi-sdk';

const willSendRequestHooks: Set<Hooks['willSendRequest']> = new Set();

export function registerRequestHooks(hooks: Partial<Hooks>) {
  if (hooks.willSendRequest) {
    willSendRequestHooks.add(hooks.willSendRequest);
  }
}

export const hooks: Hooks = {
  willSendRequest: (request, options) => {
    let promise = Promise.resolve(request);
    for (const hook of willSendRequestHooks) {
      promise = promise.then((nextRequest) => {
        return hook(nextRequest, options);
      });
    }
    return promise;
  },
};
