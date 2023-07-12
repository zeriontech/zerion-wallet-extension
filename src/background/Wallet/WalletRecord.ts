import { decrypt, encrypt } from 'src/modules/crypto';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getIndexFromPath } from 'src/shared/wallet/getNextAccountPath';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { WalletAbility } from 'src/shared/types/Daylight';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import {
  isEncryptedMnemonic,
  decryptMnemonic,
} from 'src/shared/wallet/encryption';
import { invariant } from 'src/shared/invariant';
import type { Credentials, SessionCredentials } from '../account/Credentials';
import { SeedType } from './model/SeedType';
import type {
  BareWallet,
  PendingWallet,
  WalletFeed,
  WalletGroup,
  WalletRecord,
} from './model/types';
import { upgrade } from './model/versions';
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
  origin,
  created,
}: Pick<
  WalletGroup,
  'name' | 'walletContainer' | 'origin' | 'created'
>): WalletGroup {
  return {
    id: nanoid(),
    walletContainer,
    lastBackedUp: null,
    name,
    origin,
    created,
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
        version: 5,
        walletManager: {
          groups: [
            createGroup({
              name: generateGroupName(record, pendingWallet.walletContainer),
              walletContainer: pendingWallet.walletContainer,
              origin: pendingWallet.origin,
              created: Date.now(),
            }),
          ],
          currentAddress:
            pendingWallet.walletContainer.getFirstWallet().address,
          internalMnemonicGroupCounter: isMnemonicWallet ? 1 : 0,
        },
        transactions: [],
        permissions: {},
        publicPreferences: {},
        feed: { completedAbilities: [], dismissedAbilities: [] },
      };
    }
    return produce(record, (draft) => {
      const { walletContainer } = pendingWallet;
      const { seedType, seedHash } = walletContainer;
      if (!draft.feed.completedAbilities) {
        draft.feed.completedAbilities = [];
      }
      if (!draft.feed.dismissedAbilities) {
        draft.feed.dismissedAbilities = [];
      }
      if (seedType === SeedType.privateKey) {
        const { privateKey } = walletContainer.getFirstWallet();
        const existingGroup = draft.walletManager.groups.find(
          (group) =>
            group.walletContainer.getFirstWallet().privateKey === privateKey
        );
        if (existingGroup) {
          return draft; // NOTE: private key already exists, should we update record or keep untouched?
        } else {
          draft.walletManager.groups.push(
            createGroup({
              walletContainer,
              name: generateGroupName(record, walletContainer),
              origin: pendingWallet.origin,
              created: Date.now(),
            })
          );
        }
      } else if (seedType === SeedType.mnemonic) {
        const mnemonic = walletContainer.getMnemonic();
        invariant(mnemonic?.phrase, 'Mnemonic not found');
        const existingGroup = draft.walletManager.groups.find((group) =>
          seedHash
            ? seedHash === group.walletContainer.seedHash
            : group.walletContainer.getMnemonic()?.phrase === mnemonic.phrase
        );
        if (existingGroup && seedHash) {
          walletContainer.wallets.forEach((wallet) => {
            existingGroup.walletContainer.addWallet(wallet, seedHash);
          });
          existingGroup.walletContainer.wallets.sort((a, b) => {
            const index1 = getIndexFromPath(a.mnemonic?.path || '');
            const index2 = getIndexFromPath(b.mnemonic?.path || '');
            return index1 - index2;
          });
        } else {
          draft.walletManager.internalMnemonicGroupCounter += 1;
          draft.walletManager.groups.push(
            createGroup({
              walletContainer,
              name: generateGroupName(record, walletContainer),
              origin: pendingWallet.origin,
              created: Date.now(),
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
    return await decrypt(key, encryptedRecord);
  }

  static async decryptAndRestoreRecord(
    encryptedRecord: string,
    credentials: Credentials
  ) {
    const { encryptionKey } = credentials;
    const persistedEntry = (await decrypt(
      encryptionKey,
      encryptedRecord
    )) as WalletRecord;
    const entry = upgrade(persistedEntry);

    entry.walletManager.groups = await Promise.all(
      entry.walletManager.groups.map(async (group) => {
        const { seedType, wallets } = group.walletContainer;
        if (seedType === SeedType.mnemonic) {
          group.walletContainer =
            await MnemonicWalletContainer.restoreWalletContainer(
              group.walletContainer,
              credentials
            );
        } else if (seedType === SeedType.privateKey) {
          group.walletContainer = new PrivateKeyWalletContainer(wallets);
        } else {
          throw new Error(`Unexpected SeedType: ${seedType}`);
        }
        return group;
      })
    );

    return WalletRecordModel.verifyStateIntegrity(entry as WalletRecord);
  }

  static async getRecoveryPhrase(
    record: WalletRecord,
    {
      groupId,
      credentials,
    }: { groupId: string; credentials: SessionCredentials }
  ) {
    const group = record.walletManager.groups.find(
      (group) => group.id === groupId
    );
    if (!group) {
      throw new Error('Wallet Group not found');
    }
    const encryptedMnemonic = group.walletContainer.getMnemonic();
    if (!encryptedMnemonic) {
      throw new Error(`Missing mnemonic from wallet object for ${groupId}`);
    }
    const isNotEncrypted = !isEncryptedMnemonic(encryptedMnemonic.phrase);
    if (isNotEncrypted) {
      return encryptedMnemonic;
    }

    const phrase = await decryptMnemonic(encryptedMnemonic.phrase, credentials);
    return {
      ...encryptedMnemonic,
      phrase,
    };
  }

  static async getPrivateKey(
    record: WalletRecord,
    { address }: { address: string }
  ) {
    let wallet: BareWallet | null = null;
    for (const group of record.walletManager.groups) {
      const matchedWallet = group.walletContainer.getWalletByAddress(address);
      if (matchedWallet) {
        wallet = matchedWallet;
        break;
      }
    }
    if (!wallet) {
      throw new Error('Wallet with given address not found');
    }
    return wallet.privateKey;
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
      const normalizedAddress = normalizeAddress(address);
      const existingPermissions = draft.permissions[origin]?.addresses;
      const existingPermissionsSet = new Set(existingPermissions || []);
      existingPermissionsSet.add(normalizedAddress);
      const updatedAddresses = Array.from(existingPermissionsSet);
      if (!draft.permissions[origin]) {
        draft.permissions[origin] = { addresses: updatedAddresses };
      } else {
        draft.permissions[origin].addresses = updatedAddresses;
      }
    });
  }

  /** EIP-1193 uses the wording "available" */
  static isAccountAvailable(
    record: WalletRecord,
    { address, origin }: { address: string; origin: string }
  ): boolean {
    const normalizedAddress = normalizeAddress(address);
    return record.permissions[origin]?.addresses.includes(normalizedAddress);
  }

  static setChainForOrigin(
    record: WalletRecord,
    { chain, origin }: { chain: Chain; origin: string }
  ) {
    return produce(record, (draft) => {
      if (!draft.permissions[origin]) {
        // In UI, we display dapp settings page for detected dapps
        // even if no permission settings exist for it, so we need to allow changing
        // chain for an entry that doesn't exist yet
        draft.permissions[origin] = { addresses: [] };
      }
      draft.permissions[origin].chain = chain.toString();
    });
  }

  static getChainForOrigin(
    record: WalletRecord,
    { origin }: { origin: string }
  ): Chain {
    const chain = record.permissions[origin]?.chain;
    return createChain(chain || NetworkId.Ethereum);
  }

  static getPermissionsByChain(
    record: WalletRecord,
    { chain }: { chain: Chain }
  ) {
    return Object.entries(record.permissions)
      .filter(([, permission]) => permission.chain === chain.toString())
      .map(([origin, permission]) => ({ origin, permission }));
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
        const normalizedAddress = normalizeAddress(address);
        spliceItem(existingPermissions, normalizedAddress);
      } else if (!permission.chain || permission.chain === NetworkId.Ethereum) {
        // remove whole record for `origin` completely
        delete draft.permissions[origin];
      } else {
        draft.permissions[origin].addresses = [];
      }
    });
  }

  static getPreferences(record: WalletRecord | null) {
    const defaults: Required<WalletRecord['publicPreferences']> = {
      showNetworkSwitchShortcut: true,
      overviewChain: '',
      configurableNonce: false,
      invitationBannerDismissed: false,
    };
    if (!record) {
      return defaults;
    }
    const { publicPreferences } = record;
    return { ...defaults, ...publicPreferences };
  }

  static setPreferences(
    record: WalletRecord,
    { preferences }: { preferences: Partial<WalletRecord['publicPreferences']> }
  ) {
    return produce(record, (draft) => {
      Object.assign(draft.publicPreferences, preferences);
    });
  }

  static verifyOverviewChain(
    record: WalletRecord,
    { availableChains }: { availableChains: Chain[] }
  ) {
    const { overviewChain } = record.publicPreferences;
    if (
      overviewChain &&
      !availableChains.includes(createChain(overviewChain))
    ) {
      return produce(record, (draft) => {
        draft.publicPreferences.overviewChain = NetworkSelectValue.All;
      });
    } else {
      return record;
    }
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

  static getFeedInfo(record: WalletRecord): WalletFeed {
    return record.feed;
  }

  static markAbility(
    record: WalletRecord,
    {
      ability,
      action,
    }: { ability: WalletAbility; action: 'dismiss' | 'complete' }
  ) {
    return produce(record, (draft) => {
      const { completedAbilities, dismissedAbilities } = draft.feed;
      if (action === 'complete') {
        if (!completedAbilities.some((item) => item.uid === ability.uid)) {
          completedAbilities.unshift(ability);
        }
      } else if (action === 'dismiss') {
        if (!dismissedAbilities.some((item) => item.uid === ability.uid)) {
          dismissedAbilities.unshift(ability);
        }
      } else {
        throw new Error(
          'Unexpected ability marking type. Try "complete" or "dismiss"'
        );
      }
    });
  }

  static unmarkAbility(
    record: WalletRecord,
    { abilityId }: { abilityId: string }
  ) {
    return produce(record, (draft) => {
      const completedIndex = draft.feed.completedAbilities?.findIndex(
        (item) => item.uid === abilityId
      );
      const dismissedIndex = draft.feed.dismissedAbilities?.findIndex(
        (item) => item.uid === abilityId
      );
      if (completedIndex >= 0) {
        draft.feed.completedAbilities.splice(completedIndex, 1);
      }
      if (dismissedIndex >= 0) {
        draft.feed.dismissedAbilities.splice(dismissedIndex, 1);
      }
    });
  }
}
