import { resolveReceiverFamiliarity } from './resolveReceiverFamiliarity';

const EMPTY = {
  myWalletAddresses: [],
  watchlistAddresses: [],
  addressBookAddresses: [],
};

const EVM = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const SOLANA = '7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv';

describe('resolveReceiverFamiliarity', () => {
  it('is unknown when the address is in none of the lists', () => {
    expect(
      resolveReceiverFamiliarity({
        to: EVM,
        myWalletAddresses: ['0x0000000000000000000000000000000000000001'],
        watchlistAddresses: ['0x0000000000000000000000000000000000000002'],
        addressBookAddresses: ['0x0000000000000000000000000000000000000003'],
      })
    ).toBe('unknown');
  });

  it('is known when the address is one of My wallets', () => {
    expect(
      resolveReceiverFamiliarity({
        ...EMPTY,
        to: EVM,
        myWalletAddresses: [EVM],
      })
    ).toBe('known');
  });

  it('is known when the address is on the Watchlist', () => {
    expect(
      resolveReceiverFamiliarity({
        ...EMPTY,
        to: EVM,
        watchlistAddresses: [EVM],
      })
    ).toBe('known');
  });

  it('is known when the address is in the Address Book', () => {
    expect(
      resolveReceiverFamiliarity({
        ...EMPTY,
        to: EVM,
        addressBookAddresses: [EVM],
      })
    ).toBe('known');
  });

  it('matches EVM addresses case-insensitively in both directions', () => {
    expect(
      resolveReceiverFamiliarity({
        ...EMPTY,
        to: EVM.toLowerCase(),
        addressBookAddresses: [EVM],
      })
    ).toBe('known');
    expect(
      resolveReceiverFamiliarity({
        ...EMPTY,
        to: EVM,
        addressBookAddresses: [EVM.toLowerCase()],
      })
    ).toBe('known');
  });

  it('matches Solana addresses case-sensitively', () => {
    expect(
      resolveReceiverFamiliarity({
        ...EMPTY,
        to: SOLANA,
        addressBookAddresses: [SOLANA],
      })
    ).toBe('known');
    expect(
      resolveReceiverFamiliarity({
        ...EMPTY,
        to: SOLANA,
        addressBookAddresses: [SOLANA.toLowerCase()],
      })
    ).toBe('unknown');
  });

  it('fails closed while the lists are still empty', () => {
    expect(resolveReceiverFamiliarity({ ...EMPTY, to: EVM })).toBe('unknown');
  });

  it('is unknown when there is no receiver yet', () => {
    expect(resolveReceiverFamiliarity({ ...EMPTY, to: null })).toBe('unknown');
    expect(resolveReceiverFamiliarity({ ...EMPTY, to: '' })).toBe('unknown');
  });
});
