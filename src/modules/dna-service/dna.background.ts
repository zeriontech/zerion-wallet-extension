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
import type { DnaAction } from './types';

const ACTION_QUEUE_KEY = 'actionDnaQueue-22-12-2021';
const DNA_API_ENDPOINT = 'https://dna.zerion.io/api/v1';

type DnaActionWithTimestamp = DnaAction & { timestamp: number };

const dnaServiceEmitter = createNanoEvents<{
  registerSuccess: (action: DnaAction) => void;
  registerError: (error: Error, action: DnaAction) => void;
}>();

const ONE_DAY = 1000 * 60 * 60 * 24;

export class DnaService {
  private sendingInProgress: boolean;

  constructor() {
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

  async popAction() {
    const currentQueue = await browserStorage.get<DnaActionWithTimestamp[]>(
      ACTION_QUEUE_KEY
    );
    currentQueue?.shift();
    await browserStorage.set(ACTION_QUEUE_KEY, currentQueue);
    this.tryRegisterAction();
  }

  async takeFirstRecentAction() {
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

  async registerAction(action: DnaAction) {
    this.sendingInProgress = true;
    return new Promise<{ success: boolean }>((resolve) => {
      ky.post(`${DNA_API_ENDPOINT}/actions`, {
        // random stuff for backend scheme validation
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

  initialize() {
    emitter.on('walletCreated', async ({ walletContainer, origin }) => {
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
