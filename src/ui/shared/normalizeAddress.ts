export function normalizeAddress(address: string) {
  return address.startsWith('0x') ? address.toLowerCase() : address;
}
