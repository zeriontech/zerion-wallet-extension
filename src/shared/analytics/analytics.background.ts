import omit from 'lodash/omit';
import { LoginActivity, type Account } from 'src/background/account/Account';
import { emitter } from 'src/background/events';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import {
  getWalletNameFlagsChange,
  globalPreferences,
} from 'src/background/Wallet/GlobalPreferences';
import { dnaServiceEmitter } from 'src/modules/dna-service/dna.background';
import { estimateSessionExpiry } from 'src/background/user-activity';
import {
  ensureSolanaResult,
  getTxSender,
} from 'src/modules/shared/transactions/helpers';
import { statsigTrack } from 'src/modules/statsig/shared';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { backgroundQueryClient } from 'src/modules/query-client/query-client.background';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import type { Params as FungibleFullInfoParams } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import {
  toAddressPositions,
  type Params as WalletGetPositionsParams,
} from 'src/modules/zerion-api/requests/wallet-get-positions';
import { getPositionBalance } from 'src/ui/components/Positions/helpers';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import { WalletOrigin } from '../WalletOrigin';
import {
  isMnemonicContainer,
  isPrivateKeyContainer,
} from '../types/validators';
import { getError } from '../errors/getError';
import { runtimeStore } from '../core/runtime-store';
import { productionVersion } from '../packageVersion';
import { onIdle } from '../onIdle';
import type { TransactionContextParams } from '../types/SignatureContextParams';
import type { SignTransactionResult } from '../types/SignTransactionResult';
import { invariant } from '../invariant';
import { normalizeAddress } from '../normalizeAddress';
import { getAddressType } from '../wallet/classifiers';
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
import {
  addressActionToAnalytics,
  toMaybeArr,
} from './shared/addressActionToAnalytics';
import { mixpanelTrack, mixpanelIdentify } from './mixpanel';
import { getUserProperties } from './shared/getUserProperties';
import { omitNullParams } from './shared/omitNullParams';
import { gaCollect, prepareGaParams } from './google-analytics';
import { waitForAnalyticsIdSet } from './analyticsId';

const toEcosystemProperty = (value: 'evm' | 'solana') =>
  value === 'evm' ? 'EVM' : value === 'solana' ? 'Solana' : value;

function queryWalletProvider(account: Account, address: string) {
  const apiLayer = account.getCurrentWallet();
  const group = apiLayer.getWalletGroupByAddressSync({
    params: { address },
    context: INTERNAL_SYMBOL_CONTEXT,
  });
  return getProviderNameFromGroup(group);
}

function queryFungibleInfo(payload: FungibleFullInfoParams) {
  const { currency, fungibleId } = payload;

  return backgroundQueryClient.fetchQuery({
    queryKey: ['assetGetFungibleFullInfo', fungibleId, currency],
    queryFn: async () =>
      ZerionAPI.assetGetFungibleFullInfo({ fungibleId, currency }),
    staleTime: 20000,
  });
}

async function queryWalletPositions(
  payload: WalletGetPositionsParams,
  source: NetworksSource
) {
  return backgroundQueryClient.fetchQuery({
    queryKey: ['ZerionAPI.getWalletsMeta', payload, source],
    queryFn: async () => {
      const response = await ZerionAPI.walletGetPositions(payload, { source });
      return toAddressPositions(response);
    },
    staleTime: 10000,
  });
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
      params.wallet_address = normalizeAddress(params.wallet_address);
      if (!params.wallet_provider) {
        params.wallet_provider = getProvider(params.wallet_address);
      }
    }
    return createBaseParams(params);
  };

  emitter.on(
    'requestAccountsResolved',
    async ({ origin, address, explicitly }) => {
      const preferences = await globalPreferences.getPreferences();
      if (!preferences.analyticsEnabled) {
        return;
      }
      if (!explicitly) {
        return;
      }
      const params = createParams({
        request_name: 'dapp_connection',
        dapp_domain: origin,
        wallet_address: address,
        ecosystem: toEcosystemProperty(getAddressType(address)),
        eip6963_supported: eip6963Dapps.has(origin),
      });
      sendToMetabase('dapp_connection', params);
      const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
      mixpanelTrack('DApp: DApp Connection', mixpanelParams);
    }
  );

  emitter.on('unlockedAppOpened', async () => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    await waitForAnalyticsIdSet();
    const params = createParams({ request_name: 'unlocked_app_opened' });
    /**
     * Global user properties tend to be replaced with updated values from time to time
     * We attach them to this event to track how user properties change over time
     */
    const userProfileProperties = await getUserProperties(account);
    const mixpanelParams: Record<string, unknown> = {
      ...omit(params, ['request_name', 'wallet_address']),
      ...userProfileProperties,
    };
    mixpanelTrack('General: App Opened', mixpanelParams);
  });

  emitter.on('screenView', async (data) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
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
    const mixpanelParams: Record<string, unknown> = omit(params, [
      'request_name',
      'wallet_address',
    ]);
    mixpanelTrack('General: Screen Viewed', mixpanelParams);
    statsigTrack('General: Screen Viewed', mixpanelParams);
  });

  emitter.on('screenView', async (params) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    await waitForAnalyticsIdSet();
    const gaParams = await prepareGaParams({
      page_title: params.title,
      page_location: params.pathname,
    });
    gaCollect('page_view', gaParams);
  });

  emitter.on('buttonClicked', async (data) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
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

  emitter.on('bannerClicked', async (data) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const { bannerName, pathname, walletAddress } = data;
    const params = createParams({
      request_name: 'banner_clicked',
      screen_name: pathname,
      banner_name: bannerName,
      wallet_address: walletAddress,
    });
    const event_name = 'General: Banner Clicked';
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack(event_name, mixpanelParams);
  });

  emitter.on('assetClicked', async (data) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const { assetId, pathname, section } = data;

    const assetData = await queryFungibleInfo({
      fungibleId: assetId,
      currency: 'usd',
    });

    const params = createParams({
      request_name: 'asset_clicked',
      screen_name: pathname,
      asset_id: assetId,
      asset_name: assetData.data.fungible.name,
      section_id: section,
    });
    const event_name = 'General: Asset Clicked';
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack(event_name, mixpanelParams);
  });

  emitter.on('daylightAction', async ({ event_name, ...data }) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const params = createParams({
      request_name: 'daylight_action',
      wallet_address: data.address,
      event_name,
      ...data,
    });
    sendToMetabase('daylight_action', params);
  });

  emitter.on('globalError', async ({ name, message }) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const params = createParams({
      request_name: 'client_error',
      type: name,
      message,
    });
    sendToMetabase('client_error', params);
  });

  type TransactionSentContext = {
    status: 'success';
    result: SignTransactionResult;
  };
  type TransactionFailedContext = { status: 'failed'; errorMessage: string };

  const trackTransactionSign = async (
    props: {
      context: { mode: 'default' | 'testnet' } & TransactionContextParams;
    } & (TransactionSentContext | TransactionFailedContext)
  ) => {
    const { context, status } = props;
    const {
      initiator,
      feeValueCommon,
      addressAction,
      quote,
      clientScope,
      chain,
      outputChain,
      warningWasShown = false,
      outputAmountColor = 'grey',
    } = context;

    const initiatorURL = new URL(initiator);
    const { origin, pathname } = initiatorURL;
    const isInternalOrigin = globalThis.location.origin === origin;
    const initiatorName = isInternalOrigin ? 'Extension' : 'External Dapp';
    const actionAnalytics = addressActionToAnalytics({
      addressAction,
      quote,
      outputChain: outputChain ?? null,
    });
    const preferences = await account
      .getCurrentWallet()
      .getPreferences({ context: INTERNAL_SYMBOL_CONTEXT });

    const commonParams = createParams({
      request_name: 'signed_transaction',
      screen_name: origin === initiator ? 'Transaction Request' : pathname,
      /* @deprecated */
      context: initiatorName,
      /* @deprecated */
      type: 'Sign',
      client_scope: clientScope ?? initiatorName,
      dapp_domain: isInternalOrigin ? null : origin,
      chain,
      gas_price: null, // TODO for general case - this is partially covered in actionAnalytics
      network_fee: null, // TODO for general case - this is partially covered in actionAnalytics
      network_fee_value: feeValueCommon,
      contract_type: quote ? quote.contractMetadata.name ?? null : null,
      hold_sign_button: Boolean(preferences.enableHoldToSignButton),
      warning_was_shown: warningWasShown,
      output_amount_color: outputAmountColor,
      transaction_success: status === 'success',
      backend_error_message: quote?.error?.message || null,
      ...omitNullParams(actionAnalytics),
    });

    let statusParams;
    if (status === 'success') {
      const address = getTxSender(props.result);
      statusParams = {
        wallet_address: address, // transaction.from,
        gas: props.result.evm ? props.result.evm.gasLimit.toString() : null,
        /** Current requirement by analytics: send solana signatures as `hash` */
        hash:
          props.result.evm?.hash ?? ensureSolanaResult(props.result).signature,
        ecosystem: toEcosystemProperty(getAddressType(address)),
      };
    } else {
      statusParams = { transaction_error_message: props.errorMessage };
    }

    const params = {
      ...commonParams,
      ...statusParams,
    };

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
  };

  emitter.on('transactionSent', async (result, context) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    trackTransactionSign({ status: 'success', result, context });
  });

  emitter.on('transactionFailed', async (errorMessage, context) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    trackTransactionSign({ status: 'failed', errorMessage, context });
  });

  emitter.on('quoteError', async (quoteErrorContext, source) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const [inputTokenPositions, inputAssetData, outputAssetData] =
      await Promise.all([
        queryWalletPositions(
          {
            addresses: [quoteErrorContext.address],
            currency: 'usd',
            assetIds: [quoteErrorContext.inputFungibleId],
          },
          source
        ),
        quoteErrorContext.inputFungibleId
          ? queryFungibleInfo({
              fungibleId: quoteErrorContext.inputFungibleId,
              currency: 'usd',
            })
          : null,
        quoteErrorContext.outputFungibleId
          ? queryFungibleInfo({
              fungibleId: quoteErrorContext.outputFungibleId,
              currency: 'usd',
            })
          : null,
      ]);
    const inputAsset = inputAssetData?.data?.fungible;
    const outputAsset = outputAssetData?.data?.fungible;
    invariant(
      inputAsset,
      'Unable to fetch input asset data for quoteError event'
    );
    invariant(
      outputAsset,
      'Unable to fetch output asset data for quoteError event'
    );
    const inputPosition = inputTokenPositions.data
      .filter(
        (position) =>
          position.type === 'asset' &&
          position.chain === quoteErrorContext.inputChain
      )
      .at(0);

    const params = createParams({
      request_name: 'client_error',
      action_type: quoteErrorContext.actionType,
      type: quoteErrorContext.type,
      name: quoteErrorContext.type,
      message: quoteErrorContext.message,
      backend_response_code: quoteErrorContext.errorCode || null,
      backend_error_message: quoteErrorContext.backendMessage || null,
      wallet_address: quoteErrorContext.address,
      client_scope: quoteErrorContext.context,
      context: quoteErrorContext.context,
      screen_name: quoteErrorContext.pathname,

      asset_address_sent: [quoteErrorContext.inputFungibleId],
      asset_address_received: [quoteErrorContext.outputFungibleId],
      asset_name_sent: toMaybeArr([inputAsset.name]),
      asset_name_received: toMaybeArr([outputAsset.name]),
      input_chain: quoteErrorContext.inputChain,
      output_chain: quoteErrorContext.outputChain,
      contract_type: quoteErrorContext.contractType || null,
      slippage: quoteErrorContext.slippage,

      asset_market_cap_sent: inputAsset.meta.marketCap,
      asset_market_cap_received: outputAsset.meta.marketCap,
      asset_fdv_sent: inputAsset.meta.fullyDilutedValuation,
      asset_fdv_received: outputAsset.meta.fullyDilutedValuation,
      usd_amount_sent:
        Number(quoteErrorContext.inputAmount) * (inputAsset.meta.price || 0),
      asset_amount_sent: toMaybeArr([Number(quoteErrorContext.inputAmount)]),
      usd_amount_received:
        quoteErrorContext.outputAmount != null
          ? Number(quoteErrorContext.outputAmount) *
            (outputAsset.meta.price || 0)
          : null,
      asset_amount_received:
        quoteErrorContext.outputAmount != null
          ? toMaybeArr([Number(quoteErrorContext.outputAmount)])
          : null,
      wallet_token_balance: inputPosition
        ? getPositionBalance(inputPosition).toFixed()
        : null,
    });
    sendToMetabase('client_error', params);
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack('General: Client Error', mixpanelParams);
  });

  emitter.on('transactionFormed', async (context) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const {
      formState,
      quote,
      enoughBalance,
      slippagePercent,
      warningWasShown,
      outputAmountColor,
      scope,
    } = context;

    // We query fungible info for input and output assets
    // to provide fdv_asset_sent and fdv_asset_received
    const inputAssetData = formState.inputFungibleId
      ? await queryFungibleInfo({
          fungibleId: formState.inputFungibleId,
          currency: 'usd',
        })
      : null;
    const inputAsset = inputAssetData?.data?.fungible;
    const outputAssetData = formState.outputFungibleId
      ? await queryFungibleInfo({
          fungibleId: formState.outputFungibleId,
          currency: 'usd',
        })
      : null;
    const outputAsset = outputAssetData?.data?.fungible;
    invariant(
      inputAsset,
      'Unable to fetch input asset data for transactionFormed event'
    );
    invariant(
      outputAsset,
      'Unable to fetch output asset data for transactionFormed event'
    );

    const params = createParams({
      request_name: 'swap_form_filled_out',
      client_scope: scope,
      screen_name: scope === 'Swap' ? 'Swap' : 'Bridge',
      action_type: scope === 'Swap' ? 'Trade' : 'Send',

      usd_amount_received: quote.outputAmount.usdValue ?? undefined,
      asset_amount_received: toMaybeArr([Number(quote.outputAmount.quantity)]),
      asset_name_received: toMaybeArr([outputAsset.name]),
      asset_address_received: toMaybeArr([outputAsset.id]),

      usd_amount_sent:
        Number(formState.inputAmount) * (inputAsset.meta.price || 0),
      asset_amount_sent: toMaybeArr([Number(formState.inputAmount)]),
      asset_name_sent: toMaybeArr([inputAsset.name]),
      asset_address_sent: toMaybeArr([inputAsset.id]),

      gas: quote.transactionSwap?.evm
        ? Number(getGas(quote.transactionSwap.evm))
        : undefined,
      network_fee: quote.networkFee?.amount.usdValue ?? undefined,
      gas_price: quote.transactionSwap?.evm?.gasPrice ?? undefined,
      guaranteed_output_amount: quote.minimumOutputAmount.quantity,
      zerion_fee_percentage: quote.protocolFee.percentage,
      zerion_fee_usd_amount: quote.protocolFee.amount.usdValue ?? 0,
      input_chain: formState.inputChain,
      output_chain: formState.outputChain ?? formState.inputChain,
      slippage: slippagePercent,
      contract_type: quote.contractMetadata.name,

      fdv_asset_sent: inputAsset.meta.fullyDilutedValuation ?? undefined,
      fdv_asset_received: outputAsset.meta.fullyDilutedValuation ?? undefined,

      enough_balance: enoughBalance,
      enough_allowance: Boolean(quote.transactionSwap),
      bridge_fee_usd_amount: quote.bridgeFee?.amount.usdValue ?? 0,
      warning_was_shown: warningWasShown,
      output_amount_color: outputAmountColor,
    });

    sendToMetabase('swap_form_filled_out', params);
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack('Transaction: Swap Form Filled Out', mixpanelParams);
  });

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

  emitter.on('typedDataSigned', async ({ typedData, ...rest }) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    handleSign({ type: 'typedDataSigned', ...rest });
  });
  emitter.on('messageSigned', async ({ message, ...rest }) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    handleSign({ type: 'messageSigned', ...rest });
  });

  // TODO: add networks-related analytics
  emitter.on('addEthereumChain', async ({ values: [chainConfig], origin }) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
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
    onIdle(async () => {
      const preferences = await globalPreferences.getPreferences();
      if (!preferences.analyticsEnabled) {
        return;
      }
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

  emitter.on('holdToSignPreferenceChange', async (active) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const params = createParams({
      request_name: 'hold_to_sign_prerefence',
      active,
    });
    const mixpanelParams = omit(params, ['request_name', 'wallet_address']);
    mixpanelTrack('Experiments: Hold Sign Button', mixpanelParams);
  });

  emitter.on('walletCreated', async ({ walletContainer, origin }) => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
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
        ecosystem: toEcosystemProperty(getAddressType(wallet.address)),
      });
      sendToMetabase('add_wallet', params);
      mixpanelTrack('Wallet: Wallet Added', {
        wallet_provider,
        type,
        ecosystem: params.ecosystem,
      });
    }
  });

  emitter.on('firstScreenView', async () => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
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
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
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
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    const request_name = 'client_error';
    const message = getError(error).message;
    const type = 'dna action';
    const params = createParams({ request_name, type, message, action });
    sendToMetabase(request_name, params);
  });

  emitter.on('cloudflareChallengeIssued', async () => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
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
  const handleUserId = async () => {
    const preferences = await globalPreferences.getPreferences();
    if (!preferences.analyticsEnabled) {
      return;
    }
    mixpanelIdentify(account);
  };
  account.on('authenticated', () => handleUserId());
  if (account.getUser()) {
    handleUserId();
  }
  globalPreferences.on('change', (state, prevState) => {
    if (
      state.analyticsEnabled &&
      !prevState.analyticsEnabled &&
      account.getUser()
    ) {
      handleUserId();
    }
  });
  return trackAppEvents({ account });
}
