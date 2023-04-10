import { prepareStorage } from 'src/shared/core/version';
import { DnaService } from 'src/ui/components/DnaClaim/dna.background';
import { QueryService } from 'src/ui/shared/requests/queries/queryClient.background';
import { initialize as dappRegistryInitialize } from 'src/shared/dapps';
import { initialize as initializeAnalytics } from 'src/shared/analytics/analytics.background';
import { Account, AccountPublicRPC } from './account/Account';
import { TransactionService } from './transactions/TransactionService';

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
  const account = new Account();
  await account.initialize();
  const accountPublicRPC = new AccountPublicRPC(account);
  const transactionService = new TransactionService();
  const dnaService = new DnaService(account);
  const queryService = new QueryService();
  dnaService.initialize();
  await transactionService.initialize();
  initializeAnalytics({ account });

  Object.assign(globalThis, {
    account,
    Account,
    accountPublicRPC,
    dnaService,
    queryService,
    transactionService,
  });
  return {
    account,
    accountPublicRPC,
    transactionService,
    dnaService,
    queryService,
  };
}
