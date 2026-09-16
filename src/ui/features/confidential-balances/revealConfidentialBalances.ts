import { INTERNAL_ORIGIN } from 'src/background/constants';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import type { StoredPermit } from 'src/shared/types/ConfidentialPermit';
import { walletPort } from 'src/ui/shared/channels';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { invalidateConfidentialPermits } from './useConfidentialPermits';
import { createFakePermits } from './fakePermits';
import { signPermitBatch, type PermitSigner } from './signPermitBatch';
import { trackConfidentialEvent } from './analytics';

export const CONFIDENTIAL_CLIENT_SCOPE = 'Confidential Balances';

export async function preparePermits(
  address: string,
  source: NetworksSource
): Promise<Permit[]> {
  if (devMenuStore.getState().confidentialPermitsOverride === 'fake') {
    return createFakePermits(address);
  }
  const response = await ZerionAPI.walletPreparePermits(
    { address },
    { source }
  );
  return response?.data?.permits ?? [];
}

export { PermitSigningError, type PermitSigner } from './signPermitBatch';

/** The confidential permits' context for the background: internal, one scope */
export const CONFIDENTIAL_TYPED_DATA_CONTEXT = {
  initiator: INTERNAL_ORIGIN,
  clientScope: CONFIDENTIAL_CLIENT_SCOPE,
};

/**
 * Silent signer: the background's offline signer, i.e. the *current* wallet,
 * so the Reveal's `address` must be the current address; the dialog
 * guarantees that.
 */
export const signWithBackground: PermitSigner = (typedData: TypedData) =>
  walletPort.request('signTypedData_v4', {
    typedData,
    typedDataContext: CONFIDENTIAL_TYPED_DATA_CONTEXT,
  });

/**
 * Ledger signer: the device signs through the mounted `HardwareSignMessage`,
 * and the background is told about it the way `SignMessageButton` does, so
 * analytics and the sign log see the same event as for the silent flow.
 */
export function createLedgerPermitSigner(
  address: string,
  signOnDevice: (typedData: TypedData) => Promise<string>
): PermitSigner {
  return async (typedData) => {
    const signature = await signOnDevice(typedData);
    walletPort
      .request('registerTypedDataSign', {
        typedData,
        address,
        ...CONFIDENTIAL_TYPED_DATA_CONTEXT,
      })
      .catch(() => null);
    return signature;
  };
}

/**
 * Signs every Permit with `sign` and stores the resulting Signed Permits in
 * the background's storage.session (ADR-0007). The whole batch is stored at
 * once — a failure midway leaves the wallet as it was. `onStep(index)` reports which permit is being signed so
 * the Ledger flow can render its Signing steps; the silent flow ignores it.
 */
export async function signPermits(
  address: string,
  permits: Permit[],
  {
    sign = signWithBackground,
    onStep,
  }: { sign?: PermitSigner; onStep?: (index: number) => void } = {}
): Promise<StoredPermit[]> {
  const stored = await signPermitBatch(address, permits, sign, {
    onStep,
    onSigned: (index, permit) =>
      trackConfidentialEvent({
        name: 'permitSigned',
        params: { chain: permit.chain, index },
      }),
  });
  await walletPort.request('setConfidentialPermits', {
    address,
    permits: stored,
  });
  await invalidateConfidentialPermits();
  return stored;
}
