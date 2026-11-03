import { nanoid } from 'nanoid';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { IntentMultichain } from 'src/shared/types/Quote';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import { invariant } from 'src/shared/invariant';
import {
  isDeviceAccount,
  isReadonlyContainer,
} from 'src/shared/types/validators';
import { prepareTypedDataForSigning } from 'src/modules/ethereum/message-signing/prepareTypedDataForSigning';
import {
  IntentSignerSlotError,
  assertSolSigner,
  assertSolTransactionSignedBy,
} from 'src/modules/solana/intentSignerSlots';
import { walletPort } from 'src/ui/shared/channels';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { getLedgerIframeController } from 'src/ui/hardware-wallet/useLedgerIframeController';
import { hardwareMessageHandler } from 'src/ui/pages/HardwareWalletConnection/shared/messageHandler';
import { signSolanaTransaction } from 'src/ui/pages/HardwareWalletConnection/HardwareSignTransaction/HardwareSignTransaction';
import { ReadonlyWalletError } from 'src/ui/components/TransactionSigner/errors';

export { IntentSignerSlotError };

async function signIntentHardware(
  wallet: DeviceAccount,
  intent: IntentMultichain
): Promise<string> {
  const controller = getLedgerIframeController();
  invariant(controller, 'Ledger iframe controller not mounted');
  const contentWindow = controller.getContentWindow();
  invariant(contentWindow, 'Ledger iframe contentWindow not available');
  if (intent.evm) {
    return hardwareMessageHandler.request<string>(
      {
        id: nanoid(),
        method: 'signTypedData_v4',
        params: {
          derivationPath: wallet.derivationPath,
          typedData: prepareTypedDataForSigning(intent.evm),
        },
      },
      contentWindow
    );
  }
  invariant(intent.solana, 'Intent must carry an evm or solana payload');
  return signSolanaTransaction({
    transaction: intent.solana as StringBase64,
    messageHandler: hardwareMessageHandler,
    derivationPath: wallet.derivationPath,
    contentWindow,
  });
}

async function signIntentSoftware(
  wallet: ExternallyOwnedAccount,
  intent: IntentMultichain
) {
  const group = await getWalletGroupByAddress(wallet.address);
  if (group && isReadonlyContainer(group.walletContainer)) {
    throw new ReadonlyWalletError(wallet.address);
  }
  return walletPort.request('signSwapIntent', { intent });
}

/** evm → 0x-hex EIP-712 signature; solana → base64 signed transaction. Must run inside the signing queue for Ledger (iframe mounted). */
export async function signIntent({
  wallet,
  intent,
}: {
  wallet: ExternallyOwnedAccount;
  intent: IntentMultichain;
}): Promise<string> {
  const solanaTransaction = intent.evm ? null : intent.solana;
  if (solanaTransaction) {
    assertSolSigner(solanaTransaction, wallet.address);
  }
  const signed = isDeviceAccount(wallet)
    ? await signIntentHardware(wallet, intent)
    : await signIntentSoftware(wallet, intent);
  if (solanaTransaction) {
    assertSolTransactionSignedBy(solanaTransaction, signed, wallet.address);
  }
  return signed;
}
