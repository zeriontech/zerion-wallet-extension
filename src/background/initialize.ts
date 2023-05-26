import { prepareStorage } from 'src/shared/core/version';
import { DnaService } from 'src/ui/components/DnaClaim/dna.background';
import { initialize as dappRegistryInitialize } from 'src/shared/dapps';
import { initialize as initializeAnalytics } from 'src/shared/analytics/analytics.background';
import { initialize as initializeRemoteConfig } from 'src/modules/remote-config';
import { Account, AccountPublicRPC } from './account/Account';
import { TransactionService } from './transactions/TransactionService';
import { GlobalPreferences } from './Wallet/GlobalPreferences';

let didInitialize = false;

export async function initialize() {
  if (didInitialize) {
    throw new Error('Initialize function should be run only once');
  }
  didInitialize = true;

  await prepareStorage();
  await dappRegistryInitialize();

  // This method is called only when background script runs for the first time
  // This means that either the user is opening the extension for the first time,
  // or that the browser decided to "restart" the background scripts
  // Either way, we either create a user from scratch or find one in storage
  await Account.ensureUserAndWallet();
  const globalPreferences = new GlobalPreferences({}, 'globalPreferences');
  const account = new Account({ globalPreferences });
  await account.initialize();
  const accountPublicRPC = new AccountPublicRPC(account);
  const transactionService = new TransactionService();
  const dnaService = new DnaService(account);
  dnaService.initialize();
  await transactionService.initialize();
  initializeRemoteConfig().then(() => {
    globalPreferences.initialize();
  });
  initializeAnalytics({ account });

  Object.assign(globalThis, {
    account,
    Account,
    accountPublicRPC,
    dnaService,
    transactionService,
    globalPreferences,
  });
  return {
    account,
    accountPublicRPC,
    transactionService,
    dnaService,
    globalPreferences,
  };
}
