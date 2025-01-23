import browser from 'webextension-polyfill';
import type { InDappNotification } from 'src/shared/types/InDappNotification';
import { isObj } from 'src/shared/isObj';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import * as styles from './styles.module.css';
import { createNode as r } from './createNode';

function preloadImage(url: string): Promise<void> {
  return Promise.race<void>([
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = reject;
    }),
    rejectAfterDelay(2000, `Failed to preload network icon: ${url}`),
  ]);
}

const notifications = {
  async chainChanged(networkName: string, networkUrl: string) {
    let isIconLoaded = false;
    try {
      await preloadImage(networkUrl);
      isIconLoaded = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to load network icon ${networkUrl}`, e);
    }

    const networkIcon = isIconLoaded
      ? r('img', { src: networkUrl, class: styles.networkIcon, alt: '' })
      : null;

    // prettier-ignore
    const el = r('div', { class: `${styles.notification} ${styles.chainChanged}` },
      r('div',null,
        r('div', { class: styles.hstack, style: 'grid-gap: 12px; background: pink;' },
          r('div', { class: styles.zerionLogo }, networkIcon),
          r('div', { class: styles.vstack, style: 'grid-gap: 0px;' },
            r('div', { class: styles.title }, 'Network Switched'),
            r('div', { class: styles.message }, networkName),
          ),
        ),
        r('button', { 'aria-label': 'Close', class:styles.closeButton})
      )
    )

    return el;
  },

  switchChainError(chainId: string) {
    // prettier-ignore
    const el = r('div', { class: `${styles.notification} ${styles.switchChainError}`},
      r('div', { class: styles.vstack, style: 'grid-gap: 8px;' },
        r('div', { class: styles.hstack, style: 'grid-gap: 12px' },
          r('div', { class: styles.zerionLogo }),
          r('div', { class: styles.title }, 'Unrecognized Network')
        ),
        r('div', { class: styles.message },
          'Unable to switch network to the ',
          r('span', { class: styles.chainId }, `Chain Id: ${chainId.toString()}`),
          '.\nPlease check your network settings and try again.'
        )
      ),
      r('button', { 'aria-label': 'Close', class: styles.closeButton })
    )

    return el;
  },
};

async function createNotification(notification: InDappNotification) {
  if (notification.notificationEvent === 'chainChanged') {
    return await notifications.chainChanged(
      notification.networkName,
      notification.networkIcon
    );
  } else {
    return notifications.switchChainError(notification.chainId);
  }
}

function clearNotifications() {
  document
    .querySelectorAll(`.${styles.notification}`)
    .forEach((el) => el.remove());
}

function removeNotification(el: HTMLElement) {
  el.classList.add(styles.fadeOut);
  setTimeout(() => {
    el.remove();
  }, 300);
}

async function showNotification(notification: InDappNotification) {
  clearNotifications();
  const el = await createNotification(notification);
  document.body.appendChild(el);

  const closeTimeout =
    notification.notificationEvent === 'switchChainError' ? 3500 : 2400;
  setTimeout(() => {
    el.classList.add(styles.show);
  }, 100);
  setTimeout(() => {
    removeNotification(el);
  }, closeTimeout);

  el.querySelector(`.${styles.closeButton}`)?.addEventListener('click', () => {
    removeNotification(el);
  });
}

function isDappNotification(message: unknown): message is InDappNotification {
  return isObj(message) && 'notificationEvent' in message;
}

export function initializeInDappNotifications() {
  browser.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    // Check if the message is from the background script (extension process).
    // Messages from background scripts will not have the `sender.tab` property.
    if (!sender.tab && isDappNotification(message)) {
      showNotification(message);
    }
  });
}
