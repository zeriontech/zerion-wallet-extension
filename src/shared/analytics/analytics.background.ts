import omit from 'lodash/omit';
import type { Account } from 'src/background/account/Account';
import { emitter } from 'src/background/events';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { getWalletNameFlagsChange } from 'src/background/Wallet/GlobalPreferences';
import { WalletOrigin } from '../WalletOrigin';
import {
  isMnemonicContainer,
  isPrivateKeyContainer,
} from '../types/validators';
import {
  createParams as createBaseParams,
  sendToMetabase,
  onIdle,
} from './analytics';
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
import { mixpanelTrack, mixpanelIdentify, mixpanelReset } from './mixpanel';

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

  const createParams: typeof createBaseParams = (params) => {
    const getUserId = () => account.getUser()?.id;
    return createBaseParams({ ...params, userId: getUserId() });
  };
  emitter.on('requestAccountsResolved', ({ origin, address, explicitly }) => {
    if (!explicitly) {
      return;
    }
    // We don't need user_id here
    const params = createBaseParams({
      request_name: 'dapp_connection',
      dapp_domain: origin,
      wallet_address: address,
      wallet_provider: getProvider(address),
      eip6963_supported: eip6963Dapps.has(origin),
    });
    sendToMetabase('dapp_connection', params);
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack(account, 'DApp: DApp Connection', mixpanelParams);
  });

  emitter.on('screenView', (data) => {
    // We don't need user_id here
    const params = createBaseParams({
      request_name: 'screen_view',
      wallet_address: data.address,
      wallet_provider: data.address ? getProvider(data.address) : null,
      screen_name: data.pathname,
      previous_screen_name: data.previous,
      screen_size: data.screenSize,
    });
    sendToMetabase('screen_view', params);
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack(account, 'General: Screen Viewed', mixpanelParams);
  });

  emitter.on('daylightAction', ({ event_name, ...data }) => {
    // We don't need user_id here (analytics requirement)
    const params = createBaseParams({
      request_name: 'daylight_action',
      wallet_address: data.address,
      event_name,
      ...data,
    });
    sendToMetabase('daylight_action', params);
  });

  emitter.on(
    'transactionSent',
    async ({
      transaction,
      initiator,
      feeValueCommon,
      addressAction,
      quote,
      clientScope,
      chain,
    }) => {
      const initiatorURL = new URL(initiator);
      const { origin, pathname } = initiatorURL;
      const isInternalOrigin = globalThis.location.origin === origin;
      const initiatorName = isInternalOrigin ? 'Extension' : 'External Dapp';
      const addressActionAnalytics = addressActionToAnalytics({
        addressAction,
        quote,
      });
      const params = createBaseParams({
        request_name: 'signed_transaction',
        screen_name: origin === initiator ? 'Transaction Request' : pathname,
        wallet_address: transaction.from,
        wallet_provider: getProvider(transaction.from),
        /* @deprecated */
        context: initiatorName,
        /* @deprecated */
        type: 'Sign',
        client_scope: clientScope ?? initiatorName,
        action_type: addressActionAnalytics?.action_type ?? 'Execute',
        dapp_domain: isInternalOrigin ? null : origin,
        chain,
        gas: transaction.gasLimit.toString(),
        hash: transaction.hash,
        asset_amount_sent: [], // TODO
        gas_price: null, // TODO
        network_fee: null, // TODO
        network_fee_value: feeValueCommon,
        contract_type: quote?.contract_metadata?.name ?? null,
        ...addressActionAnalytics,
      });
      sendToMetabase('signed_transaction', params);
      const mixpanelParams = omit(params, [
        'request_name',
        'hash',
        'wallet_address',
      ]);
      mixpanelTrack(account, 'Transaction: Signed Transaction', mixpanelParams);
    }
  );

  function handleSign({
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

    const params = createBaseParams({
      request_name: 'signed_message',
      /* @deprecated */
      type: eventToMethod[type] ?? 'unexpected type',
      /* @deprecated */
      context: initiatorName,
      client_scope: clientScope ?? initiatorName,
      action_type: eventToActionType[type] ?? 'unexpected type',
      wallet_address: address,
      address,
      wallet_provider: getProvider(address),
      dapp_domain: isInternalOrigin ? null : origin,
    });
    sendToMetabase('signed_message', params);
    const mixpanelParams = omit(params, [
      'request_name',
      'wallet_address',
      'address',
    ]);
    mixpanelTrack(account, 'Transaction: Signed Message', mixpanelParams);
  }

  emitter.on('typedDataSigned', ({ typedData, ...rest }) => {
    handleSign({ type: 'typedDataSigned', ...rest });
  });
  emitter.on('messageSigned', ({ message, ...rest }) => {
    handleSign({ type: 'messageSigned', ...rest });
  });

  // TODO: add networks-related analytics
  emitter.on('addEthereumChain', ({ values: [chainConfig], origin }) => {
    const params = createParams({
      request_name: 'add_custom_evm',
      source: origin,
      network_external_id: chainConfig.chainId,
      network_rpc_url_internal: chainConfig.rpcUrls[0],
      network_name: chainConfig.chainName,
      network_native_asset_symbol: chainConfig.nativeCurrency.symbol,
      network_explorer_home_url: chainConfig.blockExplorerUrls?.[0],
    });
    sendToMetabase('add_custom_evm', params);
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

      const params = createBaseParams({
        request_name: 'add_wallet',
        wallet_address: wallet.address.toLowerCase(),
        wallet_provider,
        type,
      });
      sendToMetabase('add_wallet', params);
      mixpanelTrack(account, 'Wallet: Wallet Added', { wallet_provider, type });
    }
  });

  emitter.on('firstScreenView', () => {
    mixpanelTrack(account, 'General: Launch first time', {});
  });

  emitter.on('eip6963SupportDetected', ({ origin }) => {
    eip6963Dapps.add(origin);
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
  account.on('reset', () => {
    mixpanelReset();
  });
  return trackAppEvents({ account });
}
