import omit from 'lodash/omit';
import { LoginActivity, type Account } from 'src/background/account/Account';
import { emitter } from 'src/background/events';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { getWalletNameFlagsChange } from 'src/background/Wallet/GlobalPreferences';
import { dnaServiceEmitter } from 'src/modules/dna-service/dna.background';
import { estimateSessionExpiry } from 'src/background/user-activity';
import {
  ensureSolanaResult,
  getTxSender,
} from 'src/modules/shared/transactions/helpers';
import { statsigTrack } from 'src/modules/statsig/shared';
import { WalletOrigin } from '../WalletOrigin';
import {
  isMnemonicContainer,
  isPrivateKeyContainer,
} from '../types/validators';
import { getError } from '../errors/getError';
import { runtimeStore } from '../core/runtime-store';
import { productionVersion } from '../packageVersion';
import { onIdle } from '../onIdle';
import { createParams as createBaseParams, sendToMetabase } from './analytics';
import {
  createAddProviderHook,
  initialize as initializeApiV4Analytics,
} from './api-v4-zerion';
import {
  getProviderForApiV4,
  getProviderForMetabase,
  getProviderNameFromGroup,
} from './shared/getProviderNameFromGroup';
import { addressActionToAnalytics } from './shared/addressActionToAnalytics';
import { mixpanelTrack, mixpanelIdentify } from './mixpanel';
import {
  getChainBreakdown,
  getOwnedWalletsPortolio,
} from './shared/mixpanel-data-helpers';
import { omitNullParams } from './shared/omitNullParams';
import { gaCollect, prepareGaParams } from './google-analytics';
import { waitForAnalyticsIdSet } from './analyticsId';

function queryWalletProvider(account: Account, address: string) {
  const apiLayer = account.getCurrentWallet();
  const group = apiLayer.getWalletGroupByAddressSync({
    params: { address },
    context: INTERNAL_SYMBOL_CONTEXT,
  });
  return getProviderNameFromGroup(group);
}

function trackAppEvents({ account }: { account: Account }) {
  const eip6963Dapps = new Set<string>();

  const getProvider = (address: string) =>
    getProviderForMetabase(queryWalletProvider(account, address));
  const getCurrentAddress = () =>
    account.getCurrentWallet().readCurrentAddress();

  const createParams: typeof createBaseParams = (eventParams) => {
    const params: typeof eventParams & {
      wallet_address?: string | null;
      wallet_provider?: string | null;
    } = eventParams;

    if (!params.wallet_address) {
      params.wallet_address = getCurrentAddress();
    }

    if (params.wallet_address) {
      params.wallet_address = params.wallet_address.toLowerCase();
      if (!params.wallet_provider) {
        params.wallet_provider = getProvider(params.wallet_address);
      }
    }
    return createBaseParams(params);
  };

  emitter.on('requestAccountsResolved', ({ origin, address, explicitly }) => {
    if (!explicitly) {
      return;
    }
    const params = createParams({
      request_name: 'dapp_connection',
      dapp_domain: origin,
      wallet_address: address,
      eip6963_supported: eip6963Dapps.has(origin),
    });
    sendToMetabase('dapp_connection', params);
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack('DApp: DApp Connection', mixpanelParams);
  });

  emitter.on('screenView', async (data) => {
    await waitForAnalyticsIdSet();
    const params = createParams({
      request_name: 'screen_view',
      wallet_address: data.address,
      screen_name: data.pathname,
      previous_screen_name: data.previous,
      screen_size: data.screenSize,
      window_type: data.windowType,
    });
    sendToMetabase('screen_view', params);
    const portfolio = await getOwnedWalletsPortolio(account);
    const mixpanelParams: Record<string, unknown> = {
      ...omit(params, ['request_name', 'wallet_address']),
      total_balance: portfolio?.total_value ?? 0,
      ...getChainBreakdown(portfolio),
    };
    mixpanelTrack('General: Screen Viewed', mixpanelParams);
    statsigTrack('General: Screen Viewed', mixpanelParams);
  });

  emitter.on('screenView', async (params) => {
    await waitForAnalyticsIdSet();
    const gaParams = await prepareGaParams({
      page_title: params.title,
      page_location: params.pathname,
    });
    gaCollect('page_view', gaParams);
  });

  emitter.on('buttonClicked', (data) => {
    const { buttonName, buttonScope, pathname, walletAddress } = data;
    const params = createParams({
      request_name: 'button_clicked',
      screen_name: pathname,
      button_name: buttonName,
      wallet_address: walletAddress,
    });
    const event_name = `${buttonScope}: Button Pressed`;
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack(event_name, mixpanelParams);
  });

  emitter.on('daylightAction', ({ event_name, ...data }) => {
    const params = createParams({
      request_name: 'daylight_action',
      wallet_address: data.address,
      event_name,
      ...data,
    });
    sendToMetabase('daylight_action', params);
  });

  emitter.on('globalError', ({ name, message }) => {
    const params = createParams({
      request_name: 'client_error',
      type: name,
      message,
    });
    sendToMetabase('client_error', params);
  });

  emitter.on(
    'transactionSent',
    async (
      result,
      {
        initiator,
        feeValueCommon,
        addressAction,
        quote,
        clientScope,
        chain,
        outputChain,
      }
    ) => {
      const initiatorURL = new URL(initiator);
      const { origin, pathname } = initiatorURL;
      const isInternalOrigin = globalThis.location.origin === origin;
      const initiatorName = isInternalOrigin ? 'Extension' : 'External Dapp';
      const addressActionAnalytics = addressActionToAnalytics({
        addressAction,
        quote,
        outputChain: outputChain ?? null,
      });
      const preferences = await account
        .getCurrentWallet()
        .getPreferences({ context: INTERNAL_SYMBOL_CONTEXT });

      const params = createParams({
        request_name: 'signed_transaction',
        screen_name: origin === initiator ? 'Transaction Request' : pathname,
        wallet_address: getTxSender(result), // transaction.from,
        /* @deprecated */
        context: initiatorName,
        /* @deprecated */
        type: 'Sign',
        client_scope: clientScope ?? initiatorName,
        dapp_domain: isInternalOrigin ? null : origin,
        chain,
        gas: result.evm ? result.evm.gasLimit.toString() : null,
        /** Current requirement by analytics: send solana signatures as `hash` */
        hash: result.evm?.hash ?? ensureSolanaResult(result).signature,
        gas_price: null, // TODO
        network_fee: null, // TODO
        network_fee_value: feeValueCommon,
        contract_type: quote ? quote.contractMetadata.name ?? null : null,
        hold_sign_button: Boolean(preferences.enableHoldToSignButton),
        ...omitNullParams(addressActionAnalytics),
      });
      sendToMetabase('signed_transaction', params);
      const gaParams = await prepareGaParams(params);
      gaCollect('signed_transaction', gaParams);
      const mixpanelParams = omit(params, [
        'request_name',
        'hash',
        'wallet_address',
      ]);
      mixpanelTrack('Transaction: Signed Transaction', mixpanelParams);
      statsigTrack('Transaction: Signed Transaction', mixpanelParams);
    }
  );

  async function handleSign({
    type,
    initiator,
    address,
    clientScope,
  }: {
    type: 'typedDataSigned' | 'messageSigned';
    initiator: string;
    address: string;
    clientScope: string | null;
  }) {
    if (!clientScope && initiator === INTERNAL_ORIGIN) {
      // Do not send analytics event for internal actions,
      // e.g. a signature made before an invitation fetch request
      return;
    }
    const initiatorURL = new URL(initiator);
    const { origin } = initiatorURL;
    const isInternalOrigin = globalThis.location.origin === origin;
    const initiatorName = isInternalOrigin ? 'Extension' : 'External Dapp';

    /* @deprecated */
    const eventToMethod = {
      // values are ethers method names
      typedDataSigned: '_signTypedData',
      messageSigned: 'signMessage',
    } as const;

    const eventToActionType = {
      typedDataSigned: 'eth_signTypedData',
      messageSigned: 'personal_sign',
    } as const;

    const preferences = await account
      .getCurrentWallet()
      .getPreferences({ context: INTERNAL_SYMBOL_CONTEXT });

    const params = createParams({
      request_name: 'signed_message',
      /* @deprecated */
      type: eventToMethod[type] ?? 'unexpected type',
      /* @deprecated */
      context: initiatorName,
      client_scope: clientScope ?? initiatorName,
      action_type: eventToActionType[type] ?? 'unexpected type',
      wallet_address: address,
      address,
      dapp_domain: isInternalOrigin ? null : origin,
      hold_sign_button: Boolean(preferences.enableHoldToSignButton),
    });
    sendToMetabase('signed_message', params);
    const gaParams = await prepareGaParams(params);
    gaCollect('signed_message', gaParams);
    const mixpanelParams = omit(params, [
      'request_name',
      'wallet_address',
      'address',
    ]);
    mixpanelTrack('Transaction: Signed Message', mixpanelParams);
  }

  emitter.on('typedDataSigned', ({ typedData, ...rest }) => {
    handleSign({ type: 'typedDataSigned', ...rest });
  });
  emitter.on('messageSigned', ({ message, ...rest }) => {
    handleSign({ type: 'messageSigned', ...rest });
  });

  // TODO: add networks-related analytics
  emitter.on('addEthereumChain', ({ values: [chainConfig], origin }) => {
    const wallet_address = getCurrentAddress();
    const params = createParams({
      request_name: 'custom_evm_network_created',
      source: origin,
      network_external_id: chainConfig.chainId,
      network_rpc_url_internal: chainConfig.rpcUrls[0],
      network_name: chainConfig.chainName,
      network_native_asset_symbol: chainConfig.nativeCurrency.symbol,
      network_explorer_home_url: chainConfig.blockExplorerUrls?.[0],
      wallet_address,
    });
    sendToMetabase('custom_evm_network_created', params);
  });

  emitter.on('globalPreferencesChange', (state, prevState) => {
    onIdle(() => {
      const { enabled: newlyEnabled, disabled: newlyDisabled } =
        getWalletNameFlagsChange(state, prevState);

      newlyEnabled.forEach((key) => {
        const params = createParams({
          request_name: 'metamask_mode',
          enabled: true,
          dapp_domain: key,
        });
        sendToMetabase('metamask_mode', params);
      });
      newlyDisabled.forEach((key) => {
        const params = createParams({
          request_name: 'metamask_mode',
          enabled: false,
          dapp_domain: key,
        });
        sendToMetabase('metamask_mode', params);
      });
    });
  });

  emitter.on('holdToSignPreferenceChange', (active) => {
    const params = createParams({
      request_name: 'hold_to_sign_prerefence',
      active,
    });
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack('Experiments: Hold Sign Button', mixpanelParams);
  });

  emitter.on('walletCreated', ({ walletContainer, origin }) => {
    for (const wallet of walletContainer.wallets) {
      const type =
        origin === WalletOrigin.extension
          ? 'created'
          : isPrivateKeyContainer(walletContainer)
          ? 'imported_private_key'
          : isMnemonicContainer(walletContainer)
          ? 'imported_seed_phrase'
          : 'connected';
      const wallet_provider = getProvider(wallet.address);

      const params = createParams({
        request_name: 'add_wallet',
        wallet_address: wallet.address.toLowerCase(),
        type,
      });
      sendToMetabase('add_wallet', params);
      mixpanelTrack('Wallet: Wallet Added', { wallet_provider, type });
    }
  });

  emitter.on('firstScreenView', async () => {
    await waitForAnalyticsIdSet();
    statsigTrack('General: Launch first time');
    mixpanelTrack('General: Launch first time', {});
    const gaParams = await prepareGaParams({});
    gaCollect('first_open', gaParams);
  });

  emitter.on('eip6963SupportDetected', ({ origin }) => {
    eip6963Dapps.add(origin);
  });

  emitter.on('backgroundScriptInitialized', async () => {
    // We want to check whether background script got restarted in a way
    // that has led to an unexpected logout.
    // The browser restart is considered an expected logout.
    const { startupEvent, installedEvent } = runtimeStore.getState();

    const isIntentionalBrowserRestart = Boolean(startupEvent);

    const likelyReason = installedEvent
      ? installedEvent.reason
      : isIntentionalBrowserRestart
      ? 'browser restart'
      : 're-enabled by user';

    if (isIntentionalBrowserRestart) {
      return;
    }
    const hasExistingUser = await account.hasExistingUser();
    const didNotOnboardYet = !hasExistingUser;
    const isAuthenticated = account.isAuthenticated();
    const { loggedInAt } = await LoginActivity.getState();
    const didLogoutIntentionally = loggedInAt == null;

    if (didNotOnboardYet || isAuthenticated || didLogoutIntentionally) {
      return;
    }

    const sessionExpiry = await estimateSessionExpiry();

    /** We want to use this only if it differs from current version */
    const prevVersion = installedEvent?.previousVersion;
    const fromVersion =
      prevVersion && prevVersion !== productionVersion ? prevVersion : null;

    const params = createParams({
      request_name: 'background_script_reloaded',
      time_to_expiry: sessionExpiry.timeToExpiry,
      is_update_from_version: fromVersion,
      likely_reason: likelyReason,
    });
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    const event = 'General: Background Script Reloaded';
    mixpanelTrack(event, mixpanelParams);
  });

  dnaServiceEmitter.on('registerError', async (error, action) => {
    const request_name = 'client_error';
    const message = getError(error).message;
    const type = 'dna action';
    const params = createParams({ request_name, type, message, action });
    sendToMetabase(request_name, params);
  });

  emitter.on('cloudflareChallengeIssued', () => {
    const params = createParams({
      request_name: 'cloudflare_challenge_issued',
    });
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack('General: Cloudflare Challenge Issued', mixpanelParams);
  });
}

export function initialize({ account }: { account: Account }) {
  async function getWalletProvider(address: string) {
    return getProviderForApiV4(queryWalletProvider(account, address));
  }
  initializeApiV4Analytics({
    willSendRequest: createAddProviderHook({ getWalletProvider }),
  });
  const handleUserId = () => mixpanelIdentify(account);
  account.on('authenticated', () => handleUserId());
  if (account.getUser()) {
    handleUserId();
  }
  return trackAppEvents({ account });
}
