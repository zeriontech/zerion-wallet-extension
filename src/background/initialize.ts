import { Account, AccountPublicRPC } from './account/Account';
import { walletStore } from './Wallet/persistence';
import { Wallet } from './Wallet/Wallet';

export const account = new Account();

// const wallets: { [key: string]: Wallet } = {};
let wallet: Wallet | null = null;

export const accountPublicRPC = new AccountPublicRPC(account);

// export function getWallet(id: string): Wallet | undefined {
//   return wallets[id];
// }

export function getCurrentWallet() {
  return wallet;
}

account.on('authorized', () => {
  console.log('should create wallet for id:', account.getUser());
  const user = account.getUser();
  if (!user) {
    throw new Error('User not found after authorized event');
  }
  // wallets[user.id] = new Wallet(user.id, walletStore);
  if (!wallet) {
    wallet = new Wallet(user.id, walletStore);
  } else {
    // Update wallet with encryptionKey?
  }
});

async function checkUser() {
  const pendingUser = await Account.getUser();
  if (pendingUser) {
    wallet = new Wallet(pendingUser.id, walletStore);
  }
}

checkUser();

Object.assign(window, {
  account,
  accountPublicRPC,
});
