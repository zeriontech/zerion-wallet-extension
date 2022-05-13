import { Account, AccountPublicRPC } from './account/Account';
// import { walletStore } from './Wallet/persistence';
// import { Wallet } from './Wallet/Wallet';

let didInitialize = false;

export async function initialize() {
  if (didInitialize) {
    throw new Error('Initialize function should be run only once');
  }
  didInitialize = true;

  // This method is called only when background script runs for the first time
  // This means that either the user is opening the extension for the first time,
  // or that the browser decided to "restart" the background scripts
  // Either way, we either create a user from scratch or find one in storage
  await Account.ensureUserAndWallet();
  const account = new Account();
  const accountPublicRPC = new AccountPublicRPC(account);

  Object.assign(window, { account, Account, accountPublicRPC });
  return { account, accountPublicRPC };
}
