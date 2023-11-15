import type { ConnectedSiteItem } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { isConnectableDapp } from './isConnectableDapp';

function createConnectedSite({
  origin,
}: {
  origin: string;
}): ConnectedSiteItem {
  return {
    origin,
    addresses: [],
    wallets: [],
  };
}

export function getConnectedSite(
  originName: string,
  connectedSites?: ConnectedSiteItem[] | null
) {
  const found = connectedSites?.find((site) => site.origin === originName);
  if (found) {
    return found;
  } else if (isConnectableDapp(new URL(originName))) {
    return createConnectedSite({ origin: originName });
  }
}
