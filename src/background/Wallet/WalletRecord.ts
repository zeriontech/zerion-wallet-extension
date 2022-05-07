import type { BareWallet } from './Wallet';

type Origin = string;
type Address = string;

export interface WalletRecord {
  wallet: BareWallet | null;
  permissions: Record<Origin, Address>;
}

export function createEmptyRecord(): WalletRecord {
  return {
    wallet: null,
    permissions: {},
  };
}
