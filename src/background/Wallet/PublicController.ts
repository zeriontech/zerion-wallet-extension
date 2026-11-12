import { ethers } from 'ethers';
import { nanoid } from 'nanoid';
import type {
  NotificationWindow,
  NotificationWindowProps,
} from 'src/background/NotificationWindow/NotificationWindow';
import type { ChannelContext } from 'src/shared/types/ChannelContext';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import {
  InvalidParams,
  MethodNotImplemented,
  OriginNotAllowed,
  SwitchChainError,
  UserRejected,
  UserRejectedTxSignature,
} from 'src/shared/errors/errors';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/constants';
import { getNetworksStore } from 'src/modules/networks/networks-store.background';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { sanitizeTypedDataRaw } from 'src/modules/ethereum/message-signing/prepareTypedData';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { isKnownDapp } from 'src/shared/dapps/known-dapps';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import { invariant } from 'src/shared/invariant';
import { phishingDefenceService } from 'src/modules/phishing-defence/phishing-defence-service';
import { isDeviceAccount } from 'src/shared/types/validators';
import { getWalletNameFlagsByOrigin } from 'src/shared/preferences-helpers';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { isSolanaAddress } from 'src/modules/solana/shared';
import type { SolSignTransactionResult } from 'src/modules/solana/transactions/SolTransactionResponse';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { base64ToUint8Array } from 'src/modules/crypto';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { emitter } from '../events';

import type { Wallet, PublicMethodParams } from './Wallet';

interface Web3WalletPermission {
  /**
   * This seems to be a method that didn't get much adoption, but
   * metamask and some dapps use it for some reason:
   * https://eips.ethereum.org/EIPS/eip-2255
   */
  // The name of the method corresponding to the permission
  parentCapability: string;

  // The date the permission was granted, in UNIX epoch time
  date?: number;
}

export class PublicController {
  wallet: Wallet;
  notificationWindow: NotificationWindow;

  constructor(wallet: Wallet, { notificationWindow }: { notificationWindow: NotificationWindow }) {
    this.wallet = wallet;
    this.notificationWindow = notificationWindow;
  }

  private async safeOpenDialogWindow<T>(origin: string, props: NotificationWindowProps<T>) {
    const id = await this.notificationWindow.open(props);
    phishingDefenceService.checkDapp(origin).then(({ status, isWhitelisted }) => {
      if (status === 'phishing' && !isWhitelisted) {
        phishingDefenceService.blockOriginWithWarning(origin);
        this.notificationWindow.emit('reject', {
          id,
          error: new UserRejected('Malicious DApp'),
        });
      }
    });
  }

  async showCorrectEcosystemWalletSelection({
    context,
    ecosystem,
  }: {
    context?: Partial<ChannelContext>;
    ecosystem: BlockchainType;
  }): Promise<void> {
    const currentAddress = this.wallet.readCurrentAddress();
    if (currentAddress && isMatchForEcosystem(currentAddress, ecosystem)) {
      return;
    }
    invariant(context?.origin, 'This method requires origin');
    const origin = context.origin;

    return new Promise<void>((resolve, reject) => {
      this.safeOpenDialogWindow(origin, {
        route: '/selectConnectedWallet',
        search: `?origin=${encodeURIComponent(origin)}&ecosystem=${ecosystem}`,
        requestId: `${origin}:ecosystem-switch:${nanoid()}`,
        tabId: context.tabId ?? null,
        onResolve: async ({ address }: { address: string }) => {
          invariant(
            isMatchForEcosystem(address, ecosystem),
            'Selected address does not match required ecosystem',
          );
          await this.wallet.setCurrentAddress({
            params: { address },
            context: INTERNAL_SYMBOL_CONTEXT,
          });
          resolve();
        },
        onDismiss: () => {
          reject(new UserRejected('User rejected ecosystem wallet switch'));
        },
      });
    });
  }

  /**
   * Every dapp signing request starts here: the current wallet must belong to
   * `ecosystem` (the user is asked to switch if it does not) and the calling
   * origin must be connected to it.
   */
  private async requireConnectedAccount(
    context: Partial<ChannelContext> | undefined,
    ecosystem: BlockchainType,
  ) {
    const currentAddress = await this.ensureEcosystemAccount(context, ecosystem);
    return { currentAddress, ...this.assertConnectedAccount(context, currentAddress) };
  }

  /**
   * Brings the current wallet into `ecosystem`, asking the user to switch if
   * needed, and returns the address that will sign.
   */
  private async ensureEcosystemAccount(
    context: Partial<ChannelContext> | undefined,
    ecosystem: BlockchainType,
  ) {
    this.wallet.ensureCurrentAddress();
    await this.showCorrectEcosystemWalletSelection({ context, ecosystem });
    return this.wallet.ensureCurrentAddress();
  }

  /** The calling origin must be connected to the account that will sign */
  private assertConnectedAccount(
    context: Partial<ChannelContext> | undefined,
    currentAddress: string,
  ) {
    if (!this.wallet.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    return { origin: context.origin, tabId: context.tabId || null };
  }

  /** Opens the approval dialog for a signing request and settles with the user's decision */
  private async openSigningDialog<T = unknown>({
    origin,
    tabId,
    id,
    ecosystem,
    route,
    search,
  }: {
    origin: string;
    tabId: number | null;
    id: string | number;
    ecosystem: BlockchainType;
    route: string;
    search: string;
  }): Promise<T> {
    const wallet = this.wallet.getCurrentWalletSync({
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    const preferences = await this.wallet.getGlobalPreferences({
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    const isDeviceWallet = wallet ? isDeviceAccount(wallet) : false;
    const openInTab = isDeviceWallet && preferences.bluetoothSupportEnabled;
    return new Promise<T>((resolve, reject) => {
      this.safeOpenDialogWindow<T>(origin, {
        requestId: `${origin}:${id}`,
        route,
        // Solana requests have never asked for the taller hardware-wallet window
        height: ecosystem === 'evm' && isDeviceWallet ? 800 : undefined,
        search,
        tabId,
        onResolve: (result) => {
          resolve(result);
        },
        onDismiss: () => {
          reject(new UserRejectedTxSignature());
        },
        type: openInTab ? 'tab' : undefined,
      });
    });
  }

  async eth_accounts({ context }: PublicMethodParams) {
    const currentAddress = this.wallet.readCurrentAddress();
    if (!currentAddress) {
      return [];
    }
    if (this.wallet.allowedOrigin(context, currentAddress)) {
      return [currentAddress];
    } else {
      return [];
    }
  }

  async sol_connect({ context, id }: PublicMethodParams) {
    invariant(context?.origin, 'This method requires origin');
    return this.eth_requestAccounts({ id, context, params: [] }, { ecosystem: 'solana' });
  }

  async sol_disconnect({ context }: PublicMethodParams) {
    invariant(context?.origin, 'This method requires origin');

    return this.wallet.removeSolanaPermissions({
      context: INTERNAL_SYMBOL_CONTEXT,
      params: { origin: context.origin },
    });
  }

  async sol_signTransaction({
    id,
    params: { txBase64, clientScope },
    context,
  }: PublicMethodParams<{
    txBase64: string;
    clientScope?: string;
  }>) {
    return this.sol_signAndSendTransaction({
      id,
      params: { txBase64, clientScope, method: 'signTransaction' },
      context,
    });
  }

  async sol_signAndSendTransaction({
    id,
    params: { txBase64, clientScope, method = 'signAndSendTransaction' },
    context,
  }: PublicMethodParams<{
    txBase64: string;
    clientScope?: string;
    method?: 'signAndSendTransaction' | 'signTransaction';
  }>): Promise<SolSignTransactionResult> {
    const { origin, tabId } = await this.requireConnectedAccount(context, 'solana');
    const searchParams = new URLSearchParams({
      origin,
      transaction: txBase64,
      ecosystem: 'solana',
      method,
    });
    if (clientScope) {
      searchParams.append('clientScope', clientScope);
    }
    return this.openSigningDialog<SolSignTransactionResult>({
      origin,
      tabId,
      id,
      ecosystem: 'solana',
      route: '/sendTransaction',
      search: `?${searchParams}`,
    });
  }

  async sol_signAllTransactions({
    id,
    params: { transactionsBase64, clientScope },
    context,
  }: PublicMethodParams<{
    transactionsBase64: string[];
    clientScope?: string;
  }>): Promise<SolSignTransactionResult[]> {
    const { origin, tabId } = await this.requireConnectedAccount(context, 'solana');
    const searchParams = new URLSearchParams({
      origin,
      transactions: JSON.stringify(transactionsBase64),
      ecosystem: 'solana',
      method: 'signAllTransactions',
    });
    if (clientScope) {
      searchParams.append('clientScope', clientScope);
    }
    return this.openSigningDialog<SolSignTransactionResult[]>({
      origin,
      tabId,
      id,
      ecosystem: 'solana',
      route: '/sendTransaction',
      search: `?${searchParams}`,
    });
  }

  async sol_signMessage({
    id,
    params: { messageSerialized, clientScope },
    context,
  }: PublicMethodParams<{
    messageSerialized: string;
    clientScope?: string;
  }>) {
    const { currentAddress, origin, tabId } = await this.requireConnectedAccount(context, 'solana');
    invariant(isSolanaAddress(currentAddress));
    const messageUint8 = base64ToUint8Array(messageSerialized);
    const searchParams = new URLSearchParams({
      method: 'signMessage',
      origin,
      message: ethers.hexlify(messageUint8),
    });
    if (clientScope) {
      searchParams.append('clientScope', clientScope);
    }
    return this.openSigningDialog({
      origin,
      tabId,
      id,
      ecosystem: 'solana',
      route: '/signMessage',
      search: `?${searchParams}`,
    });
  }

  async eth_requestAccounts(
    { context, id, params }: PublicMethodParams<[] | [{ nonEip6963Request?: boolean }] | null>,
    opts: { ecosystem: BlockchainType } = { ecosystem: 'evm' },
  ): Promise<string[]> {
    const currentAddress = this.wallet.readCurrentAddress();
    if (
      currentAddress &&
      isMatchForEcosystem(currentAddress, opts.ecosystem) &&
      this.wallet.allowedOrigin(context, currentAddress)
    ) {
      const { origin } = context;
      emitter.emit('requestAccountsResolved', {
        origin,
        address: currentAddress,
        explicitly: false,
      });
      // Some ethereum dapps expect lowercase to be returned, otherwise they crash the moment after connection
      const result = [
        isEthereumAddress(currentAddress) ? currentAddress.toLowerCase() : currentAddress,
      ];
      return result;
    }
    if (!context?.origin) {
      throw new Error('This method requires origin');
    }
    const { origin } = context;
    return new Promise((resolve, reject) => {
      this.safeOpenDialogWindow(origin, {
        route: '/requestAccounts',
        search: `?origin=${origin}&nonEip6963Request=${String(
          params?.[0]?.nonEip6963Request ? 'yes' : 'no',
        )}&ecosystem=${opts.ecosystem}`,
        requestId: `${origin}:${id}`,
        tabId: context.tabId || null,
        onResolve: async ({
          address,
          origin: resolvedOrigin,
        }: {
          address: string;
          origin: string;
        }) => {
          invariant(address, 'Invalid arguments: missing address');
          invariant(resolvedOrigin, 'Invalid arguments: missing origin');
          invariant(resolvedOrigin === origin, 'Resolved origin mismatch');
          invariant(isMatchForEcosystem(address, opts.ecosystem), 'Wrong addr for ecosystem');
          const currentAddress = this.wallet.ensureCurrentAddress();
          if (normalizeAddress(address) !== normalizeAddress(currentAddress)) {
            await this.wallet.setCurrentAddress({
              params: { address },
              context: INTERNAL_SYMBOL_CONTEXT,
            });
          }
          this.wallet.acceptOrigin({
            params: { origin, address },
            context: INTERNAL_SYMBOL_CONTEXT,
          });
          const accounts = await this.eth_accounts({ context, id });
          emitter.emit('requestAccountsResolved', {
            origin,
            address,
            explicitly: true,
          });
          resolve(accounts.map((item) => normalizeAddress(item)));
        },
        onDismiss: () => {
          reject(new UserRejected('User Rejected the Request'));
        },
      });
    });
  }

  async eth_chainId({ context }: PublicMethodParams): Promise<string> {
    /**
     * This is an interesting case. We do not check if context.origin is allowed
     * for current address and simply return saved chainId for this origin.
     * This seems to be okay because if the origin has no permissions at all, we will
     * default to ethereum anyway, but if the origin has permissions for an address which
     * is not current, it doesn't look like a problem to keep returning saved chainId
     * for this origin. In case the saved chainId is other than ethereum,
     * the dAPP will be able to make a conclusion that some _other_ address has some permissions,
     * but so what?
     */
    if (!context || !context.origin) {
      throw new Error('Unknown sender origin');
    }
    return this.wallet.getChainIdForOrigin({ origin: context.origin });
  }

  async net_version({ context, id }: PublicMethodParams) {
    const chainId = await this.eth_chainId({ context, id });
    return String(parseInt(chainId));
  }

  async eth_sendTransaction({
    params,
    context,
    id,
  }: PublicMethodParams<
    [IncomingTransaction, /* TODO: refactor to use {context} instead? */ { clientScope?: string }?]
  >) {
    // TODO: should we check transaction.from instead of currentAddress?
    const { origin, tabId } = await this.requireConnectedAccount(context, 'evm');
    const [transaction, { clientScope } = { clientScope: undefined }] = params;
    invariant(transaction, () => new InvalidParams());
    const searchParams = new URLSearchParams({
      origin,
      transaction: JSON.stringify(transaction),
    });
    if (clientScope) {
      searchParams.append('clientScope', clientScope);
    }

    await this.wallet.ensureTestnetModeForTx({
      transaction,
      initiator: origin,
      tabId,
    });

    return this.openSigningDialog({
      origin,
      tabId,
      id,
      ecosystem: 'evm',
      route: '/sendTransaction',
      search: `?${searchParams}`,
    });
  }

  async eth_signTypedData_v4({
    context,
    params: [address, data],
    id,
  }: PublicMethodParams<[string, TypedData | string]>) {
    const { currentAddress, origin, tabId } = await this.requireConnectedAccount(context, 'evm');
    if (normalizeAddress(address) !== normalizeAddress(currentAddress)) {
      throw new Error(
        // TODO?...
        `Address parameter is different from currently selected address. Expected: ${currentAddress}, received: ${address}`,
      );
    }
    const stringifiedData = sanitizeTypedDataRaw(data);
    return this.openSigningDialog({
      origin,
      tabId,
      id,
      ecosystem: 'evm',
      route: '/signTypedData',
      search: `?${new URLSearchParams({
        origin,
        typedDataRaw: stringifiedData,
        method: 'eth_signTypedData_v4',
      })}`,
    });
  }

  async eth_signTypedData({ context: _context }: PublicMethodParams) {
    throw new MethodNotImplemented('eth_signTypedData: Not Implemented');
  }

  async eth_sign({ context: _context }: PublicMethodParams) {
    throw new MethodNotImplemented('eth_sign: Not Implemented');
  }

  async personal_sign({
    id,
    params,
    context,
  }: PublicMethodParams<
    [
      string,
      string,
      string,
      /* TODO: refactor to use {context} instead? */ { clientScope?: string }?,
    ]
  >) {
    if (!params.length) {
      throw new InvalidParams();
    }
    const [
      shouldBeMessage,
      shouldBeAddress,
      _password,
      { clientScope } = { clientScope: undefined },
    ] = params;
    const currentAddress = await this.ensureEcosystemAccount(context, 'evm');

    let address = '';
    let message = '';
    if (isEthereumAddress(shouldBeAddress)) {
      address = shouldBeAddress;
      message = shouldBeMessage;
    } else if (isEthereumAddress(shouldBeMessage)) {
      // specification obliges us to send [message, address] params in this particular order
      // https://web3js.readthedocs.io/en/v1.2.11/web3-eth-personal.html#id15
      // but some dapps send personal_sign params in wrong order
      address = shouldBeMessage;
      message = shouldBeAddress;
    } else {
      throw new Error(
        `Address is required for "personal_sign" method. Received [${params[0]}, ${params[1]}]`,
      );
    }

    if (address && normalizeAddress(address) !== normalizeAddress(currentAddress)) {
      throw new Error(
        // TODO?...
        `Address parameter is different from currently selected address. Received: ${address}`,
      );
    }

    const { origin, tabId } = this.assertConnectedAccount(context, currentAddress);
    const searchParams = new URLSearchParams({
      method: 'personal_sign',
      origin,
      message,
    });
    if (clientScope) {
      searchParams.append('clientScope', clientScope);
    }
    return this.openSigningDialog({
      origin,
      tabId,
      id,
      ecosystem: 'evm',
      route: '/signMessage',
      search: `?${searchParams}`,
    });
  }

  async wallet_switchEthereumChain({
    params,
    context,
    id,
  }: PublicMethodParams<[{ chainId?: string | number }]>): Promise<null | object> {
    const currentAddress = this.wallet.readCurrentAddress();
    if (!context || !context.origin) {
      throw new OriginNotAllowed();
    }
    invariant(params[0], () => new InvalidParams());
    const { origin } = context;
    const { chainId: chainIdParameter } = params[0];
    invariant(
      chainIdParameter,
      'ChainId is a required param for wallet_switchEthereumChain method',
    );
    const chainId = normalizeChainId(chainIdParameter);

    const tabId = context.tabId || null;
    await this.wallet.ensureTestnetModeForChainId(chainId, tabId);

    const preferences = await this.wallet.getPreferences({
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    const networksStore = getNetworksStore(preferences);
    const networks = await networksStore.loadNetworksByChainId(chainId);
    if (!currentAddress || !this.wallet.allowedOrigin(context, currentAddress)) {
      const chain = networks.getChainById(chainId);
      return new Promise((resolve, reject) => {
        this.safeOpenDialogWindow(origin, {
          requestId: `${context.origin}:${id}`,
          route: '/switchEthereumChain',
          search: `?origin=${origin}&chainId=${chainId}`,
          tabId: context.tabId || null,
          onResolve: () => {
            this.wallet.setChainForOrigin({ evmChain: chain, origin });
            this.wallet.addVisitedEthereumChainInternal(chain);
            setTimeout(() => resolve(null));
          },
          onDismiss: () => {
            reject(new UserRejected('User Rejected the Request'));
          },
        });
      });
    }

    const currentChainIdForThisOrigin = await this.wallet.getChainIdForOrigin({
      origin,
    });
    if (chainId === currentChainIdForThisOrigin) {
      return null;
    }
    try {
      const chain = networks.getChainById(chainId);
      // Switch immediately and return success
      this.wallet.setChainForOrigin({ evmChain: chain, origin });
      this.wallet.addVisitedEthereumChainInternal(chain);
      // return null in next tick to give provider enough time to change chainId property
      return new Promise((resolve) => {
        setTimeout(() => resolve(null));
      });
    } catch (error) {
      emitter.emit('switchChainError', chainId, origin, error);
      throw new SwitchChainError(`Chain not configured: ${chainIdParameter}`);
    }
  }

  async wallet_getWalletNameFlags({
    context: _context,
    params: { origin },
  }: PublicMethodParams<{ origin: string }>) {
    const preferences = await this.wallet.getGlobalPreferences({
      /**
       * NOTE: we're not checking `context` param here and use
       * INTERNAL_SYMBOL_CONTEXT, because preferences.walletNameFlags are
       * supposed to work even before the user has given permissions
       * to the DApp. `walletNameFlags` are about global ethereum object behavior
       * and do not contain any private data
       */
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    return getWalletNameFlagsByOrigin(preferences, origin);
  }

  async wallet_registerEip6963Support({ context }: PublicMethodParams) {
    invariant(context?.origin, 'This method requires origin');
    emitter.emit('eip6963SupportDetected', { origin: context.origin });
  }

  async wallet_getGlobalPreferences({ context: _context }: PublicMethodParams) {
    return this.wallet.getGlobalPreferences({
      /** wallet.getGlobalPreferences does not return any private data */
      context: INTERNAL_SYMBOL_CONTEXT,
    });
  }

  private generatePermissionResponse(
    params: [{ [name: string]: unknown }],
  ): Web3WalletPermission[] {
    if (params?.[0] && 'eth_accounts' in params[0]) {
      return [{ parentCapability: 'eth_accounts' }];
    } else {
      throw new InvalidParams();
    }
  }

  private getIsAllowedOrigin({ context }: Pick<PublicMethodParams, 'context'>) {
    const currentAddress = this.wallet.readCurrentAddress();
    if (!currentAddress) {
      return false;
    }
    return this.wallet.allowedOrigin(context, currentAddress);
  }

  async wallet_requestPermissions({
    id,
    context,
    params,
  }: PublicMethodParams<[{ [name: string]: unknown }]>): Promise<Web3WalletPermission[]> {
    await this.eth_requestAccounts({ context, id, params: [] });
    return this.generatePermissionResponse(params);
  }

  async wallet_getPermissions({ context }: PublicMethodParams): Promise<Web3WalletPermission[]> {
    if (this.getIsAllowedOrigin({ context })) {
      return [{ parentCapability: 'eth_accounts' }];
    } else {
      return [];
    }
  }

  async wallet_addEthereumChain({
    id,
    context,
    params,
  }: PublicMethodParams<[AddEthereumChainParameter]>) {
    invariant(context?.origin, 'This method requires origin');
    invariant(params[0], () => new InvalidParams());
    const { origin } = context;
    const { chainId: chainIdParameter } = params[0];
    const chainId = normalizeChainId(chainIdParameter);
    const tabId = context.tabId || null;
    await this.wallet.ensureTestnetModeForChainId(chainId, tabId);
    const normalizedParams = { ...params[0], chainId };
    const preferences = await this.wallet.getPreferences({
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    const networksStore = getNetworksStore(preferences);
    const networks = await networksStore.loadNetworksByChainId(chainId);
    return new Promise((resolve, reject) => {
      if (networks.hasMatchingConfig(normalizedParams)) {
        resolve(null); // null indicates success as per spec
      } else {
        this.safeOpenDialogWindow(origin, {
          requestId: `${origin}:${id}`,
          route: '/addEthereumChain',
          search: `?${new URLSearchParams({
            origin,
            addEthereumChainParameter: JSON.stringify(normalizedParams),
          })}`,
          tabId: context.tabId || null,
          onResolve: () => {
            resolve(null); // null indicates success as per spec
          },
          onDismiss: () => {
            reject(new UserRejected());
          },
        });
      }
    }).then(() => {
      // Automatically switch dapp to this network because this is what most dapps seem to expect
      return this.wallet_switchEthereumChain({
        id,
        context,
        params: [{ chainId: normalizedParams.chainId }],
      });
    });
  }

  async wallet_isKnownDapp({ context }: PublicMethodParams<{ origin: string }>) {
    invariant(context?.origin, 'This method requires origin');
    return isKnownDapp({ origin: context.origin });
  }
}
