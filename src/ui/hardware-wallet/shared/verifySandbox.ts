import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import { PORT_NAMES } from 'src/shared/portNames';
import type { RPCPort } from 'src/ui/shared/channels.types';
import type { Wallet } from 'src/shared/types/Wallet';

const walletPort = new PortMessageChannel({
  name: PORT_NAMES.wallet,
}) as RPCPort<Wallet>;

export async function verifySandbox() {
  /**
   * We expect to be in an isolated sandbox environment
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
    },
  );
}
