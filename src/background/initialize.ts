import { prepareStorage } from 'src/shared/core/version';
import { initialize as dappRegistryInitialize } from 'src/shared/dapps';
import { initializeRemoteConfig } from 'src/modules/remote-config';
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
  await transactionService.initialize();

  await initializeRemoteConfig();

  Object.assign(globalThis, {
    account,
    Account,
    accountPublicRPC,
    transactionService,
  });
  return { account, accountPublicRPC, transactionService };
}
