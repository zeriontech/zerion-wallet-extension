import { hashQueryKey, useQuery } from '@tanstack/react-query';
import { Client } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useTransactionGetSend } from 'src/modules/zerion-api/hooks/useTransactionGetSend';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { NetworkFeeType } from 'src/modules/zerion-api/types/NetworkFeeType';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import type {
  Quote2,
  TransactionEVM,
  TransactionMultichainBackend,
} from 'src/shared/types/Quote';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { valueToHex } from 'src/shared/units/valueToHex';
import { prepareSendData } from 'src/ui/pages/SendForm/shared/prepareSendData';
import { fungiblePositionToAddressPosition } from './shared/fungiblePositionToAddressPosition';
import { toLegacySendFormState } from './shared/toLegacySendFormState';
import { hexlifyTransactionData } from './shared/hexlifyTransactionData';
import type { SendFormState2 } from './types';

/**
 * A quote-shaped view of a prepared send. Both the backend and the local prep
 * paths are normalized to this single shape inside the hook so SendForm2 can
 * reuse SwapForm2's quote-typed network-fee dialog and helpers with no
 * special-casing. `transactionSwap` carries the **backend** `TransactionEVM`
 * (field names `gas`/`maxFee`/`maxPriorityFee`); the client `IncomingTransaction`
 * conversion happens once, at sign time. `networkFee.amount.value` may be null.
 */
export type SendQuote = Pick<Quote2, 'networkFee' | 'transactionSwap'>;

export interface SendTransactionResult {
  network: NetworkConfig | null;
  sendQuote: SendQuote | null;
  inputAmount: Amount | null;
  error: TransactionPrepareError | null;
}

const toHex = (value: number | string | null | undefined): string | null => {
  if (value == null || value === '') {
    return null;
  }
  return valueToHex(value);
};

/**
 * Adapt the local prep path's client `IncomingTransaction` to the backend
 * `TransactionEVM` field names (`gasLimit`→`gas`, `maxFeePerGas`→`maxFee`,
 * `maxPriorityFeePerGas`→`maxPriorityFee`), so the local path is
 * indistinguishable from the backend path downstream. Numbers are hex-encoded
 * to match the backend's string-hex convention.
 */
function toBackendEvm(tx: IncomingTransaction): TransactionEVM {
  return {
    type: tx.type != null ? valueToHex(tx.type) : '0x0',
    from: tx.from ?? '',
    to: tx.to ?? '',
    nonce: tx.nonce != null ? valueToHex(tx.nonce) : '0x0',
    chainId: tx.chainId != null ? valueToHex(tx.chainId) : '0x0',
    gas: toHex(tx.gasLimit ?? tx.gas) ?? '0x0',
    gasPrice: toHex(tx.gasPrice),
    maxFee: toHex(tx.maxFeePerGas),
    maxPriorityFee: toHex(tx.maxPriorityFeePerGas),
    value: toHex(tx.value) ?? '0x0',
    data: typeof tx.data === 'string' ? tx.data : '0x',
    customData: null,
  };
}

function toBackendTransaction(
  tx: MultichainTransaction
): TransactionMultichainBackend {
  if (tx.evm) {
    return { evm: toBackendEvm(tx.evm), solana: null };
  }
  return { evm: null, solana: tx.solana ?? null };
}

/**
 * Build `sendQuote.networkFee` from a backend/local `NetworkFeeType` by
 * injecting the active `currency` into `.amount` so it satisfies `Amount`.
 * `value` is preserved (may be null — SendDetails recomputes fiat locally).
 */
function toQuoteNetworkFee(
  networkFee: NetworkFeeType | null,
  currency: string
): SendQuote['networkFee'] {
  if (!networkFee) {
    return null;
  }
  return {
    free: networkFee.free,
    amount: networkFee.amount ? { ...networkFee.amount, currency } : null,
    fungible: networkFee.fungible,
  };
}

export function useSendTransaction({
  address,
  formState,
  position,
  resolvedInputAmount,
  network,
  enabled: enabledParam = true,
}: {
  address: string;
  formState: SendFormState2;
  position: FungiblePosition | null;
  resolvedInputAmount: string | null;
  network: NetworkConfig | null;
  enabled?: boolean;
}) {
  const client = useDefiSdkClient();
  const { currency } = useCurrency();
  const source = useHttpClientSource();
  const { preferences } = usePreferences();

  const isNftMode = Boolean(formState.nftId);

  // Custom transaction data — gated behind the Developer Tools "Custom Data"
  // toggle and EVM senders only. Stored raw (as typed) in the URL form state so
  // the editor round-trips; hexlified here at the backend boundary so the API
  // (and the local prep path) always receive a valid hex string. Fed to the
  // backend `get-send` `data` param and injected into the local prep path so
  // both send routes carry it identically.
  const customData = useMemo(() => {
    if (
      !preferences?.configurableTransactionData ||
      !isEthereumAddress(address) ||
      !formState.data
    ) {
      return undefined;
    }
    return hexlifyTransactionData(formState.data);
  }, [preferences?.configurableTransactionData, address, formState.data]);

  const isMax = useMemo(() => {
    if (isNftMode || !resolvedInputAmount || !position) return false;
    try {
      return new BigNumber(resolvedInputAmount).eq(position.amount.quantity);
    } catch {
      return false;
    }
  }, [isNftMode, resolvedInputAmount, position]);

  const assetId = formState.nftId ?? formState.inputFungibleId;

  const effectiveAmount = isNftMode
    ? formState.nftAmount ?? '1'
    : resolvedInputAmount;

  const baseGatesPass = Boolean(
    address &&
      formState.inputChain &&
      formState.to &&
      assetId &&
      (isMax || (effectiveAmount && Number(effectiveAmount) > 0)) &&
      network
  );

  const useBackend = Boolean(network?.supports_sending);

  const backendQuery = useTransactionGetSend(
    {
      currency,
      chain: formState.inputChain,
      from: address,
      to: formState.to ?? '',
      assetId: assetId ?? '',
      amount: isMax ? undefined : effectiveAmount ?? undefined,
      max: isMax ? true : undefined,
      data: customData,
    },
    { source },
    {
      enabled: enabledParam && baseGatesPass && useBackend,
      keepPreviousData: true,
      suspense: false,
    }
  );

  // Local fallback path — only fires when the network exists and does NOT
  // support backend-based sending. Mirrors the prior hook behavior.
  const addressPosition = useMemo(
    () => (position ? fungiblePositionToAddressPosition(position) : null),
    [position]
  );

  // Gas overrides are applied at sign time (via applyConfiguration), not in the
  // prep query — strip them here so the local path stays gas-unapplied and
  // matches the backend path's shape. `data` is replaced with the gated,
  // hexlified value so the local `prepareSendData` merge stays consistent with
  // the backend param (and never carries a raw, non-hex string).
  const legacyFormState = useMemo(() => {
    const base = toLegacySendFormState(formState, resolvedInputAmount);
    return {
      ...base,
      networkFeeSpeed: undefined,
      maxFee: undefined,
      maxPriorityFee: undefined,
      gasPrice: undefined,
      gasLimit: undefined,
      nonce: undefined,
      data: customData,
    };
  }, [formState, resolvedInputAmount, customData]);

  const localEnabled =
    enabledParam && baseGatesPass && !useBackend && Boolean(addressPosition);

  const localQuery = useQuery({
    enabled: localEnabled,
    keepPreviousData: true,
    suspense: false,
    queryKey: [
      'prepareSendData/SendForm2',
      address,
      addressPosition,
      legacyFormState,
      client,
    ],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: () =>
      prepareSendData(address, addressPosition, legacyFormState, client),
    staleTime: 20000,
    retry: 1,
  });

  const data = useMemo<SendTransactionResult | undefined>(() => {
    if (!baseGatesPass) return undefined;
    if (useBackend) {
      if (!backendQuery.data) return undefined;
      const { transactionSend, networkFee, inputAmount, error } =
        backendQuery.data;
      return {
        network,
        sendQuote: {
          transactionSwap: transactionSend,
          networkFee: toQuoteNetworkFee(networkFee, currency),
        },
        inputAmount,
        error,
      };
    }
    if (!localQuery.data) return undefined;
    const local = localQuery.data;
    return {
      network: local.network,
      sendQuote: {
        transactionSwap: local.transaction
          ? toBackendTransaction(local.transaction)
          : null,
        networkFee: toQuoteNetworkFee(local.networkFee, currency),
      },
      inputAmount: null,
      error: null,
    };
  }, [
    baseGatesPass,
    useBackend,
    backendQuery.data,
    localQuery.data,
    network,
    currency,
  ]);

  const backendEnabled = enabledParam && baseGatesPass && useBackend;

  return {
    data,
    isLoading: useBackend
      ? backendEnabled && backendQuery.isLoading
      : localEnabled && localQuery.isLoading,
    isFetching: useBackend ? backendQuery.isFetching : localQuery.isFetching,
  };
}
