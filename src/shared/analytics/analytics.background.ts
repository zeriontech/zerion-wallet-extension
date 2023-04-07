import { ethers } from 'ethers';
import type { Account } from 'src/background/account/Account';
import { emitter } from 'src/background/events';
import { networksStore } from 'src/modules/networks/networks-store.background';
import { createParams as createBaseParams, sendToMetabase } from './analytics';

function trackAppEvents({ account }: { account: Account }) {
  const getUserId = () => account.getUser()?.id;
  const createParams: typeof createBaseParams = (params) =>
    createBaseParams({
      ...params,
      userId: getUserId(),
    });
  emitter.on('dappConnection', async ({ origin, address }) => {
    const params = createParams({
      request_name: 'dapp_connection',
      dapp_domain: origin,
      wallet_address: address,
    });
    sendToMetabase('dapp_connection', params);
  });

  emitter.on('screenView', (data) => {
    const params = createParams({
      request_name: 'screen_view',
      wallet_address: data.address,
      screen_name: data.pathname,
      previous_screen_name: data.previous,
    });
    sendToMetabase('screen_view', params);
  });

  emitter.on('daylightAction', ({ event_name, ...data }) => {
    const params = createParams({
      request_name: 'daylight_action',
      event_name,
      ...data,
    });
    sendToMetabase('daylight_action', params);
  });

  emitter.on(
    'transactionSent',
    async ({ transaction, initiator, feeValueCommon }) => {
      const initiatorURL = new URL(initiator);
      const { origin, pathname } = initiatorURL;
      const networks = await networksStore.load();
      const chainId = ethers.utils.hexValue(transaction.chainId);
      const chain = networks.getChainById(chainId)?.toString() || chainId;
      const params = createParams({
        request_name: 'signed_transaction',
        screen_name: origin === initiator ? 'Transaction Request' : pathname,
        wallet_address: transaction.from,
        context:
          globalThis.location.origin === origin ? 'Extension' : 'External Dapp',
        type: 'sign',
        dapp_domain: globalThis.location.origin === origin ? null : origin,
        chain,
        gas: transaction.gasLimit.toString(),
        hash: transaction.hash,
        asset_amount_sent: [], // TODO
        gas_price: null, // TODO
        network_fee: null, // TODO
        network_fee_value: feeValueCommon,
      });
      sendToMetabase('signed_transaction', params);
    }
  );

  function handleSign({
    type,
    initiator,
    address,
  }: {
    type: 'typedDataSigned' | 'messageSigned';
    initiator: string;
    address: string;
  }) {
    const initiatorURL = new URL(initiator);
    const { origin } = initiatorURL;
    const eventToMethod = {
      // values are ethers method names
      typedDataSigned: '_signTypedData',
      messageSigned: 'signMessage',
    } as const;
    const params = createParams({
      request_name: 'signed_message',
      type: eventToMethod[type] ?? 'unexpected type',
      address,
      context:
        globalThis.location.origin === origin ? 'Extension' : 'External Dapp',
      dapp_domain: globalThis.location.origin === origin ? null : origin,
    });
    sendToMetabase('signed_message', params);
  }

  emitter.on('typedDataSigned', ({ typedData, ...rest }) => {
    handleSign({ type: 'typedDataSigned', ...rest });
  });
  emitter.on('messageSigned', ({ message, ...rest }) => {
    handleSign({ type: 'messageSigned', ...rest });
  });

  emitter.on('addEthereumChain', ({ values: [network], origin }) => {
    const params = createParams({
      request_name: 'add_custom_evm',
      source: origin,
      network_external_id: network.external_id,
      network_rpc_url_internal: network.rpc_url_internal,
      network_name: network.name,
      network_native_asset_symbol: network.native_asset?.symbol || null,
      network_explorer_home_url: network.explorer_home_url,
    });
    sendToMetabase('add_custom_evm', params);
  });
}

export function initialize({ account }: { account: Account }) {
  return trackAppEvents({ account });
}
