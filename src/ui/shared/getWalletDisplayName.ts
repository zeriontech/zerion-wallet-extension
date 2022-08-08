import type { BareWallet } from 'src/shared/types/BareWallet';
import { truncateAddress } from './truncateAddress';

export function getWalletDisplayName(
  wallet: BareWallet,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
) {
  const value = wallet.name ?? truncateAddress(wallet.address, padding);
  if (maxCharacters && value.length > maxCharacters) {
    return truncateAddress(value, Math.floor((maxCharacters - 1) / 2));
  } else {
    return value;
  }
}
