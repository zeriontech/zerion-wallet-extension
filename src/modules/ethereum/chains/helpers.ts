export function getCustomNetworkId(chainId: string) {
  return `zerion-extension-${chainId}`;
}

export function isCustomNetworkId(networkId: string) {
  return networkId.startsWith('zerion-extension-');
}
