import { describe, expect, it } from '@jest/globals';
import type { WalletContainer } from 'src/background/Wallet/model/types';
import { getPendingRowActions } from './getPendingRowActions';
import {
  EVM_ADDRESS,
  NOW_MS,
  evmNotReadyRow,
  evmPendingRow,
  evmReadyRow,
} from './signPendingAction.fixtures';

const wallet = { address: EVM_ADDRESS, name: null };

// The masked containers `getWalletGroupByAddress` returns, per kind
const CONTAINERS: Record<string, WalletContainer | null | undefined> = {
  mnemonic: { wallets: [wallet], seedType: 1 } as unknown as WalletContainer,
  privateKey: { wallets: [wallet], seedType: 0 } as unknown as WalletContainer,
  ledger: {
    wallets: [{ ...wallet, derivationPath: "m/44'/60'/0'/0/0" }],
    device: { productId: 1, vendorId: 11415 },
    provider: 'ledger',
  } as unknown as WalletContainer,
  watchlist: {
    wallets: [wallet],
    provider: null,
  } as unknown as WalletContainer,
  unknown: null,
  loading: undefined,
};

const ROWS = {
  readyToSign: evmReadyRow(),
  readyIn: evmNotReadyRow(),
  broadcastedPending: evmPendingRow('pending-row', `0x${'ab'.repeat(32)}`),
};

const NONE = { rowSign: false, infoSign: false, infoDismiss: false };

const EXPECTED: Record<
  keyof typeof ROWS,
  { rowSign: boolean; infoSign: boolean; infoDismiss: boolean }
> = {
  readyToSign: { rowSign: true, infoSign: true, infoDismiss: true },
  readyIn: { rowSign: false, infoSign: false, infoDismiss: true },
  broadcastedPending: NONE,
};

const OWN_WALLETS = ['mnemonic', 'privateKey', 'ledger'];

describe('getPendingRowActions', () => {
  const cases = Object.keys(ROWS).flatMap((status) =>
    Object.keys(CONTAINERS).map((kind) => ({
      status: status as keyof typeof ROWS,
      kind,
    }))
  );

  it.each(cases)('$status row × $kind wallet', ({ status, kind }) => {
    expect(
      getPendingRowActions(ROWS[status], CONTAINERS[kind], NOW_MS)
    ).toEqual(OWN_WALLETS.includes(kind) ? EXPECTED[status] : NONE);
  });

  it('offers Sign once the readiness time passes', () => {
    const row = evmNotReadyRow();
    const ownWallet = CONTAINERS.mnemonic;
    expect(getPendingRowActions(row, ownWallet, NOW_MS).rowSign).toBe(false);
    expect(
      getPendingRowActions(row, ownWallet, row.availableAt ?? Infinity).rowSign
    ).toBe(true);
  });
});
