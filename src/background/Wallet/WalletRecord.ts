import { decrypt, encrypt } from 'src/modules/crypto';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import sortBy from 'lodash/sortBy';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getIndexFromPath } from 'src/shared/wallet/derivation-paths';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { WalletAbility } from 'src/shared/types/Daylight';
import {
  isEncryptedMnemonic,
  decryptMnemonic,
} from 'src/shared/wallet/encryption';
import { invariant } from 'src/shared/invariant';
import {
  assertSignerContainer,
  getContainerType,
  isHardwareContainer,
  isMnemonicContainer,
  isPrivateKeyContainer,
  isReadonlyContainer,
  isSignerContainer,
} from 'src/shared/types/validators';
import { capitalize } from 'capitalize-ts';
import { upgradeRecord } from 'src/shared/type-utils/versions';
import type { Credentials, SessionCredentials } from '../account/Credentials';
import type {
  PendingWallet,
  WalletContainer,
  WalletFeed,
  WalletGroup,
  WalletRecord,
} from './model/types';
import type { BareWallet } from './model/BareWallet';
import {
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
} from './model/WalletContainer';
import {
  DeviceAccountContainer,
  ReadonlyAccountContainer,
  type ExternallyOwnedAccount,
} from './model/AccountContainer';
import { walletRecordUpgrades } from './model/versions';

function generateGroupName(
  record: WalletRecord | null,
  walletContainer: WalletContainer
) {
  const isMnemonicGroup = isMnemonicContainer(walletContainer);
  const isPrivateKeyGroup = isPrivateKeyContainer(walletContainer);
  const isHardwareGroup = isHardwareContainer(walletContainer);
  const isReadonlyGroup = isReadonlyContainer(walletContainer);

  if (isReadonlyGroup || isPrivateKeyGroup) {
    return '';
  }

  const prefix = isMnemonicGroup
    ? 'Wallet'
    : isHardwareGroup
    ? capitalize(walletContainer.provider)
    : 'Watch';
  const name = (index: number) => `${prefix} Group #${index}`;
  if (!record) {
    return name(1);
  }
  const sameCategoryGroups = record.walletManager.groups.filter((group) => {
    if (isMnemonicGroup) {
      return isMnemonicContainer(group.walletContainer);
    } else if (isHardwareGroup) {
      return isHardwareContainer(group.walletContainer);
    } else {
      throw new Error('Unsupported category');
    }
  });
  function isNameUsed(name: string) {
    const index = sameCategoryGroups.findIndex((group) => group.name === name);
    return index !== -1;
  }
  let currentCount = -1;
  if (isHardwareGroup) {
    currentCount = record.walletManager.internalHardwareGroupCounter ?? 0;
  } else if (isMnemonicGroup) {
    currentCount = record.walletManager.internalMnemonicGroupCounter;
  } else {
    throw new Error('Unsupported group');
  }
  let potentialName = name(currentCount + 1);
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

  static getFirstWallet(record: WalletRecord): ExternallyOwnedAccount | null {
    return record.walletManager.groups[0]?.walletContainer.getFirstWallet();
  }

  static getWalletGroupByAddress(record: WalletRecord, address: string) {
    const sortedGroups = sortBy(record.walletManager.groups, (group) =>
      getContainerType(group.walletContainer)
    );
    for (const group of sortedGroups) {
      const wallet = group.walletContainer.getWalletByAddress(address);
      if (wallet) {
        return group;
      }
    }
    return null;
  }

  static getWalletByAddress(
    record: WalletRecord,
    { address, groupId }: { address: string; groupId: string | null }
  ) {
    const sortedGroups = sortBy(record.walletManager.groups, (group) =>
      getContainerType(group.walletContainer)
    );
    const group = sortedGroups.find((group) => {
      if (groupId) {
        return group.id === groupId;
      } else {
        return group.walletContainer.getWalletByAddress(address);
      }
    });
    const wallet = group?.walletContainer.getWalletByAddress(address) ?? null;
    return wallet;
  }

  static getSignerWalletByAddress(
    record: WalletRecord,
    address: string
  ): BareWallet | null {
    const sortedGroups = sortBy(record.walletManager.groups, (group) =>
      getContainerType(group.walletContainer)
    );
    for (const group of sortedGroups) {
      if (isSignerContainer(group.walletContainer)) {
        const wallet = group.walletContainer.getWalletByAddress(address);
        if (wallet) {
          return wallet;
        }
      }
    }
    return null;
  }

  static createOrUpdateRecord(
    record: WalletRecord | null,
    pendingWallet: PendingWallet
  ): WalletRecord {
    if (!record) {
      const { walletContainer } = pendingWallet;
      const isHardwareGroup = isHardwareContainer(walletContainer);
      const isMnemonicGroup = isMnemonicContainer(walletContainer);
      return {
        version: 5,
        walletManager: {
          groups: [
            createGroup({
              name: generateGroupName(record, walletContainer),
              walletContainer,
              origin: pendingWallet.origin,
              created: Date.now(),
            }),
          ],
          currentAddress: walletContainer.getFirstWallet().address,
          internalMnemonicGroupCounter: isMnemonicGroup ? 1 : 0,
          internalHardwareGroupCounter: isHardwareGroup ? 1 : 0,
        },
        transactions: [],
        permissions: {},
        publicPreferences: {},
        feed: { completedAbilities: [], dismissedAbilities: [] },
      };
    }
    return produce(record, (draft) => {
      const { walletContainer } = pendingWallet;
      const isHardwareGroup = isHardwareContainer(walletContainer);
      const isReadonlyGroup = isReadonlyContainer(walletContainer);
      const isMnemonicGroup = isMnemonicContainer(walletContainer);
      const isPrivateKeyGroup = isPrivateKeyContainer(walletContainer);
      if (!draft.feed.completedAbilities) {
        draft.feed.completedAbilities = [];
      }
      if (!draft.feed.dismissedAbilities) {
        draft.feed.dismissedAbilities = [];
      }
      /**
       * NOTE:
       * (De)duplication logic:
       * When adding signer/hw wallet, existing readonly wallet should be removed
       * When adding readonly address, it should be ignored if signer/hw wallet exists
       * Duplication of addresses between mnemonic/privateKey/HW wallets is allowed
       */

      // Reuse existing wallet names for new addresses
      for (const wallet of walletContainer.wallets) {
        if (!wallet.name) {
          const existingWallet = WalletRecordModel.getWalletByAddress(record, {
            address: wallet.address,
            groupId: null,
          });
          if (existingWallet && existingWallet.name) {
            wallet.name = existingWallet.name;
          }
        }
      }

      // Remove existing readonly wallets if they exist
      if (!isReadonlyContainer(walletContainer)) {
        for (const wallet of walletContainer.wallets) {
          const existingReadonlyGroup = draft.walletManager.groups.find(
            (group) =>
              isReadonlyContainer(group.walletContainer) &&
              group.walletContainer.getWalletByAddress(wallet.address)
          );
          if (existingReadonlyGroup) {
            WalletRecordModel.mutateRemoveAddress(draft, {
              address: wallet.address,
              groupId: existingReadonlyGroup.id,
            });
          }
        }
      }

      if (isPrivateKeyGroup) {
        const { privateKey } = walletContainer.getFirstWallet();
        // NOTE:
        // There can also be the same private key among Mnemonic Containers.
        // Should we create a private key group in this case, thus duplicating an account?
        // For now, that is what we're doing
        const existingGroup = draft.walletManager.groups.find((group) => {
          return (
            isPrivateKeyContainer(group.walletContainer) &&
            group.walletContainer.wallets.some(
              (wallet) => wallet.privateKey === privateKey
            )
          );
        });
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
      } else if (isMnemonicGroup) {
        const mnemonic = walletContainer.getMnemonic();
        invariant(mnemonic?.phrase, 'Mnemonic not found');
        const { seedHash } = walletContainer;
        const existingGroup = draft.walletManager.groups.find((group) => {
          return (
            isSignerContainer(group.walletContainer) &&
            (seedHash
              ? seedHash === group.walletContainer.seedHash
              : group.walletContainer.getMnemonic()?.phrase === mnemonic.phrase)
          );
        });
        if (existingGroup && seedHash) {
          assertSignerContainer(existingGroup.walletContainer);
          for (const wallet of walletContainer.wallets) {
            existingGroup.walletContainer.addWallet(wallet, seedHash);
          }

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
      } else if (isHardwareGroup) {
        // I am not sure if walletContainer.device.productId is unique between devices
        // of the same model or not, so for now we always create a new group for hardware imports
        draft.walletManager.internalHardwareGroupCounter ??= 0;
        draft.walletManager.internalHardwareGroupCounter += 1;
        draft.walletManager.groups.push(
          createGroup({
            walletContainer,
            name: generateGroupName(record, walletContainer),
            origin: pendingWallet.origin,
            created: Date.now(),
          })
        );
      } else if (isReadonlyGroup) {
        const { address } = walletContainer.getFirstWallet();

        const existingGroup = draft.walletManager.groups.find((group) => {
          return group.walletContainer.getWalletByAddress(address) != null;
        });
        if (existingGroup) {
          // TODO: In the future, if we have a feature where user creates wallet name
          // during import, we should update existing address with this name
          return draft;
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
      } else {
        throw new Error('Unknown Container type');
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
    const entry = upgradeRecord(persistedEntry, walletRecordUpgrades);

    entry.walletManager.groups = await Promise.all(
      entry.walletManager.groups.map(async (group) => {
        if (isMnemonicContainer(group.walletContainer)) {
          group.walletContainer =
            await MnemonicWalletContainer.restoreWalletContainer(
              group.walletContainer,
              credentials
            );
        } else if (isPrivateKeyContainer(group.walletContainer)) {
          const { wallets } = group.walletContainer;
          group.walletContainer = new PrivateKeyWalletContainer(wallets);
        } else if (isHardwareContainer(group.walletContainer)) {
          group.walletContainer = new DeviceAccountContainer(
            group.walletContainer
          );
        } else if (isReadonlyContainer(group.walletContainer)) {
          const { wallets } = group.walletContainer;
          group.walletContainer = new ReadonlyAccountContainer(wallets);
        } else {
          throw new Error(`Unexpected Account Container`);
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
    if (!isMnemonicContainer(group.walletContainer)) {
      throw new Error('Not a Mnemonic Container');
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

  static async getPendingRecoveryPhrase(
    pendingWallet: PendingWallet,
    credentials: SessionCredentials
  ) {
    const walletContainer = pendingWallet.walletContainer;
    if (!walletContainer || !isMnemonicContainer(walletContainer)) {
      throw new Error('Pending wallet is not a Mnemonic Container');
    }
    const encryptedPhrase = walletContainer.getMnemonic()?.phrase;
    if (!encryptedPhrase) {
      throw new Error('Pending wallet does not have a seed phrase');
    }
    return decryptMnemonic(encryptedPhrase, credentials);
  }

  static async getPrivateKey(
    record: WalletRecord,
    { address }: { address: string }
  ) {
    let wallet: BareWallet | null = null;
    for (const group of record.walletManager.groups) {
      if (!isSignerContainer(group.walletContainer)) {
        continue;
      }
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

  /**
   * if {groupId} is provided, remove wallet from this group,
   * otherwise, find first group that holds this address
   */
  static mutateRemoveAddress(
    draft: WalletRecord,
    { address, groupId }: { address: string; groupId: string | null }
  ) {
    const normalizedAddress = normalizeAddress(address);
    const [pos, group] = findWithIndex(draft.walletManager.groups, (group) => {
      if (groupId) {
        return group.id === groupId;
      } else {
        return group.walletContainer.wallets.some(
          (wallet) => normalizeAddress(wallet.address) === normalizedAddress
        );
      }
    });
    if (!group) {
      throw new Error('Group not found');
    }
    const isLastAddress = group.walletContainer.wallets.length === 1;
    if (isMnemonicContainer(group.walletContainer) && isLastAddress) {
      // I guess this is a safetyguard to prevent removing unbackedup mnemonic groups
      throw new Error(
        'Removing last wallet from a Mnemonic group is not allowed. You can remove the whole group'
      );
    }
    if (isHardwareContainer(group.walletContainer) && isLastAddress) {
      throw new Error(
        'Removing last wallet from a Hardware group is not allowed. You can remove the whole group'
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
      currentAddress && normalizedAddress === normalizeAddress(currentAddress);
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
  }

  static removeAddress(
    record: WalletRecord,
    { address, groupId }: { address: string; groupId: string | null }
  ) {
    return produce(record, (draft) => {
      WalletRecordModel.mutateRemoveAddress(draft, { address, groupId });
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
      let didRename = false;
      for (const group of draft.walletManager.groups) {
        for (const wallet of group.walletContainer.wallets) {
          if (normalizeAddress(wallet.address) === normalizedAddress) {
            wallet.name = name || null;
            didRename = true;
            // NOTE: don't break loop as we expect multiple groups to hold same address
          }
        }
      }
      if (!didRename) {
        throw new Error(`Wallet for ${address} not found`);
      }
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
      if (address) {
        const normalizedAddress = normalizeAddress(address);
        spliceItem(existingPermissions, normalizedAddress);
      } else {
        // remove all items
        existingPermissions.length = 0;
      }
      if (existingPermissions.length === 0) {
        if (!permission.chain || permission.chain === NetworkId.Ethereum) {
          // remove whole record for `origin` completely
          delete draft.permissions[origin];
        } else {
          draft.permissions[origin].addresses = [];
        }
      }
    });
  }

  static getPreferences(record: WalletRecord | null) {
    const defaults: Required<WalletRecord['publicPreferences']> = {
      showNetworkSwitchShortcut: true,
      overviewChain: '',
      configurableNonce: false,
      invitationBannerDismissed: false,
      recentAddresses: [],
      mintDnaBannerDismissed: false,
      upgradeDnaBannerDismissed: false,
      backupReminderDismissedTime: 0,
      enableTestnets: false,
      testnetMode: null,
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
