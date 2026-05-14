import { hashQueryKey, useQuery } from '@tanstack/react-query';
import { Client } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useTransactionGetSend } from 'src/modules/zerion-api/hooks/useTransactionGetSend';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { NetworkFeeType } from 'src/modules/zerion-api/types/NetworkFeeType';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { prepareSendData } from 'src/ui/pages/SendForm/shared/prepareSendData';
import { fungiblePositionToAddressPosition } from './shared/fungiblePositionToAddressPosition';
import { toLegacySendFormState } from './shared/toLegacySendFormState';
import type { SendFormState2 } from './types';

export interface SendTransactionResult {
  network: NetworkConfig | null;
  transaction: MultichainTransaction | null;
  networkFee: NetworkFeeType | null;
  inputAmount: Amount | null;
  error: TransactionPrepareError | null;
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

  const isNftMode = Boolean(formState.nftId);

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

  const legacyFormState = useMemo(
    () => toLegacySendFormState(formState, resolvedInputAmount),
    [formState, resolvedInputAmount]
  );

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
      return {
        network,
        transaction: backendQuery.data.transactionSend,
        networkFee: backendQuery.data.networkFee,
        inputAmount: backendQuery.data.inputAmount,
        error: backendQuery.data.error,
      };
    }
    if (!localQuery.data) return undefined;
    return {
      network: localQuery.data.network,
      transaction: localQuery.data.transaction,
      networkFee: localQuery.data.networkFee,
      inputAmount: null,
      error: null,
    };
  }, [baseGatesPass, useBackend, backendQuery.data, localQuery.data, network]);

  const backendEnabled = enabledParam && baseGatesPass && useBackend;

  return {
    data,
    isLoading: useBackend
      ? backendEnabled && backendQuery.isLoading
      : localEnabled && localQuery.isLoading,
    isFetching: useBackend ? backendQuery.isFetching : localQuery.isFetching,
  };
}
