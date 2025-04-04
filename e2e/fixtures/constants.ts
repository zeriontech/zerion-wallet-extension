import type { TestWallet, TestWalletActor } from './types';

export const testWallets: Record<TestWalletActor, TestWallet> = {
  alice: {
    address: '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1',
    privateKey:
      '0x164de0475b79bf819c39e9e7daf5c6e0b22daeb7b83aa06f19d8cc83ec08ceca',
    recoveryPhrase:
      'effort squirrel sustain box face essay pride secret gravity dream island tonight',
  },
  bob: {
    address: '0x20801ba39933f10b5718B98fE7c21f89A6d8643B',
    privateKey:
      '0x04c7d81d1b5afba9c400498a8edd7a77ff39f8d88d1de72efdae39c79c6f221b',
    recoveryPhrase:
      'fold donor angry leader upgrade level canal seed plug act jelly beyond',
  },
  charlie: {
    address: '0x04d9a18e0E97B821850c09c0C648c84eC03F55e0',
    privateKey:
      '0xf5c812b052d452d61a0e5ffb3451b7315222f82f66601ac5b6dd7974a5dc2a45',
    recoveryPhrase:
      'canal coffee velvet put model toss garden place three decrease report hint',
  },
};
