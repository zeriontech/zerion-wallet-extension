import { nanoid } from 'nanoid';
import { invariant } from 'src/shared/invariant';

export function setChannelIdInDom(): string {
  const scriptWithId = document.getElementById('zerion-extension-channel');
  if (!scriptWithId) {
    const id = nanoid();
    const script = document.createElement('script');
    script.setAttribute('id', 'zerion-extension-channel');
    script.dataset.walletChannelId = id;
    script.dataset.walletExtension = 'true';
    const container = document.head || document.documentElement;
    container.appendChild(script);
    return id;
  } else {
    const id = scriptWithId.dataset.walletChannelId;
    invariant(id, 'set: walletChannelId missing from script tag');
    return id;
  }
}
