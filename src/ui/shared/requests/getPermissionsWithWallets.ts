import type { BareWallet } from 'src/shared/types/BareWallet';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { walletPort } from '../channels';

interface PermissionRecord {
  origin: string;
  addresses: string[];
}

export interface ConnectedSiteItem {
  origin: string;
  addresses: string[];
  wallets: BareWallet[];
}

function createBareWallet(address: string): BareWallet {
  return {
    address,
    mnemonic: null,
    privateKey: '<privateKey>',
    name: null,
  };
}

function updatePermissionsWithWallets(
  permissions: PermissionRecord[],
  walletGroups: WalletGroup[]
): ConnectedSiteItem[] {
  const walletsMap = new Map(
    walletGroups
      .flatMap((group) => group.walletContainer.wallets)
      .map((wallet) => [wallet.address, wallet])
  );
  return permissions.map((permission) => ({
    ...permission,
    wallets: permission.addresses.map((address) => {
      const wallet = walletsMap.get(address);
      return wallet || createBareWallet(address);
    }),
  }));
}

export async function getPermissionsWithWallets() {
  const [originPermissions, walletGroups] = await Promise.all([
    walletPort.request('getOriginPermissions'),
    walletPort.request('uiGetWalletGroups'),
  ]);
  const connectedSites = walletGroups
    ? updatePermissionsWithWallets(originPermissions, walletGroups)
    : null;
  return connectedSites;
}
