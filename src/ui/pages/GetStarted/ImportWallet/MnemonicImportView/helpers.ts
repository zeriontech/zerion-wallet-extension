import groupBy from 'lodash/groupBy';
import type { MaskedBareWallet } from 'src/shared/types/BareWallet';
import type { DerivationPathType } from 'src/shared/wallet/derivation-paths';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { FEATURE_SOLANA } from 'src/env/config';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { getFirstNMnemonicWallets } from './getFirstNMnemonicWallets';

export type DerivedWallets = Array<{
  curve: 'ecdsa' | 'ed25519';
  pathType: DerivationPathType;
  wallets: MaskedBareWallet[];
}>;

export async function prepareWalletsToImport(phrase: LocallyEncoded): Promise<{
  derivedWallets: DerivedWallets;
  addressesToCheck: string[];
} | void> {
  const fn = getFirstNMnemonicWallets;
  const solanaEnabled = FEATURE_SOLANA === 'on';
  const [eth, sol1, sol2, sol3] = await Promise.all([
    fn({ phrase, n: 30, curve: 'ecdsa' }),
    /** We want to explore all derivation paths in case there are active addresses */
    solanaEnabled
      ? fn({ phrase, n: 30, curve: 'ed25519', pathType: 'solanaBip44Change' })
      : Promise.resolve([]),
    solanaEnabled
      ? fn({ phrase, n: 30, curve: 'ed25519', pathType: 'solanaBip44' })
      : Promise.resolve([]),
    solanaEnabled
      ? fn({ phrase, n: 30, curve: 'ed25519', pathType: 'solanaDeprecated' })
      : Promise.resolve([]),
  ]);
  const derivedWallets = [
    { curve: 'ecdsa' as const, pathType: 'bip44' as const, wallets: eth },
    {
      curve: 'ed25519' as const,
      pathType: 'solanaBip44Change' as const,
      wallets: sol1,
    },
    {
      curve: 'ed25519' as const,
      pathType: 'solanaBip44' as const,
      wallets: sol2,
    },
    {
      curve: 'ed25519' as const,
      pathType: 'solanaDeprecated' as const,
      wallets: sol3,
    },
  ];
  const WALLETS_TO_CHECK_PER_PATH = 10; // this number is small to reduce load on backend
  return {
    derivedWallets,
    addressesToCheck: derivedWallets.flatMap((config) =>
      config.wallets.slice(0, WALLETS_TO_CHECK_PER_PATH).map((w) => w.address)
    ),
  };
}

export function suggestInitialWallets({
  wallets,
  activeWallets,
  existingAddressesSet,
}: {
  wallets: DerivedWallets;
  activeWallets: Record<string, { active: boolean }>;
  existingAddressesSet: Set<string>;
}): {
  activeCount: number;
  groups: { ecosystem: BlockchainType; wallets: MaskedBareWallet[] }[];
} {
  const allWallets = wallets.flatMap((config) => config.wallets);
  const newOnes = allWallets.filter(
    (w) => !existingAddressesSet.has(normalizeAddress(w.address))
  );
  const grouped = groupBy(newOnes, ({ address }) =>
    activeWallets[normalizeAddress(address)]?.active ? 'active' : 'rest'
  );
  const { active, rest } = grouped as Record<
    'active' | 'rest',
    MaskedBareWallet[] | undefined
  >;
  if (active?.length) {
    // display all found active addresses
    const ethWallets = active.filter((w) => isEthereumAddress(w.address));
    const solWallets = active.filter((w) => isSolanaAddress(w.address));
    return {
      activeCount: active.length,
      groups: [
        { ecosystem: 'evm', wallets: ethWallets },
        { ecosystem: 'solana', wallets: solWallets },
      ],
    };
  } else {
    // display only one eth and one solana address
    const ethWallet = rest?.find((w) => isEthereumAddress(w.address));
    const solanaWallet = rest?.find((w) => isSolanaAddress(w.address));
    return {
      activeCount: 0,
      groups: [
        { ecosystem: 'evm', wallets: ethWallet ? [ethWallet] : [] },
        { ecosystem: 'solana', wallets: solanaWallet ? [solanaWallet] : [] },
      ],
    };
  }
}
