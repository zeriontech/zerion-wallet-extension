import type { BareWallet } from 'src/shared/types/BareWallet';
import { truncateAddress } from './truncateAddress';

export function emojify(value: string) {
  const lowerCase = value.toLowerCase();
  if (
    lowerCase.includes('hacked') ||
    lowerCase.includes('leaked') ||
    lowerCase.includes('lost')
  ) {
    return `${value} 😱`;
  } else {
    return value;
  }
}

export function getWalletDisplayName(
  wallet: BareWallet,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
) {
  const name = wallet.name ?? truncateAddress(wallet.address, padding);
  const value = emojify(name);

  if (maxCharacters && value.length > maxCharacters) {
    return truncateAddress(value, Math.floor((maxCharacters - 1) / 2));
  } else {
    return value;
  }
}
