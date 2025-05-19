import { nanoid } from 'nanoid';
import { invariant } from 'src/shared/invariant';

export function getWalletChannelId(): string {
  const scriptWithId = document.getElementById('zerion-extension-channel');
  let id = scriptWithId?.dataset.walletChannelId;
  if (!scriptWithId) {
    id = nanoid();
    // Insert script with id for provider _after_ creating a BroadcastChannel
    const script = document.createElement('script');
    script.setAttribute('id', 'zerion-extension-channel');
    script.dataset.walletChannelId = id;
    script.dataset.walletExtension = 'true';
    const container = document.head || document.documentElement;
    container.appendChild(script);
  } else {
    scriptWithId.remove(); // Remove script to preserve initial DOM shape
  }
  invariant(
    id,
    'walletChannelId must be defined as a data attribute on the script tag'
  );
  return id;
}
