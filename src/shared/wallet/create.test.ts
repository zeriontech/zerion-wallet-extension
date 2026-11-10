import { isValidMnemonic } from '../validation/wallet';
import { restoreBareWallet } from './create';

const phrase =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('restoreBareWallet', () => {
  test('derives the same EVM wallet as ethers v5 from a mnemonic', async () => {
    const wallet = await restoreBareWallet({
      mnemonic: { phrase, path: "m/44'/60'/0'/0/0" },
    });
    expect(wallet.address).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
    expect(wallet.privateKey).toBe(
      '0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727',
    );
  });

  test('restores a Solana private key', async () => {
    const wallet = await restoreBareWallet({
      privateKey: '111111111111111111111111111111114zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS',
    });
    expect(wallet.address).toBe('4zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS');
  });

  test('restores an EVM private key', async () => {
    const wallet = await restoreBareWallet({
      privateKey: '0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727',
    });
    expect(wallet.address).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });
});

describe('isValidMnemonic', () => {
  test('accepts a valid phrase and rejects invalid input', () => {
    expect(isValidMnemonic(phrase)).toBe(true);
    expect(isValidMnemonic('not a mnemonic')).toBe(false);
  });
});
