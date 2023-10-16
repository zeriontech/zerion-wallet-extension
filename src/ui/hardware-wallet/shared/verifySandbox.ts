import browser from 'webextension-polyfill';
import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import type { RPCPort } from 'src/ui/shared/channels.types';
import type { Wallet } from 'src/shared/types/Wallet';

const walletPort = new PortMessageChannel({
  name: `${browser.runtime.id}/wallet`,
}) as RPCPort<Wallet>;

export async function verifySandbox() {
  /**
   * We expect to be in an isolated sandbox enviroment
   * To verify this, we try to query our own background script
   * It is EXPECTED to reject the request.
   * If it resolves successfully, we MUST halt the script
   * to indicate that some setup went wrong.
   */
  return walletPort.request('uiGetCurrentWallet').then(
    () => {
      throw new Error('Ledger code is not sandboxed!');
    },
    () => {
      return null; // we're safe
    }
  );
}
