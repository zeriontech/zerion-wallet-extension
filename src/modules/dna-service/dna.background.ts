import { WalletOrigin } from 'src/shared/WalletOrigin';
import ky from 'ky';
import omit from 'lodash/omit';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { createNanoEvents } from 'nanoevents';
import { ethers } from 'ethers';
import { version } from 'src/shared/packageVersion';
import * as browserStorage from 'src/background/webapis/storage';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { emitter } from 'src/background/events';
import { isReadonlyContainer } from 'src/shared/types/validators';
import type { Wallet } from 'src/shared/types/Wallet';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import type { Account } from 'src/background/account/Account';
import type { DnaAction } from './types';

const REGISTER_ALL_WALLETS_INVOKED_KEY = 'registerAllWalletsInvoked-14-10-2024';
const ACTION_QUEUE_KEY = 'actionDnaQueue-22-12-2021';
const DNA_API_ENDPOINT = 'https://dna.zerion.io/api/v1';

type DnaActionWithTimestamp = DnaAction & { timestamp: number };

export const dnaServiceEmitter = createNanoEvents<{
  registerSuccess: (action: DnaAction) => void;
  registerError: (error: Error, action: DnaAction) => void;
}>();

const ONE_DAY = 1000 * 60 * 60 * 24;

export class DnaService {
  private readonly getWallet: () => Wallet;
  private sendingInProgress: boolean;

  constructor({ getWallet }: { getWallet: () => Wallet }) {
    this.getWallet = getWallet;
    this.sendingInProgress = false;
  }

  async pushAction(action: DnaAction) {
    const currentQueue = await browserStorage.get<DnaActionWithTimestamp[]>(
      ACTION_QUEUE_KEY
    );
    await browserStorage.set(ACTION_QUEUE_KEY, [
      ...(currentQueue || []),
      { ...action, timestamp: Date.now() },
    ]);
    return new Promise<void>((resolve, reject) => {
      this.tryRegisterAction();
      const unsub = [
        dnaServiceEmitter.on('registerSuccess', (registeredAction) => {
          if (action.id === registeredAction.id) {
            unsub.forEach((un) => un());
            resolve();
          }
        }),
        dnaServiceEmitter.on('registerError', (error) => {
          unsub.forEach((un) => un());
          reject(error);
        }),
      ];
    });
  }

  private async popAction() {
    const currentQueue = await browserStorage.get<DnaActionWithTimestamp[]>(
      ACTION_QUEUE_KEY
    );
    currentQueue?.shift();
    await browserStorage.set(ACTION_QUEUE_KEY, currentQueue);
    this.tryRegisterAction();
  }

  private async takeFirstRecentAction() {
    const currentQueue = await browserStorage.get<DnaActionWithTimestamp[]>(
      ACTION_QUEUE_KEY
    );
    if (!currentQueue?.length) {
      return null;
    }
    const currentTime = Date.now();
    while (
      currentQueue[0] &&
      (!currentQueue[0].timestamp ||
        currentTime - currentQueue[0].timestamp > ONE_DAY)
    ) {
      currentQueue.shift();
    }
    await browserStorage.set(ACTION_QUEUE_KEY, currentQueue);
    return omit(currentQueue[0], 'timestamp');
  }

  private async registerAction(action: DnaAction) {
    this.sendingInProgress = true;
    return new Promise<{ success: boolean }>((resolve) => {
      ky.post(`${DNA_API_ENDPOINT}/actions`, {
        retry: {
          // increase retry attempt count
          limit: 3,
          // enable retry for POST
          methods: ['post'],
        },
        // random header for backend scheme validation
        headers: { 'Z-Proof': uuidv4() },
        body: JSON.stringify(action),
      })
        .json()
        .then(() => {
          this.popAction();
          this.sendingInProgress = false;
          dnaServiceEmitter.emit('registerSuccess', action);
          resolve({ success: true });
        })
        .catch((error) => {
          this.sendingInProgress = false;
          dnaServiceEmitter.emit('registerError', error, action);
          resolve({ success: false });
        });
    });
  }

  async tryRegisterAction() {
    if (this.sendingInProgress) {
      return { success: false };
    }
    const action = await this.takeFirstRecentAction();
    if (!action) {
      return { success: false };
    }
    return this.registerAction(action);
  }

  async getPromoteDnaSigningMessage({
    params: { collectionName, tokenName },
  }: {
    params: {
      collectionName: string;
      tokenName: string;
    };
  }) {
    const actionId = uuidv4();
    const rawMessage = `Make ${collectionName} #${tokenName} primary\n\n${actionId}`;
    const message = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(rawMessage));
    return { message, actionId };
  }

  async promoteDnaToken({
    params,
  }: {
    params: {
      address: string;
      actionId: string;
      tokenName: string;
      signature: string;
    };
  }) {
    return this.pushAction({
      address: normalizeAddress(params.address),
      id: params.actionId,
      payload: {
        promoteToken: {
          generation: 'OnePointO',
          id: params.tokenName,
          signature: params.signature,
        },
      },
    });
  }

  async registerWallet({
    params,
  }: {
    params: {
      address: string;
      origin?: WalletOrigin;
    };
  }) {
    const { address, origin = WalletOrigin.imported } = params;
    const actionId = uuidv4();
    return this.pushAction({
      address: normalizeAddress(address),
      id: actionId,
      payload: {
        registerWallet: {
          imported: origin === WalletOrigin.imported,
          platform: 'extension',
          version,
        },
      },
    });
  }

  async registerTransaction({
    address,
    hash,
    chain,
  }: {
    address: string;
    hash: string;
    chain: string;
  }) {
    const actionId = uuidv5(
      `sign(${chain}, ${hash})`,
      'ddf8b936-fec5-48b3-a258-a73dcd897f0a'
    );

    return this.pushAction({
      address: normalizeAddress(address),
      id: actionId,
      payload: {
        signTx: {
          network: chain,
          platform: 'extension',
          txHash: hash,
          version,
        },
      },
    });
  }

  async gm({ params }: { params: { address: string } }) {
    const actionId = uuidv4();
    const { address } = params;
    return this.pushAction({
      address: normalizeAddress(address),
      id: actionId,
      payload: {
        gm: {},
      },
    });
  }

  async claimPerk({
    params,
  }: {
    params: {
      actionId: string;
      address: string;
      tokenId: string;
      backgroundId: number;
      signature: string;
    };
  }) {
    const { actionId, address, tokenId, backgroundId, signature } = params;
    return this.pushAction({
      address: normalizeAddress(address),
      id: actionId,
      payload: {
        claimPerk: {
          extensionBackground: {
            tokenId,
            backgroundId,
            signature,
          },
        },
      },
    });
  }

  async developerOnly_resetActionQueue() {
    return browserStorage.set(ACTION_QUEUE_KEY, []);
  }

  async registerAllWallets() {
    const isInvoked = await browserStorage.get<boolean>(
      REGISTER_ALL_WALLETS_INVOKED_KEY
    );
    if (isInvoked) {
      return;
    }

    const wallet = this.getWallet();
    const walletGroups = await wallet.uiGetWalletGroups({
      context: INTERNAL_SYMBOL_CONTEXT,
    });

    const ownedAddresses =
      walletGroups
        ?.filter((group) => !isReadonlyContainer(group.walletContainer))
        ?.flatMap((group) =>
          group.walletContainer.wallets.map((wallet) => ({
            address: wallet.address,
            origin: group.origin || undefined,
          }))
        ) || [];

    let didFail = false;
    for (const { address, origin } of ownedAddresses) {
      try {
        await this.registerWallet({
          params: { address, origin },
        });
      } catch (error) {
        didFail = true;
        console.warn('registerWallet error', error); // eslint-disable-line no-console
      }
    }

    if (!didFail) {
      await browserStorage.set(REGISTER_ALL_WALLETS_INVOKED_KEY, true);
    }
  }

  initialize({ account }: { account: Account }) {
    account.on('authenticated', this.registerAllWallets.bind(this));
    emitter.on('walletCreated', async ({ walletContainer, origin }) => {
      if (isReadonlyContainer(walletContainer)) {
        return;
      }
      for (const wallet of walletContainer.wallets) {
        await this.registerWallet({
          params: { address: wallet.address, origin },
        });
      }
    });
    emitter.on('transactionSent', (data) => {
      this.registerTransaction({
        address: data.transaction.from,
        hash: data.transaction.hash,
        chain: data.chain,
      });
    });
  }
}
