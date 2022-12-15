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
  address: string,
  name?: string | null,
  {
    padding = 4,
    maxCharacters,
  }: { padding?: number; maxCharacters?: number } = {}
) {
  const displayName = name ?? truncateAddress(address, padding);
  const value = emojify(displayName);

  if (maxCharacters && value.length > maxCharacters) {
    return truncateAddress(value, Math.floor((maxCharacters - 1) / 2));
  } else {
    return value;
  }
}
