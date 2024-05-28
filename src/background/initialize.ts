import { prepareStorage } from 'src/shared/core/version';
import { DnaService } from 'src/modules/dna-service/dna.background';
import { initialize as initializeAnalytics } from 'src/shared/analytics/analytics.background';
import { initialize as initializeRemoteConfig } from 'src/modules/remote-config';
import { initialize as initializeLiteweightChainSupport } from './requests/liteweight-chain-support';
import { InDappNotificationService } from './in-dapp-notifications';
import { Account, AccountPublicRPC } from './account/Account';
import { transactionService } from './transactions/TransactionService';
import { globalPreferences } from './Wallet/GlobalPreferences';
import { NotificationWindow } from './NotificationWindow/NotificationWindow';
import { setUninstallURL } from './uninstall';

let didInitialize = false;

export async function initialize() {
  if (didInitialize) {
    throw new Error('Initialize function should be run only once');
  }
  didInitialize = true;

  await prepareStorage();

  // This method is called only when background script runs for the first time
  // This means that either the user is opening the extension for the first time,
  // or that the browser decided to "restart" the background scripts
  // Either way, we either create a user from scratch or find one in storage
  await Account.ensureUserAndWallet();

  const notificationWindow = new NotificationWindow();
  await notificationWindow.initialize();
  const account = new Account({ notificationWindow });
  await account.initialize();
  const accountPublicRPC = new AccountPublicRPC(account);
  const dnaService = new DnaService();
  dnaService.initialize();
  await transactionService.initialize({
    getWallet: () => account.getCurrentWallet(),
  });
  initializeRemoteConfig().then(() => {
    globalPreferences.initialize();
    setUninstallURL();
  });
  initializeAnalytics({ account });
  initializeLiteweightChainSupport(account);

  const inDappNotificationService = new InDappNotificationService({
    getWallet: () => account.getCurrentWallet(),
  });
  inDappNotificationService.initialize();

  Object.assign(globalThis, {
    account,
    Account,
    accountPublicRPC,
    dnaService,
    transactionService,
    globalPreferences,
    notificationWindow,
  });
  return {
    account,
    accountPublicRPC,
    transactionService,
    dnaService,
    notificationWindow,
  };
}
