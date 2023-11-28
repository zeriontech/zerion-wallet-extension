import { dnaServicePort } from '../../ui/shared/channels';

export function initDnaApi() {
  // dnaServicePort.request('developerOnly_resetActionQueue');
  dnaServicePort.request('tryRegisterAction');
}

export async function updateAddressDnaInfo(address: string) {
  await dnaServicePort.request('gm', { address });
  await dnaServicePort.request('registerWallet', { address });
}
