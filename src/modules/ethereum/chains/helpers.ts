export function getCustomNetworkId(chainId: number) {
  return `zerion-extension-${chainId}`;
}

export function isCustomNetworkId(networkId: string) {
  return networkId.startsWith('zerion-extension-');
}
