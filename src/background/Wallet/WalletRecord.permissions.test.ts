import { createChain } from 'src/modules/networks/Chain';
import type { WalletRecord } from './model/types';
import { WalletRecordModel } from './WalletRecord';

const ORIGIN = 'https://dapp.example';
const OTHER_ORIGIN = 'https://other.example';
const EVM_CHECKSUMMED = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01';
const EVM = EVM_CHECKSUMMED.toLowerCase();
const SECOND_EVM = '0x2222222222222222222222222222222222222222';
// 32 zero bytes in base58: a valid Solana address shape
const SOLANA = '11111111111111111111111111111111';

function emptyRecord(): WalletRecord {
  return {
    version: 6,
    walletManager: {
      groups: [],
      currentAddress: null,
      internalMnemonicGroupCounter: 0,
      internalHardwareGroupCounter: 0,
    },
    transactions: [],
    permissions: {},
    publicPreferences: {},
    activityRecord: {},
    feed: null,
  };
}

function withPermissions(...grants: Array<{ origin: string; address: string }>) {
  return grants.reduce(
    (record, grant) => WalletRecordModel.addPermission(record, grant),
    emptyRecord(),
  );
}

describe('WalletRecordModel origin permissions', () => {
  describe('addPermission / isAccountAvailable', () => {
    it('grants an origin access to an address, regardless of address casing', () => {
      const record = withPermissions({ origin: ORIGIN, address: EVM_CHECKSUMMED });
      expect(record.permissions[ORIGIN].addresses).toEqual([EVM]);
      expect(WalletRecordModel.isAccountAvailable(record, { origin: ORIGIN, address: EVM })).toBe(
        true,
      );
      expect(
        WalletRecordModel.isAccountAvailable(record, { origin: ORIGIN, address: EVM_CHECKSUMMED }),
      ).toBe(true);
    });

    it('does not grant other origins or other addresses', () => {
      const record = withPermissions({ origin: ORIGIN, address: EVM });
      expect(
        WalletRecordModel.isAccountAvailable(record, { origin: OTHER_ORIGIN, address: EVM }),
      ).toBeFalsy();
      expect(
        WalletRecordModel.isAccountAvailable(record, { origin: ORIGIN, address: SECOND_EVM }),
      ).toBeFalsy();
    });

    it('stores an address once when granted twice', () => {
      const record = withPermissions(
        { origin: ORIGIN, address: EVM },
        { origin: ORIGIN, address: EVM_CHECKSUMMED },
      );
      expect(record.permissions[ORIGIN].addresses).toEqual([EVM]);
    });

    it('keeps several addresses per origin', () => {
      const record = withPermissions(
        { origin: ORIGIN, address: EVM },
        { origin: ORIGIN, address: SECOND_EVM },
      );
      expect(record.permissions[ORIGIN].addresses).toEqual([EVM, SECOND_EVM]);
    });

    it('does not mutate the record it was given', () => {
      const before = emptyRecord();
      WalletRecordModel.addPermission(before, { origin: ORIGIN, address: EVM });
      expect(before.permissions).toEqual({});
    });
  });

  describe('removePermission', () => {
    it('removes one address and keeps the others', () => {
      const record = withPermissions(
        { origin: ORIGIN, address: EVM },
        { origin: ORIGIN, address: SECOND_EVM },
      );
      const next = WalletRecordModel.removePermission(record, {
        origin: ORIGIN,
        address: EVM_CHECKSUMMED,
      });
      expect(next.permissions[ORIGIN].addresses).toEqual([SECOND_EVM]);
    });

    it('drops the origin entry when its last address is removed', () => {
      const record = withPermissions({ origin: ORIGIN, address: EVM });
      const next = WalletRecordModel.removePermission(record, { origin: ORIGIN, address: EVM });
      expect(ORIGIN in next.permissions).toBe(false);
    });

    it('removes every address of the origin when no address is given', () => {
      const record = withPermissions(
        { origin: ORIGIN, address: EVM },
        { origin: ORIGIN, address: SECOND_EVM },
        { origin: OTHER_ORIGIN, address: EVM },
      );
      const next = WalletRecordModel.removePermission(record, { origin: ORIGIN });
      expect(ORIGIN in next.permissions).toBe(false);
      expect(next.permissions[OTHER_ORIGIN].addresses).toEqual([EVM]);
    });

    it('throws for an origin that has no entry', () => {
      expect(() =>
        WalletRecordModel.removePermission(emptyRecord(), { origin: ORIGIN, address: EVM }),
      ).toThrow(`Record for ${ORIGIN} not found`);
    });
  });

  describe('removeAllOriginPermissions', () => {
    it('removes every origin', () => {
      const record = withPermissions(
        { origin: ORIGIN, address: EVM },
        { origin: OTHER_ORIGIN, address: SECOND_EVM },
      );
      expect(WalletRecordModel.removeAllOriginPermissions(record).permissions).toEqual({});
    });
  });

  describe('removeSolanaPermissions', () => {
    it('removes only Solana addresses of the origin', () => {
      const record = withPermissions(
        { origin: ORIGIN, address: EVM },
        { origin: ORIGIN, address: SOLANA },
      );
      const next = WalletRecordModel.removeSolanaPermissions(record, { origin: ORIGIN });
      expect(next.permissions[ORIGIN].addresses).toEqual([EVM]);
    });

    it('drops the origin entry when only Solana addresses were granted', () => {
      const record = withPermissions({ origin: ORIGIN, address: SOLANA });
      const next = WalletRecordModel.removeSolanaPermissions(record, { origin: ORIGIN });
      expect(ORIGIN in next.permissions).toBe(false);
    });

    it('throws for an origin that has no entry', () => {
      expect(() =>
        WalletRecordModel.removeSolanaPermissions(emptyRecord(), { origin: ORIGIN }),
      ).toThrow(`Record for ${ORIGIN} not found`);
    });
  });

  describe('chain per origin', () => {
    it('remembers the EVM chain for an origin without granting it any account', () => {
      const record = WalletRecordModel.setChainForOrigin(emptyRecord(), {
        origin: ORIGIN,
        evmChain: createChain('base'),
      });
      expect(
        WalletRecordModel.getChainForOrigin(record, {
          origin: ORIGIN,
          standard: 'evm',
        })?.toString(),
      ).toBe('base');
      expect(
        WalletRecordModel.getChainForOrigin(record, { origin: ORIGIN, standard: 'solana' }),
      ).toBeNull();
      expect(
        WalletRecordModel.isAccountAvailable(record, { origin: ORIGIN, address: EVM }),
      ).toBeFalsy();
    });

    it('keeps granted addresses when the chain changes', () => {
      const granted = withPermissions({ origin: ORIGIN, address: EVM });
      const record = WalletRecordModel.setChainForOrigin(granted, {
        origin: ORIGIN,
        evmChain: createChain('polygon'),
      });
      expect(record.permissions[ORIGIN]).toEqual({ addresses: [EVM], chain: 'polygon' });
    });

    it('stores the Solana chain separately from the EVM chain', () => {
      const record = WalletRecordModel.setChainForOrigin(emptyRecord(), {
        origin: ORIGIN,
        evmChain: createChain('base'),
        solanaChain: createChain('solana'),
      });
      expect(
        WalletRecordModel.getChainForOrigin(record, {
          origin: ORIGIN,
          standard: 'solana',
        })?.toString(),
      ).toBe('solana');
      expect(
        WalletRecordModel.getChainForOrigin(record, {
          origin: ORIGIN,
          standard: 'evm',
        })?.toString(),
      ).toBe('base');
    });

    it('has no chain for an origin it has never seen', () => {
      expect(
        WalletRecordModel.getChainForOrigin(emptyRecord(), { origin: ORIGIN, standard: 'evm' }),
      ).toBeNull();
    });

    it('lists the origins set to a chain', () => {
      const base = createChain('base');
      let record = WalletRecordModel.setChainForOrigin(emptyRecord(), {
        origin: ORIGIN,
        evmChain: base,
      });
      record = WalletRecordModel.setChainForOrigin(record, {
        origin: OTHER_ORIGIN,
        evmChain: createChain('polygon'),
      });
      const origins = WalletRecordModel.getPermissionsByChain(record, { chain: base }).map(
        (entry) => entry.origin,
      );
      expect(origins).toEqual([ORIGIN]);
    });
  });
});
