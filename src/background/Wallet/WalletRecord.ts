import { decrypt, encrypt } from '@metamask/browser-passworder';
import produce from 'immer';
import { nanoid } from 'nanoid';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import { Chain, createChain } from 'src/modules/networks/Chain';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { SeedType } from './model/SeedType';
import type {
  BareWallet,
  PendingWallet,
  WalletGroup,
  WalletRecord,
} from './model/types';
import { upgrade } from './model/versions';
import type { WalletContainer } from './model/WalletContainer';
import {
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
} from './model/WalletContainer';
import { WalletNameFlag } from './model/WalletNameFlag';

function generateGroupName(
  record: WalletRecord | null,
  walletContainer: WalletContainer
) {
  if (walletContainer.seedType === SeedType.privateKey) {
    return '';
  }
  const name = (index: number) => `Wallet Group #${index}`;
  if (!record) {
    return name(1);
  }
  const mnemonicGroups = record.walletManager.groups.filter(
    (group) => group.walletContainer.seedType === SeedType.mnemonic
  );
  function isNameUsed(name: string) {
    const index = mnemonicGroups.findIndex((group) => group.name === name);
    return index !== -1;
  }
  let potentialName = name(
    record.walletManager.internalMnemonicGroupCounter + 1
  );
  while (isNameUsed(potentialName)) {
    potentialName = `${potentialName} (2)`;
  }
  return potentialName;
}

function createGroup({
  name,
  walletContainer,
}: {
  walletContainer: WalletContainer;
  name: string;
}): WalletGroup {
  return {
    id: nanoid(),
    walletContainer,
    lastBackedUp: null,
    name,
  };
}

function toPlainObject(record: WalletRecord) {
  return produce(record, (draft) => {
    // @ts-ignore
    draft.walletManager.groups = draft.walletManager.groups.map((group) => ({
      ...group,
      walletContainer: group.walletContainer.toPlainObject(),
    }));
  });
}

function validateName(
  name: string,
  { minLength = 1 }: { minLength?: number } = {}
) {
  const ETHEREUM_ADDRESS_LENGTH = 40;
  const MAX_ALLOWED_NAME_LENGTH = ETHEREUM_ADDRESS_LENGTH * 2;
  if (typeof name !== 'string') {
    return 'Must be a string';
  } else if (name.length < minLength) {
    return 'Must have at least one character';
  } else if (name.length > MAX_ALLOWED_NAME_LENGTH) {
    return `Must be shorter than ${MAX_ALLOWED_NAME_LENGTH} characters`;
  } else if (name === 'debug-error-name') {
    return 'Debug: intentional debugging error';
  }
  return null;
}

function findWithIndex<T>(items: T[], predicate: (item: T) => boolean) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (predicate(item)) {
      return [i, item] as const;
    }
  }
  return [-1, undefined] as const;
}

function spliceItem<T>(arr: T[], item: T) {
  const pos = arr.indexOf(item);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

function verifyCurrentAddress(record: WalletRecord) {
  const { currentAddress } = record.walletManager;
  if (currentAddress) {
    const normalizedAddress = normalizeAddress(currentAddress);
    const walletExists = record.walletManager.groups.some((group) =>
      group.walletContainer.wallets.some(
        (wallet) => normalizeAddress(wallet.address) === normalizedAddress
      )
    );
    if (!walletExists) {
      record.walletManager.currentAddress =
        WalletRecordModel.getFirstWallet(record)?.address || null;
    }
  }
}

export class WalletRecordModel {
  static verifyStateIntegrity(record: WalletRecord) {
    return produce(record, (draft) => {
      verifyCurrentAddress(draft);
    });
  }

  static getFirstWallet(record: WalletRecord): BareWallet | null {
    return record.walletManager.groups[0]?.walletContainer.getFirstWallet();
  }

  static getWalletByAddress(
    record: WalletRecord,
    address: string
  ): BareWallet | null {
    for (const group of record.walletManager.groups) {
      const wallet = group.walletContainer.getWalletByAddress(address);
      if (wallet) {
        return wallet;
      }
    }
    return null;
  }

  static createOrUpdateRecord(
    record: WalletRecord | null,
    pendingWallet: PendingWallet
  ): WalletRecord {
    if (!record) {
      const isMnemonicWallet =
        pendingWallet.walletContainer.seedType === SeedType.mnemonic;
      return {
        version: 2,
        walletManager: {
          groups: [
            createGroup({
              name: generateGroupName(record, pendingWallet.walletContainer),
              walletContainer: pendingWallet.walletContainer,
            }),
          ],
          currentAddress:
            pendingWallet.walletContainer.getFirstWallet().address,
          internalMnemonicGroupCounter: isMnemonicWallet ? 1 : 0,
        },
        transactions: [],
        permissions: {},
        preferences: {},
      };
    }
    return produce(record, (draft) => {
      const { walletContainer } = pendingWallet;
      const { seedType } = walletContainer;
      if (seedType === SeedType.privateKey) {
        const { privateKey } = walletContainer.getFirstWallet();
        const existingGroup = draft.walletManager.groups.find(
          (group) =>
            group.walletContainer.getFirstWallet().privateKey === privateKey
        );
        if (existingGroup) {
          return draft; // NOTE: private key already exists, should we update record or keep untouched?
        } else {
          draft.walletManager.internalMnemonicGroupCounter += 1;
          draft.walletManager.groups.push(
            createGroup({
              walletContainer,
              name: generateGroupName(record, walletContainer),
            })
          );
        }
      } else if (seedType === SeedType.mnemonic) {
        /** Is mnemonic */
        const mnemonic = walletContainer.getMnemonic();
        if (!mnemonic) {
          throw new Error('Mnemonic not found');
        }
        const existingGroup = draft.walletManager.groups.find(
          (group) =>
            group.walletContainer.getMnemonic()?.phrase === mnemonic.phrase
        );
        if (existingGroup) {
          walletContainer.wallets.forEach((wallet) => {
            existingGroup.walletContainer.addWallet(wallet);
          });
        } else {
          draft.walletManager.internalMnemonicGroupCounter += 1;
          draft.walletManager.groups.push(
            createGroup({
              walletContainer,
              name: generateGroupName(record, walletContainer),
            })
          );
        }
      } else {
        throw new Error('Unknown SeedType');
      }
    });
  }

  static async encryptRecord(key: string, record: WalletRecord) {
    return encrypt(key, toPlainObject(record));
  }

  static async decryptRecord(key: string, encryptedRecord: string) {
    const persistedEntry = (await decrypt(
      key,
      encryptedRecord
    )) as WalletRecord;
    const entry = upgrade(persistedEntry);
    entry.walletManager.groups = entry.walletManager.groups.map((group) => {
      const { seedType, wallets } = group.walletContainer;
      if (seedType === SeedType.mnemonic) {
        group.walletContainer = new MnemonicWalletContainer(wallets);
      } else if (seedType === SeedType.privateKey) {
        group.walletContainer = new PrivateKeyWalletContainer(wallets);
      } else {
        throw new Error(`Unexpected SeedType: ${seedType}`);
      }

      return group;
    });
    return WalletRecordModel.verifyStateIntegrity(entry as WalletRecord);
  }

  static setCurrentAddress(
    record: WalletRecord,
    { address }: { address: string }
  ) {
    const checkSumAddress = toChecksumAddress(address);
    return produce(record, (draft) => {
      draft.walletManager.currentAddress = checkSumAddress;
    });
  }

  static renameWalletGroup(
    record: WalletRecord,
    { groupId, name }: { groupId: string; name: string }
  ): WalletRecord {
    return produce(record, (draft) => {
      const group = draft.walletManager.groups.find(
        (group) => group.id === groupId
      );
      if (!group) {
        throw new Error('Group not found');
      }
      const maybeErrorMessage = validateName(name);
      if (maybeErrorMessage) {
        throw new Error(maybeErrorMessage);
      }
      group.name = name;
    });
  }

  static removeWalletGroup(
    record: WalletRecord,
    { groupId }: { groupId: string }
  ): WalletRecord {
    return produce(record, (draft) => {
      const [pos, item] = findWithIndex(
        draft.walletManager.groups,
        (group) => group.id === groupId
      );
      if (!item) {
        throw new Error('Group not found');
      }
      const { currentAddress } = draft.walletManager;
      const shouldChangeCurrentAddress = item.walletContainer.wallets.some(
        (wallet) => wallet.address === currentAddress
      );
      draft.walletManager.groups.splice(pos, 1);
      if (shouldChangeCurrentAddress) {
        const newAddress =
          draft.walletManager.groups[0]?.walletContainer.getFirstWallet()
            .address;
        draft.walletManager.currentAddress = newAddress || null;
      }
    });
  }

  static removeAddress(record: WalletRecord, { address }: { address: string }) {
    return produce(record, (draft) => {
      const normalizedAddress = normalizeAddress(address);
      const [pos, group] = findWithIndex(draft.walletManager.groups, (group) =>
        group.walletContainer.wallets.some(
          (wallet) => normalizeAddress(wallet.address) === normalizedAddress
        )
      );
      if (!group) {
        throw new Error('Group not found');
      }
      const isLastAddress = group.walletContainer.wallets.length === 1;
      if (
        group.walletContainer.seedType === SeedType.mnemonic &&
        isLastAddress
      ) {
        throw new Error(
          'Removing last wallet from a wallet group is not allowed. You can remove the whole group'
        );
      }
      if (isLastAddress) {
        // remove whole group
        draft.walletManager.groups.splice(pos, 1);
      } else {
        group.walletContainer.removeWallet(address);
      }
      const { currentAddress } = draft.walletManager;
      const shouldChangeCurrentAddress =
        currentAddress &&
        normalizedAddress === normalizeAddress(currentAddress);
      if (shouldChangeCurrentAddress) {
        if (isLastAddress) {
          draft.walletManager.currentAddress =
            draft.walletManager.groups[0]?.walletContainer.getFirstWallet()
              .address || null;
        } else {
          draft.walletManager.currentAddress =
            group.walletContainer.getFirstWallet().address;
        }
      }
    });
  }

  static renameAddress(
    record: WalletRecord,
    { address, name }: { address: string; name: string }
  ): WalletRecord {
    const maybeErrorMessage = validateName(name, { minLength: 0 });
    if (maybeErrorMessage) {
      throw new Error(maybeErrorMessage);
    }
    const normalizedAddress = normalizeAddress(address);
    return produce(record, (draft) => {
      for (const group of draft.walletManager.groups) {
        for (const wallet of group.walletContainer.wallets) {
          if (normalizeAddress(wallet.address) === normalizedAddress) {
            wallet.name = name || null;
            return;
          }
        }
      }
      throw new Error(`Wallet for ${address} not found`);
    });
  }

  static addPermission(
    record: WalletRecord,
    { address, origin }: { address: string; origin: string }
  ): WalletRecord {
    return produce(record, (draft) => {
      const existingPermissions = draft.permissions[origin]?.addresses;
      const existingPermissionsSet = new Set(existingPermissions || []);
      existingPermissionsSet.add(address);
      const updatedAddresses = Array.from(existingPermissionsSet);
      if (!draft.permissions[origin]) {
        draft.permissions[origin] = { addresses: updatedAddresses };
      } else {
        draft.permissions[origin].addresses = updatedAddresses;
      }
    });
  }

  static setChainForOrigin(
    record: WalletRecord,
    { chain, origin }: { chain: Chain; origin: string }
  ) {
    return produce(record, (draft) => {
      if (!draft.permissions[origin]) {
        throw new Error(`Permission for ${origin} not found`);
      }
      draft.permissions[origin].chain = chain.toString();
    });
  }

  static getChainForOrigin(
    record: WalletRecord,
    { origin }: { origin: string }
  ): Chain {
    const chain = record.permissions[origin]?.chain;
    return createChain(chain || 'ethereum');
  }

  static removeAllOriginPermissions(record: WalletRecord): WalletRecord {
    return produce(record, (draft) => {
      draft.permissions = {};
    });
  }

  static removePermission(
    record: WalletRecord,
    { origin, address }: { origin: string; address?: string }
  ): WalletRecord {
    return produce(record, (draft) => {
      if (origin in draft.permissions === false) {
        throw new Error(`Record for ${origin} not found`);
      }
      const permission = draft.permissions[origin];
      const { addresses: existingPermissions } = permission;
      if (address && existingPermissions.length > 1) {
        spliceItem(existingPermissions, address);
      } else if (!permission.chain) {
        // remove whole record for `origin` completely
        delete draft.permissions[origin];
      } else {
        draft.permissions[origin].addresses = [];
      }
    });
  }

  static setPreference(
    record: WalletRecord,
    { preferences }: { preferences: Partial<WalletRecord['preferences']> }
  ) {
    return produce(record, (draft) => {
      Object.assign(draft.preferences, preferences);
    });
  }

  static setWalletNameFlag(
    record: WalletRecord,
    { flag }: { flag: WalletNameFlag }
  ) {
    return produce(record, (draft) => {
      const { walletNameFlags } = draft.preferences;
      const set = new Set(walletNameFlags).add(flag);
      draft.preferences.walletNameFlags = Array.from(set);
    });
  }

  static removeWalletNameFlag(
    record: WalletRecord,
    { flag }: { flag: WalletNameFlag }
  ) {
    return produce(record, (draft) => {
      const { walletNameFlags } = draft.preferences;
      const set = new Set(walletNameFlags);
      set.delete(flag);
      draft.preferences.walletNameFlags = Array.from(set);
    });
  }

  static updateLastBackedUp(
    record: WalletRecord,
    { groupId, timestamp }: { groupId: string; timestamp: number }
  ) {
    return produce(record, (draft) => {
      const group = draft.walletManager.groups.find(
        (group) => group.id === groupId
      );
      if (!group) {
        throw new Error(`Group with id ${groupId} not found`);
      }
      group.lastBackedUp = timestamp;
    });
  }
}
