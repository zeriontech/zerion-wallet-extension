import type { Params, Result } from './getFirstNMnemonicWallets.worker';
// @ts-ignore parcel syntax for bundle url
import workerPath from 'url:./getFirstNMnemonicWallets.worker';

export async function getFirstNMnemonicWallets(params: Params) {
  return new Promise<Result>((resolve, reject) => {
    const worker = new Worker(workerPath);
    worker.postMessage(params);
    worker.onmessage = (event: MessageEvent<Result>) => {
      resolve(event.data);
    };
    worker.onerror = (event) => {
      reject(event.message);
    };
  });
}
