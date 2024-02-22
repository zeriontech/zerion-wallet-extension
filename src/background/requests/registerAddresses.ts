import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { WalletOrigin } from 'src/shared/WalletOrigin';
import { emitter } from '../events';

export function initialize() {
  emitter.on('walletCreated', async ({ walletContainer, origin }) => {
    if (origin === WalletOrigin.imported) {
      ZerionAPI.registerAddresses({
        addressses: walletContainer.wallets.map((wallet) => wallet.address),
      });
    }
  });
}
