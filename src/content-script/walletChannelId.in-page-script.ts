import { invariant } from 'src/shared/invariant';

export function popWalletChannelId(): string {
  const scriptWithId = document.getElementById('zerion-extension-channel');
  const id = scriptWithId?.dataset.walletChannelId;
  invariant(id, 'read: walletChannelId missing from script tag');
  scriptWithId?.remove(); // Remove script to preserve initial DOM shape
  return id;
}
