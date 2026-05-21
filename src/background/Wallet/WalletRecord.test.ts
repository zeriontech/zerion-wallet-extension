import { jest } from '@jest/globals';
import { createSalt, createCryptoKey } from 'src/modules/crypto';
import { sha256 } from 'src/modules/crypto/sha256';
import { decryptMnemonic } from 'src/shared/wallet/encryption';
import type { SessionCredentials } from 'src/background/account/Credentials';
import { WalletRecordModel, toPlainObject } from './WalletRecord';
import { MnemonicWalletContainer } from './model/WalletContainer';
import { PrivateKeyWalletContainer } from './model/WalletContainer';
import {
  DeviceAccountContainer,
  ReadonlyAccountContainer,
} from './model/AccountContainer';
import type { WalletRecord } from './model/types';
import type { BareMnemonicWallet } from './model/BareWallet';
import { WalletOrigin } from './model/WalletOrigin';

function getMnemonicWallets(record: WalletRecord, groupIndex: number) {
  return record.walletManager.groups[groupIndex].walletContainer
    .wallets as BareMnemonicWallet[];
}

const TEST_USER = { id: 'test-user-id', salt: createSalt() };

async function makeCreds(password: string): Promise<SessionCredentials> {
  const [
    encryptionKey,
    seedPhraseEncryptionKey,
    seedPhraseEncryptionKey_deprecated,
  ] = await Promise.all([
    sha256({ salt: TEST_USER.id, password }),
    sha256({ salt: TEST_USER.salt, password }),
    createCryptoKey(password, TEST_USER.salt),
  ]);
  return {
    id: TEST_USER.id,
    encryptionKey,
    seedPhraseEncryptionKey,
    seedPhraseEncryptionKey_deprecated,
  };
}

const PHRASE_1 = 'test test test test test test test test test test test junk';
const PHRASE_2 =
  'legal winner thank year wave sausage worth useful legal winner thank yellow';

const TEST_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function buildPrivateKeyContainer() {
  return new PrivateKeyWalletContainer([{ privateKey: TEST_PRIVATE_KEY }]);
}

function buildHardwareContainer() {
  return new DeviceAccountContainer({
    device: {
      productId: 0x4011,
      vendorId: 0x2c97,
      productName: 'Ledger Nano X',
    },
    wallets: [
      {
        address: '0x1111111111111111111111111111111111111111',
        name: null,
        derivationPath: "m/44'/60'/0'/0/0",
      },
    ],
    provider: 'ledger',
  });
}

function buildReadonlyContainer() {
  return new ReadonlyAccountContainer([
    { address: '0x2222222222222222222222222222222222222222', name: null },
  ]);
}

async function buildRecord({
  group1Creds,
  group2Creds,
}: {
  group1Creds: SessionCredentials;
  group2Creds: SessionCredentials;
}): Promise<WalletRecord> {
  const group1Container = await MnemonicWalletContainer.create({
    wallets: [
      { mnemonic: { phrase: PHRASE_1, path: "m/44'/60'/0'/0/0" } },
      { mnemonic: { phrase: PHRASE_1, path: "m/44'/60'/0'/0/1" } },
      { mnemonic: { phrase: PHRASE_1, path: "m/44'/60'/0'/0/2" } },
    ],
    credentials: group1Creds,
  });
  const group2Container = await MnemonicWalletContainer.create({
    wallets: [{ mnemonic: { phrase: PHRASE_2, path: "m/44'/60'/0'/0/0" } }],
    credentials: group2Creds,
  });
  const privateKeyContainer = buildPrivateKeyContainer();
  const hardwareContainer = buildHardwareContainer();
  const readonlyContainer = buildReadonlyContainer();

  return {
    version: 6,
    walletManager: {
      groups: [
        {
          id: 'group-1',
          name: 'Wallet Group #1',
          walletContainer: group1Container,
          lastBackedUp: null,
          origin: WalletOrigin.extension,
          created: 1700000000000,
        },
        {
          id: 'group-2',
          name: 'Wallet Group #2',
          walletContainer: group2Container,
          lastBackedUp: null,
          origin: WalletOrigin.extension,
          created: 1700000000001,
        },
        {
          id: 'group-3',
          name: '',
          walletContainer: privateKeyContainer,
          lastBackedUp: null,
          origin: WalletOrigin.imported,
          created: 1700000000002,
        },
        {
          id: 'group-4',
          name: 'Ledger Group #1',
          walletContainer: hardwareContainer,
          lastBackedUp: null,
          origin: WalletOrigin.imported,
          created: 1700000000003,
        },
        {
          id: 'group-5',
          name: '',
          walletContainer: readonlyContainer,
          lastBackedUp: null,
          origin: WalletOrigin.imported,
          created: 1700000000004,
        },
      ],
      currentAddress: group1Container.getFirstWallet().address,
      internalMnemonicGroupCounter: 2,
      internalHardwareGroupCounter: 1,
    },
    transactions: [],
    permissions: {},
    publicPreferences: {},
    activityRecord: {},
    feed: null,
  };
}

function buildRecordWithoutMnemonics(): WalletRecord {
  const privateKeyContainer = buildPrivateKeyContainer();
  const hardwareContainer = buildHardwareContainer();
  const readonlyContainer = buildReadonlyContainer();

  return {
    version: 6,
    walletManager: {
      groups: [
        {
          id: 'group-pk',
          name: '',
          walletContainer: privateKeyContainer,
          lastBackedUp: null,
          origin: WalletOrigin.imported,
          created: 1700000000000,
        },
        {
          id: 'group-hw',
          name: 'Ledger Group #1',
          walletContainer: hardwareContainer,
          lastBackedUp: null,
          origin: WalletOrigin.imported,
          created: 1700000000001,
        },
        {
          id: 'group-ro',
          name: '',
          walletContainer: readonlyContainer,
          lastBackedUp: null,
          origin: WalletOrigin.imported,
          created: 1700000000002,
        },
      ],
      currentAddress: privateKeyContainer.getFirstWallet().address,
      internalMnemonicGroupCounter: 0,
      internalHardwareGroupCounter: 1,
    },
    transactions: [],
    permissions: {},
    publicPreferences: {},
    activityRecord: {},
    feed: null,
  };
}

jest.setTimeout(30_000);

describe('WalletRecordModel re-encryption methods', () => {
  let OLD_CREDS: SessionCredentials;
  let NEW_CREDS: SessionCredentials;
  let WRONG_CREDS: SessionCredentials;

  beforeAll(async () => {
    [OLD_CREDS, NEW_CREDS, WRONG_CREDS] = await Promise.all([
      makeCreds('old-password'),
      makeCreds('new-password'),
      makeCreds('wrong-password'),
    ]);
  });

  describe('reEncryptRecord', () => {
    it('re-encrypts all mnemonic groups with new credentials (happy path)', async () => {
      const record = await buildRecord({
        group1Creds: OLD_CREDS,
        group2Creds: OLD_CREDS,
      });
      const inputGroup3 = record.walletManager.groups[2].walletContainer;
      const inputGroup4 = record.walletManager.groups[3].walletContainer;
      const inputGroup5 = record.walletManager.groups[4].walletContainer;

      const result = await WalletRecordModel.reEncryptRecord(
        record,
        OLD_CREDS,
        NEW_CREDS
      );

      const group1Wallets = getMnemonicWallets(result, 0);
      const group2Wallets = getMnemonicWallets(result, 1);

      // Mnemonics re-encrypted: decrypt with NEW returns the original phrase
      expect(
        await decryptMnemonic(group1Wallets[0].mnemonic.phrase, NEW_CREDS)
      ).toBe(PHRASE_1);
      expect(
        await decryptMnemonic(group2Wallets[0].mnemonic.phrase, NEW_CREDS)
      ).toBe(PHRASE_2);

      // Decryption with OLD now fails
      await expect(
        decryptMnemonic(group1Wallets[0].mnemonic.phrase, OLD_CREDS)
      ).rejects.toThrow();
      await expect(
        decryptMnemonic(group2Wallets[0].mnemonic.phrase, OLD_CREDS)
      ).rejects.toThrow();

      // All 3 wallets in group 1 share the same updated ciphertext
      expect(group1Wallets[0].mnemonic.phrase).toBe(
        group1Wallets[1].mnemonic.phrase
      );
      expect(group1Wallets[1].mnemonic.phrase).toBe(
        group1Wallets[2].mnemonic.phrase
      );

      // Non-mnemonic containers referentially equal to the input
      expect(result.walletManager.groups[2].walletContainer).toBe(inputGroup3);
      expect(result.walletManager.groups[3].walletContainer).toBe(inputGroup4);
      expect(result.walletManager.groups[4].walletContainer).toBe(inputGroup5);

      // Identity fields preserved
      expect(result.walletManager.groups.map((g) => g.id)).toEqual([
        'group-1',
        'group-2',
        'group-3',
        'group-4',
        'group-5',
      ]);
      expect(result.walletManager.currentAddress).toBe(
        record.walletManager.currentAddress
      );
    });

    it('throws on wrong old credentials and leaves input record unchanged', async () => {
      const record = await buildRecord({
        group1Creds: OLD_CREDS,
        group2Creds: OLD_CREDS,
      });
      const snapshotBefore = JSON.stringify(toPlainObject(record));

      await expect(
        WalletRecordModel.reEncryptRecord(record, WRONG_CREDS, NEW_CREDS)
      ).rejects.toThrow();

      const snapshotAfter = JSON.stringify(toPlainObject(record));
      expect(snapshotAfter).toBe(snapshotBefore);
    });
  });

  describe('reEncryptMnemonicWithNewCredentialsIfNeeded', () => {
    it('re-encrypts every group when all groups are stale', async () => {
      const record = await buildRecord({
        group1Creds: OLD_CREDS,
        group2Creds: OLD_CREDS,
      });

      const result =
        await WalletRecordModel.reEncryptMnemonicWithNewCredentialsIfNeeded(
          record,
          OLD_CREDS,
          NEW_CREDS
        );

      const group1Wallets = getMnemonicWallets(result, 0);
      const group2Wallets = getMnemonicWallets(result, 1);

      expect(
        await decryptMnemonic(group1Wallets[0].mnemonic.phrase, NEW_CREDS)
      ).toBe(PHRASE_1);
      expect(
        await decryptMnemonic(group2Wallets[0].mnemonic.phrase, NEW_CREDS)
      ).toBe(PHRASE_2);

      // All 3 wallets in group 1 share the same updated ciphertext
      expect(group1Wallets[0].mnemonic.phrase).toBe(
        group1Wallets[1].mnemonic.phrase
      );
      expect(group1Wallets[1].mnemonic.phrase).toBe(
        group1Wallets[2].mnemonic.phrase
      );
    });

    it('leaves every group untouched when none are stale', async () => {
      const record = await buildRecord({
        group1Creds: NEW_CREDS,
        group2Creds: NEW_CREDS,
      });

      const group1PhrasesBefore = getMnemonicWallets(record, 0).map(
        (w) => w.mnemonic.phrase
      );
      const group2PhraseBefore = getMnemonicWallets(record, 1)[0].mnemonic
        .phrase;

      const result =
        await WalletRecordModel.reEncryptMnemonicWithNewCredentialsIfNeeded(
          record,
          OLD_CREDS,
          NEW_CREDS
        );

      const group1PhrasesAfter = getMnemonicWallets(result, 0).map(
        (w) => w.mnemonic.phrase
      );
      const group2PhraseAfter = getMnemonicWallets(result, 1)[0].mnemonic
        .phrase;

      expect(group1PhrasesAfter).toEqual(group1PhrasesBefore);
      expect(group2PhraseAfter).toBe(group2PhraseBefore);

      // Sanity: still decrypt with NEW
      expect(await decryptMnemonic(group2PhraseAfter, NEW_CREDS)).toBe(
        PHRASE_2
      );
    });

    it('re-encrypts only stale groups in mixed state (partial-fix scenario)', async () => {
      const record = await buildRecord({
        group1Creds: OLD_CREDS, // stale
        group2Creds: NEW_CREDS, // already current
      });

      const group1PhraseBefore = getMnemonicWallets(record, 0)[0].mnemonic
        .phrase;
      const group2PhraseBefore = getMnemonicWallets(record, 1)[0].mnemonic
        .phrase;

      const result =
        await WalletRecordModel.reEncryptMnemonicWithNewCredentialsIfNeeded(
          record,
          OLD_CREDS,
          NEW_CREDS
        );

      const group1Wallets = getMnemonicWallets(result, 0);
      const group2Wallets = getMnemonicWallets(result, 1);

      // Group 1: re-encrypted (ciphertext changed)
      expect(group1Wallets[0].mnemonic.phrase).not.toBe(group1PhraseBefore);
      expect(
        await decryptMnemonic(group1Wallets[0].mnemonic.phrase, NEW_CREDS)
      ).toBe(PHRASE_1);
      // Group 1: all 3 wallets share the same updated ciphertext
      expect(group1Wallets[0].mnemonic.phrase).toBe(
        group1Wallets[1].mnemonic.phrase
      );
      expect(group1Wallets[1].mnemonic.phrase).toBe(
        group1Wallets[2].mnemonic.phrase
      );

      // Group 2: byte-identical (untouched)
      expect(group2Wallets[0].mnemonic.phrase).toBe(group2PhraseBefore);
      expect(
        await decryptMnemonic(group2Wallets[0].mnemonic.phrase, NEW_CREDS)
      ).toBe(PHRASE_2);
    });

    it('is a no-op for a record with no mnemonic groups', async () => {
      const record = buildRecordWithoutMnemonics();
      const snapshotBefore = JSON.stringify(toPlainObject(record));

      const result =
        await WalletRecordModel.reEncryptMnemonicWithNewCredentialsIfNeeded(
          record,
          OLD_CREDS,
          NEW_CREDS
        );

      const snapshotAfter = JSON.stringify(toPlainObject(result));
      expect(snapshotAfter).toBe(snapshotBefore);
    });
  });
});
