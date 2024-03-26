export function getCustomNetworkId(networkId: string) {
  return `zerion-extension-${networkId}`;
}

export function isCustomNetworkId(networkId: string) {
  return networkId.startsWith('zerion-extension-');
}
