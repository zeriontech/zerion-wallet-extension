import { isConnectableDapp } from '../../ConnectedSites/shared/isConnectableDapp';

/**
 * Pure helper deriving the Overview connection-dot state from the active-tab
 * URL and the current wallet's connection flag.
 *
 * - `visible` only when the active tab is a connectable dapp site
 *   (hidden on internal pages and non-websites).
 * - `color` is green when the current wallet is connected to the active tab,
 *   gray when the site is connectable but the wallet isn't connected.
 */
export function getConnectionDotState({
  url,
  isConnected,
}: {
  url: URL | null | undefined;
  isConnected: boolean | null | undefined;
}): { visible: boolean; color: string } {
  const visible = url ? isConnectableDapp(url) : false;
  const color = isConnected ? 'var(--positive-500)' : 'var(--neutral-400)';
  return { visible, color };
}
