import type { BareWallet } from 'src/shared/types/BareWallet';
import type { Permission } from 'src/shared/types/Permission';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { walletPort } from '../channels';

type PermissionRecord = Record<string, Permission>;

export type ConnectedSiteItem = Permission & {
  origin: string;
  wallets: BareWallet[];
};

function createBareWallet(address: string): BareWallet {
  return {
    address,
    mnemonic: null,
    privateKey: '<privateKey>',
    name: null,
  };
}

function updatePermissionsWithWallets(
  permissions: PermissionRecord,
  walletGroups: WalletGroup[]
): ConnectedSiteItem[] {
  const walletsMap = new Map(
    walletGroups
      .flatMap((group) => group.walletContainer.wallets)
      .map((wallet) => [wallet.address, wallet])
  );
  const result: ConnectedSiteItem[] = [];
  for (const origin in permissions) {
    const permission = permissions[origin];
    result.push({
      ...permission,
      origin,
      wallets: permission.addresses.map((address) => {
        const wallet = walletsMap.get(address);
        return wallet || createBareWallet(address);
      }),
    });
  }
  return result;
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
