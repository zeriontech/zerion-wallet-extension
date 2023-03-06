import { WalletOrigin } from 'src/shared/WalletOrigin';
import ky from 'ky';
import omit from 'lodash/omit';
import browser from 'webextension-polyfill';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { ethers } from 'ethers';
import { version } from 'src/shared/packageVersion';
import * as browserStorage from 'src/background/webapis/storage';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { Account } from 'src/background/account/Account';
import { networksStore } from 'src/modules/networks/networks-store.background';
import { emitter } from 'src/background/events';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { DnaAction } from './types';
import { TRY_REGISTER_ACTION_EVENT } from './constants';

const ACTION_QUEUE_KEY = 'actionDnaQueue-22-12-2021';
const DNA_API_ENDPOINT = 'https://dna.zerion.io/api/v1';

type DnaActionWithTimestamp = DnaAction & { timestamp: number };

const ONE_DAY = 1000 * 60 * 60 * 24;

export class DnaService {
  private account: Account;
  private sendingInProgress: boolean;

  constructor(account: Account) {
    this.account = account;
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
    browser.runtime.sendMessage(browser.runtime.id, {
      event: TRY_REGISTER_ACTION_EVENT,
    });
  }

  async popAction() {
    const currentQueue = await browserStorage.get<DnaActionWithTimestamp[]>(
      ACTION_QUEUE_KEY
    );
    currentQueue?.shift();
    await browserStorage.set(ACTION_QUEUE_KEY, currentQueue);
    browser.runtime.sendMessage(browser.runtime.id, {
      event: TRY_REGISTER_ACTION_EVENT,
    });
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

  async registerAction({
    request,
  }: {
    request: { headers: Record<string, string>; body: string };
  }) {
    this.sendingInProgress = true;
    return new Promise<{ success: boolean }>((resolve) => {
      ky.post(`${DNA_API_ENDPOINT}/actions`, request)
        .json()
        .then(() => {
          this.popAction();
          this.sendingInProgress = false;
          resolve({ success: true });
        })
        .catch(() => {
          this.sendingInProgress = false;
          resolve({ success: false });
        });
    });
  }

  async tryRegisterAction({ params }: { params: { captcha: string } }) {
    if (this.sendingInProgress) {
      return { success: false };
    }
    const actionBody = await this.takeFirstRecentAction();
    if (!actionBody) {
      return { success: false };
    }
    return this.registerAction({
      request: {
        headers: { 'Z-Proof': params.captcha },
        body: JSON.stringify(actionBody),
      },
    });
  }

  async shouldRegisterAction() {
    if (this.sendingInProgress) {
      return false;
    }
    const actionBody = await this.takeFirstRecentAction();
    return Boolean(actionBody);
  }

  async promoteDnaToken({
    params,
  }: {
    params: { address: string; collectionName: string; tokenName: string };
  }) {
    const actionId = uuidv4();
    const rawSignatureMessage = `Make ${params.collectionName} #${params.tokenName} primary\n\n${actionId}`;
    const signingMessage = ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(rawSignatureMessage)
    );
    const signature = await this.account.getCurrentWallet().personalSign({
      params: {
        params: [signingMessage],
        initiator: INTERNAL_ORIGIN,
      },
      context: { origin: INTERNAL_ORIGIN },
    });

    return this.pushAction({
      address: normalizeAddress(params.address),
      id: actionId,
      payload: {
        promoteToken: {
          generation: 'OnePointO',
          id: params.tokenName,
          signature,
        },
      },
    });
  }

  async registerWallet({
    address,
    origin,
  }: {
    address: string;
    origin: WalletOrigin;
  }) {
    const actionId = uuidv4();
    return this.pushAction({
      address: normalizeAddress(address),
      id: actionId,
      payload: {
        registerWallet: {
          imported: origin === WalletOrigin.imported,
          platform: 'web',
          version,
        },
      },
    });
  }

  async registerTransaction({
    address,
    hash,
    chainId,
  }: {
    address: string;
    hash: string;
    chainId: number;
  }) {
    const networks = await networksStore.load();
    const chain = networks
      .getChainById(ethers.utils.hexValue(chainId))
      .toString();

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
          platform: 'web',
          txHash: hash,
          version,
        },
      },
    });
  }

  initialize() {
    emitter.on('walletCreated', async ({ walletContainer, origin }) => {
      for (const wallet of walletContainer.wallets) {
        await this.registerWallet({ address: wallet.address, origin });
      }
    });
    emitter.on('transactionSent', (data) => {
      this.registerTransaction({
        address: data.transaction.from,
        hash: data.transaction.hash,
        chainId: data.transaction.chainId,
      });
    });
  }
}
