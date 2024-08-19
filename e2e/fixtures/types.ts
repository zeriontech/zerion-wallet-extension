export type TestWalletActor = 'alice' | 'bob' | 'charlie';

export type TestWallet = {
  address: string;
  privateKey: string;
  recoveryPhrase: string;
};
