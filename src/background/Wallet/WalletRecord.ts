import { decrypt, encrypt } from '@metamask/browser-passworder';
import produce from 'immer';
import { nanoid } from 'nanoid';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import { SeedType } from './model/SeedType';
import type {
  BareWallet,
  PendingWallet,
  WalletGroup,
  WalletRecord,
} from './model/types';
import type { WalletContainer } from './model/WalletContainer';
import {
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
} from './model/WalletContainer';

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

export class WalletRecordModel {
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
    const data = (await decrypt(key, encryptedRecord)) as WalletRecord;
    data.walletManager.groups = data.walletManager.groups.map((group) => {
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
    return data as WalletRecord;
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
      const group = draft.walletManager.groups.find((group) =>
        group.walletContainer.wallets.some(
          (wallet) => wallet.address.toLowerCase() === address.toLowerCase()
        )
      );
      if (!group) {
        throw new Error('Group not found');
      }
      if (group.walletContainer.wallets.length === 1) {
        throw new Error(
          'Removing last wallet from a wallet group is not allowed. You can remove the whole group'
        );
      }
      group.walletContainer.removeWallet(address);
      const { currentAddress } = draft.walletManager;
      const shouldChangeCurrentAddress =
        address.toLowerCase() === currentAddress?.toLowerCase();
      if (shouldChangeCurrentAddress) {
        draft.walletManager.currentAddress =
          group.walletContainer.getFirstWallet().address;
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
    const lowerCaseAddress = address.toLowerCase();
    return produce(record, (draft) => {
      for (const group of draft.walletManager.groups) {
        for (const wallet of group.walletContainer.wallets) {
          if (wallet.address.toLowerCase() === lowerCaseAddress) {
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
      const existingPermissions =
        typeof draft.permissions[origin] === 'string' // TODO: handle this at a "migration" step, not here
          ? [draft.permissions[origin] as unknown as string]
          : draft.permissions[origin];
      const existingPermissionsSet = new Set(existingPermissions || []);
      existingPermissionsSet.add(address);
      draft.permissions[origin] = Array.from(existingPermissionsSet);
    });
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
      const existingPermissions = draft.permissions[origin];
      if (address && existingPermissions.length > 1) {
        spliceItem(draft.permissions[origin], address);
      } else {
        // remove whole record for `origin` completely
        delete draft.permissions[origin];
      }
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
