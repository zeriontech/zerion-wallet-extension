import { upgradeRecord } from 'src/shared/type-utils/versions';
import type { WalletRecord } from './types';
import { walletRecordUpgrades } from './versions';

const ORIGIN_A = 'https://a.example';
const ORIGIN_B = 'https://b.example';
const MIXED_CASE = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01';
const SECOND_MIXED_CASE = '0x00000000000000000000000000000000DeaDBeef';
const SOLANA = '11111111111111111111111111111111';

function walletManager() {
  return {
    groups: [],
    currentAddress: null,
    internalMnemonicGroupCounter: 0,
    internalHardwareGroupCounter: 0,
  };
}

/** Mirrors production: the decrypted blob is typed as the latest record whatever its real version */
function upgrade(entry: object) {
  return upgradeRecord(entry as WalletRecord, walletRecordUpgrades);
}

describe('walletRecordUpgrades', () => {
  it('upgrades a record without a version field (version 1) to the current shape', () => {
    const manager = walletManager();
    const transactions: unknown[] = [];
    const result = upgrade({
      walletManager: manager,
      transactions,
      preferences: { anything: true },
      permissions: {
        [ORIGIN_A]: MIXED_CASE,
        [ORIGIN_B]: [MIXED_CASE, SECOND_MIXED_CASE],
      },
    });

    expect(result.version).toBe(6);
    expect(result.permissions).toEqual({
      [ORIGIN_A]: { addresses: [MIXED_CASE.toLowerCase()] },
      [ORIGIN_B]: { addresses: [MIXED_CASE.toLowerCase(), SECOND_MIXED_CASE.toLowerCase()] },
    });
    expect(result.publicPreferences).toEqual({});
    expect('preferences' in result).toBe(false);
    expect(result.feed).toEqual({});
    expect(result.activityRecord).toEqual({});
    expect(result.walletManager).toBe(manager);
    expect(result.transactions).toBe(transactions);
  });

  it('normalizes permission addresses of a version 4 record and keeps everything else', () => {
    const result = upgrade({
      version: 4,
      walletManager: walletManager(),
      transactions: [],
      permissions: {
        [ORIGIN_A]: { addresses: [MIXED_CASE, SOLANA], chain: 'polygon' },
      },
      publicPreferences: { overviewChain: 'base' },
      feed: {},
    });

    expect(result.version).toBe(6);
    expect(result.permissions).toEqual({
      [ORIGIN_A]: { addresses: [MIXED_CASE.toLowerCase(), SOLANA], chain: 'polygon' },
    });
    expect(result.publicPreferences).toEqual({ overviewChain: 'base' });
    expect(result.activityRecord).toEqual({});
  });

  it('adds an empty activity record to a version 5 record without touching permissions', () => {
    const permissions = { [ORIGIN_A]: { addresses: [MIXED_CASE.toLowerCase()] } };
    const result = upgrade({
      version: 5,
      walletManager: walletManager(),
      transactions: [],
      permissions,
      publicPreferences: {},
      feed: {},
    });

    expect(result.version).toBe(6);
    expect(result.permissions).toBe(permissions);
    expect(result.activityRecord).toEqual({});
  });

  it('returns a current-version record unchanged', () => {
    const current = {
      version: 6,
      walletManager: walletManager(),
      transactions: [],
      permissions: {},
      publicPreferences: {},
      activityRecord: { some: 'value' },
      feed: null,
    };
    expect(upgrade(current)).toBe(current);
  });
});
