const ETHEREUM_ADDRESS_REGEXP = /^0x[a-fA-F0-9]{40}$/;

export function isEthereumAddress(address: string) {
  return ETHEREUM_ADDRESS_REGEXP.test(address);
}
