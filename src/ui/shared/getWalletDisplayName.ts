import type { BareWallet } from 'src/shared/types/BareWallet';
import { truncateAddress } from './truncateAddress';

export function emojify(value: string) {
  if (
    /\bhacked\b/i.test(value) ||
    /\bleaked\b/i.test(value) ||
    /\blost\b/i.test(value)
  ) {
    return `${value} 😱`;
  } else {
    return value;
  }
}

export function getWalletDisplayName(
  wallet: Pick<BareWallet, 'address' | 'name'>,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
) {
  if (!wallet.address) {
    throw new Error(
      `Address is missing from Wallet object: ${JSON.stringify(wallet)}`
    );
  }
  const displayName = wallet.name ?? truncateAddress(wallet.address, padding);
  const value = emojify(displayName);

  if (maxCharacters && value.length > maxCharacters) {
    return truncateAddress(value, Math.floor((maxCharacters - 1) / 2));
  } else {
    return value;
  }
}
