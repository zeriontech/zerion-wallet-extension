import { ellipsis } from './typography';

export function truncateAddress(address: string, padding = 6) {
  const leadingPadding = address.startsWith('0x') ? 2 + padding : padding;
  return `${address.slice(0, leadingPadding)}${ellipsis}${address.slice(
    0 - padding
  )}`;
}
