import type { EmptyAddressPosition } from '@zeriontech/transactions';
import {
  createSendNativeOrContractTransaction,
  createSendNFTTransaction,
} from '@zeriontech/transactions';
import type { AddressNFT, AddressPosition, Client } from 'defi-sdk';
import {
  adjustedCheckEligibility,
  fetchAndAssignPaymaster,
} from 'src/modules/ethereum/account-abstraction/fetchAndAssignPaymaster';
import { estimateGasForNetwork } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import { uiGetBestKnownTransactionCount } from 'src/modules/ethereum/transactions/getBestKnownTransactionCount/uiGetBestKnownTransactionCount';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import {
  getAddress,
  getAssetImplementationInChain,
  getDecimals,
} from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { Networks } from 'src/modules/networks/Networks';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { assertProp } from 'src/shared/assert-property';
import { invariant } from 'src/shared/invariant';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isNumeric } from 'src/shared/isNumeric';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { baseToCommon, commonToBase } from 'src/shared/units/convert';
import { valueToHex } from 'src/shared/units/valueToHex';
import { queryGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { getHttpClientSource } from 'src/modules/zerion-api/getHttpClientSource';
import { solToBase64 } from 'src/modules/solana/transactions/create';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { getAddressType } from 'src/shared/wallet/classifiers';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { SOL_ASSET_FUNGIBLE } from 'src/modules/solana/transactions/parseSolanaTransaction';
import type { NetworkFeeType } from 'src/modules/zerion-api/types/NetworkFeeType';
import { applyConfiguration } from '../../SendTransaction/TransactionConfiguration/applyConfiguration';
import { parseNftId } from './useNftPosition';
import type { SendFormState } from './SendFormState';
import { toConfiguration } from './helpers';
import { buildSolanaTransfer } from './buildSolanaTransfer';

async function getNftPosition(
  client: Client,
  from: string,
  formState: SendFormState
) {
  const { nftId, tokenChain } = formState;
  invariant(nftId, 'Params missing: nftId');
  invariant(tokenChain, 'Params missing: nftId');
  const { contract_address, token_id } = parseNftId(nftId);

  return Promise.race([
    new Promise<AddressNFT>((resolve) => {
      client.addressNftPosition(
        {
          address: from,
          chain: tokenChain,
          contract_address,
          token_id,
          currency: 'usd', // we don't care about currency here, but matching one from UI may be faster
        },
        {
          cachePolicy: 'cache-first',
          onData: (value) => {
            resolve(value['nft-position']);
          },
        }
      );
    }),
    rejectAfterDelay(20000, 'addressNftPosition'),
  ]);
}

function createNetworkFee(
  fee: number,
  network: NetworkConfig
): null | NetworkFeeType {
  if (!network.native_asset) {
    return null;
  }
  return {
    free: false,
    amount: {
      quantity: baseToCommon(fee, network.native_asset?.decimals).toFixed(),
      value: null,
      usdValue: null,
    },
    // TODO: Fetch real asset from backend so that we have fiat price
    fungible: network.standard === 'solana' ? SOL_ASSET_FUNGIBLE : null,
  };
}

async function applyConfigurationAsync<T extends IncomingTransaction>({
  transaction,
  formState,
  chain,
}: {
  transaction: T;
  formState: SendFormState;
  chain: Chain;
}) {
  const chainGasPrices = await queryGasPrices(chain);
  const configuration = toConfiguration(formState);
  return applyConfiguration(transaction, configuration, chainGasPrices);
}

async function getEligibility(tx: IncomingTransaction) {
  const source = await getHttpClientSource();
  assertProp(tx, 'from');
  assertProp(tx, 'to');
  assertProp(tx, 'chainId');
  assertProp(tx, 'nonce');
  assertProp(tx, 'gas');
  return adjustedCheckEligibility(tx, {
    source,
    apiClient: ZerionAPI,
  });
}

async function getPaymasterTx(transaction: IncomingTransaction) {
  const source = await getHttpClientSource();
  return fetchAndAssignPaymaster(transaction, { source, apiClient: ZerionAPI });
}

type SendSubmitData = (
  | {
      networkId: null;
      transaction: null;
    }
  | {
      networkId: Chain;
      transaction: MultichainTransaction<
        PartiallyRequired<IncomingTransaction, 'chainId' | 'from'>
      >;
    }
) & {
  paymasterPossible: boolean;
  paymasterEligibility: null | Awaited<
    ReturnType<typeof adjustedCheckEligibility>
  >;
  networkFee: null | NetworkFeeType;
};

export async function prepareSendData(
  from: string,
  position: AddressPosition | EmptyAddressPosition | null,
  formState: SendFormState,
  client: Client
): Promise<SendSubmitData> {
  const EMPTY_SEND_DATA = {
    networkId: null,
    paymasterPossible: false,
    paymasterEligibility: null,
    transaction: null,
    networkFee: null,
  };
  const {
    type,
    to,
    tokenValue,
    tokenChain,
    tokenAssetCode,
    gasLimit,
    nftAmount,
    nftId,
  } = formState;
  if (!from || !to || !tokenChain) {
    return EMPTY_SEND_DATA;
  }
  if (!isMatchForEcosystem(from, getAddressType(to))) {
    throw new Error('Cannot send between Ethereum and Solana wallets');
  }
  const networksStore = await getNetworksStore();
  const network = await networksStore.fetchNetworkById(tokenChain);
  const chain = createChain(network.id);
  if (isEthereumAddress(from)) {
    const chainId = Networks.getChainId(network);

    let tx: IncomingTransaction;
    if (type === 'nft') {
      if (!nftAmount || !nftId) {
        return EMPTY_SEND_DATA;
      }
      const nftPosition = await getNftPosition(client, from, formState);
      tx = createSendNFTTransaction({
        chainId,
        from,
        to,
        nft: nftPosition,
        amount: nftAmount,
      });
    } else {
      if (!tokenAssetCode || !tokenValue) {
        return EMPTY_SEND_DATA;
      }
      invariant(
        position?.asset.asset_code === tokenAssetCode,
        'Position must match formState.tokenAssetCode'
      );
      invariant(
        getAssetImplementationInChain({ asset: position.asset, chain }),
        'Asset must exist on chain'
      );
      const tokenAddressInChain = getAddress({ asset: position.asset, chain });
      if (tokenAddressInChain === undefined) {
        throw new Error('Token implementation is unknown in selected chain');
      }
      const isNativeAsset = Networks.isNativeAsset(position.asset, network);
      tx = createSendNativeOrContractTransaction({
        chainId,
        from,
        to,
        inputToken: tokenAddressInChain,
        tokenInterface: isNativeAsset ? 'native' : 'erc20',
        value: commonToBase(
          tokenValue,
          getDecimals({ asset: position.asset, chain })
        ).toFixed(),
      });
    }
    if (gasLimit) {
      invariant(isNumeric(gasLimit), 'Gas limit must be numeric');
      tx.gasLimit = valueToHex(gasLimit);
      tx.gas = valueToHex(gasLimit);
    } else {
      const gas = await estimateGasForNetwork(tx, network);
      tx.gasLimit = valueToHex(gas);
      tx.gas = valueToHex(gas);
    }
    let nonce = formState.nonce;
    if (network.supports_sponsored_transactions && nonce == null) {
      const { value: latestNonce } = await uiGetBestKnownTransactionCount({
        address: from,
        network,
        defaultBlock: 'pending',
      });
      nonce = String(latestNonce);
    }
    tx = await applyConfigurationAsync({
      chain,
      formState: { ...formState, nonce },
      transaction: tx,
    });
    let eligibility: SendSubmitData['paymasterEligibility'] = null;
    if (network.supports_sponsored_transactions) {
      eligibility = await getEligibility(tx);
      if (eligibility.data.eligible) {
        tx = await getPaymasterTx(tx);
      }
    }
    assertProp(tx, 'chainId');
    assertProp(tx, 'from');
    return {
      networkId: chain,
      paymasterPossible: network.supports_sponsored_transactions,
      paymasterEligibility: eligibility,
      transaction: { evm: tx },
      networkFee: null, // TODO: Currently calculated in UI, calculate here instead
    };
  } else {
    if (type === 'nft') {
      return EMPTY_SEND_DATA;
    }
    const { tokenValue, tokenAssetCode, tokenChain } = formState;
    if (!tokenValue || !tokenAssetCode || !tokenChain || !position) {
      return EMPTY_SEND_DATA;
    }
    const { tx, fee } = await buildSolanaTransfer(
      from,
      formState,
      position,
      network
    );
    return {
      networkId: chain,
      paymasterPossible: false,
      paymasterEligibility: null,
      networkFee: fee != null ? createNetworkFee(fee, network) : null,
      transaction: { solana: solToBase64(tx) },
    };
  }
}
