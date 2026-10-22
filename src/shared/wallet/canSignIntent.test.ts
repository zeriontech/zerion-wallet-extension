import type { BareWallet } from 'src/background/Wallet/model/BareWallet';
import type { DeviceAccount } from 'src/background/Wallet/model/AccountContainer';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import {
  isBareWallet,
  isDeviceAccount,
  isReadonlyAccount,
} from 'src/shared/types/validators';
import { canSignIntent } from './canSignIntent';
import { BLOCKCHAIN_TYPES } from './classifiers';

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';

const mnemonicWallet: BareWallet = {
  address: ADDRESS,
  name: null,
  mnemonic: { phrase: 'masked', path: "m/44'/60'/0'/0/0" },
  privateKey: 'masked',
};
const privateKeyWallet: BareWallet = {
  address: ADDRESS,
  name: null,
  mnemonic: null,
  privateKey: 'masked',
};
const ledgerAccount: DeviceAccount = {
  address: ADDRESS,
  name: null,
  derivationPath: "m/44'/60'/0'/0/0",
};
const readonlyAccount: ExternallyOwnedAccount = {
  address: ADDRESS,
  name: null,
};

const WALLETS = [
  ['mnemonic', mnemonicWallet],
  ['private key', privateKeyWallet],
  ['Ledger DeviceAccount', ledgerAccount],
  ['readonly', readonlyAccount],
] as const;

describe('canSignIntent', () => {
  test('fixtures are the wallet kinds they claim to be', () => {
    expect(
      isBareWallet(mnemonicWallet) && mnemonicWallet.mnemonic
    ).toBeTruthy();
    expect(isBareWallet(privateKeyWallet) && !privateKeyWallet.mnemonic).toBe(
      true
    );
    expect(isDeviceAccount(ledgerAccount)).toBe(true);
    expect(isReadonlyAccount(readonlyAccount)).toBe(true);
  });

  const cases = WALLETS.flatMap(([kind, wallet]) =>
    BLOCKCHAIN_TYPES.map((ecosystem) => [kind, ecosystem, wallet] as const)
  );

  test('covers 4 wallet kinds × 2 ecosystems', () => {
    expect(cases).toHaveLength(8);
  });

  test.each(cases)('%s wallet on %s → false', (_kind, ecosystem, wallet) => {
    expect(canSignIntent(wallet, ecosystem)).toBe(false);
  });
});
