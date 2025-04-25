import { produce } from 'immer';
import { PersistentStore } from 'src/modules/persistent-store';
import { invariant } from 'src/shared/invariant';
import { getError } from 'src/shared/errors/getError';
import { ErrorWithEnumerableMessage } from 'src/shared/errors/errors';
import type { User } from 'src/shared/types/User';
import type { Credentials, SessionCredentials } from '../account/Credentials';
import { emitter } from '../events';
import { Account } from '../account/Account';
import type { WalletRecord } from './model/types';
import { WalletRecordModel as Model } from './WalletRecord';

type EncryptedWalletRecord = string;

type WalletStoreState = Record<string, EncryptedWalletRecord | undefined>;

export class InternalBackupError extends ErrorWithEnumerableMessage {
  didRestore: boolean;
  constructor(error: Error, { didRestore }: { didRestore: boolean }) {
    super(error.message);
    this.name = error.name !== 'Error' ? error.name : 'InternalBackupError';
    this.didRestore = didRestore;
  }
}

type RecordBackup = { user: User; record: string };
function stringifyBackup({ user, record }: RecordBackup): string {
  return JSON.stringify({ user, record });
}

function parseBackup(value: string): RecordBackup {
  const parsed = JSON.parse(value) as RecordBackup;
  invariant(parsed.user, 'User not found in backup');
  invariant(parsed.record, 'Record not found in backup');
  return parsed;
}

export class WalletStore extends PersistentStore<WalletStoreState> {
  static key = 'wallet';
  /** Store unencrypted "lastRecord" to avoid unnecessary stringifications */
  private lastRecord: WalletRecord | null = null;

  constructor(initialState: WalletStoreState, key = WalletStore.key) {
    super(initialState, key);
  }

  /** throws if encryptionKey is wrong */
  async check(id: string, encryptionKey: string) {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      throw new Error(`Cannot read: record for ${id} not found`);
    }
    return Model.decryptRecord(encryptionKey, encryptedRecord);
  }

  async read(
    id: string,
    credentials: Credentials
  ): Promise<WalletRecord | null> {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      return null;
    }
    this.lastRecord = await Model.decryptAndRestoreRecord(
      encryptedRecord,
      credentials
    );
    return this.lastRecord;
  }

  /** Prefer WalletStore['save'] unless necessary */
  private async encryptAndSave(
    id: string,
    credentials: Credentials,
    record: WalletRecord
  ) {
    const encryptedRecord = await Model.encryptRecord(
      credentials.encryptionKey,
      record
    );
    await this.setState((state) =>
      produce(state, (draft) => {
        draft[id] = encryptedRecord;
      })
    );
    this.lastRecord = record;
  }

  async save(id: string, credentials: Credentials, record: WalletRecord) {
    if (this.lastRecord === record) {
      return;
    }
    await this.encryptAndSave(id, credentials, record);
  }

  async createBackup(id: string) {
    /**
     * Accessing user is a cross-concern, but this is the only way
     * to make our backup truly atomic and independent:
     * encrypted record relies on `salt` stored in the user object,
     * and for a robust backup recovery it's best to store this object
     * together with the encrypted record
     */
    const user = await Account.readCurrentUser();
    const record = (await this.getSavedState())[id];
    invariant(record, `Record not found for id: ${id}`);
    invariant(user && user.id === id, `User not found for id: ${id}`);
    return this.setState({
      ...this.state,
      [`backup:${id}`]: stringifyBackup({ user, record }),
    });
  }

  async restoreFromBackup(id: string) {
    const key = `backup:${id}`;
    const state = await this.getSavedState();
    const saved = state[key];
    invariant(saved, `Backup not found for id: ${id}`);
    const { user, record } = parseBackup(saved);
    await Promise.all([
      this.setState((state) =>
        produce(state, (draft) => {
          draft[id] = record;
          delete draft[key];
        })
      ),
      Account.writeCurrentUser(user),
    ]);
  }

  async restoreFromAnyBackup() {
    const state = await this.getSavedState();
    const key = Object.keys(state).find((key) => key.startsWith('backup:'));
    if (key) {
      await this.restoreFromBackup(key.split(':')[1]);
    } else {
      throw new Error('No backups found');
    }
  }

  async clearBackup(id: string) {
    return this.setState((state) =>
      produce(state, (draft) => {
        const key = `backup:${id}`;
        delete draft[key];
      })
    );
  }

  /**
   * Executes an operation with a backup and an automatic recovery.
   * Guarantees atomicity by restoring to the previous state if the operation fails.
   */
  async withBackup(id: string, operation: () => Promise<unknown>) {
    await this.createBackup(id);
    try {
      await operation();
      await this.clearBackup(id);
    } catch (error) {
      try {
        await this.restoreFromBackup(id);
        emitter.emit('globalError', {
          name: 'internal_error',
          message: 'Atomic wallet update failed. Restored from backup.',
        });
        console.log('Successfully restored wallet record from backup'); // eslint-disable-line no-console
      } catch {
        emitter.emit('globalError', {
          name: 'internal_error',
          message: 'Atomic wallet update failed. Restore from backup failed.',
        });
        throw new InternalBackupError(getError(error), { didRestore: false });
      }
      throw error;
    }
  }

  async reEncrypt({
    id,
    credentials,
    newCredentials,
  }: {
    id: string;
    credentials: SessionCredentials;
    newCredentials: SessionCredentials;
  }) {
    await this.ready();
    console.log('reading', { id, credentials, state: this.getState() });
    const currentRecord = await this.read(id, credentials);
    invariant(currentRecord, `Record not found for ${id}`);
    const newRecord = await Model.reEncryptRecord(currentRecord, {
      credentials,
      newCredentials,
    });
    await this.encryptAndSave(id, newCredentials, newRecord);
  }

  deleteMany(keys: string[]) {
    this.setState((state) =>
      produce(state, (draft) => {
        for (const key of keys) {
          delete draft[key];
        }
      })
    );
    this.lastRecord = null;
  }
}

export function peakSavedWalletState(key = WalletStore.key) {
  return WalletStore.readSavedState<WalletStoreState>(key);
}
