import { baseToCommon } from 'src/shared/units/convert';
import type { Asset, AddressAction, Client } from 'defi-sdk';
import { client as defaultClient } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { valueToHex } from 'src/shared/units/valueToHex';
import { createChain, type Chain } from 'src/modules/networks/Chain';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { capitalize } from 'capitalize-ts';
import { getDecimals } from 'src/modules/networks/asset';
import type { TypedData } from '../message-signing/TypedData';
import type { InterpretResponse } from './types';
import { getGas } from './getGas';
import type { ChainId } from './ChainId';
import { getFungibleAsset } from './actionAsset';
import { convertAssetToFungibleOutline } from './addressAction';

type LegacyInterpretResponse = Omit<InterpretResponse, 'action'> & {
  action: AddressAction | null;
};

async function convertToNewInterpretation(
  legacyInterpretation: LegacyInterpretResponse | null,
  address: string,
  currency: string
): Promise<InterpretResponse | null> {
  if (!legacyInterpretation) {
    return null;
  }

  const legacyAction = legacyInterpretation.action;
  const label = legacyAction
    ? {
        title:
          legacyAction.label?.type === 'contract'
            ? 'application'
            : legacyAction.label?.type || 'application',
        displayTitle: capitalize(legacyAction.label?.type || ''),
        contract:
          legacyAction.label?.type === 'contract' ||
          legacyAction.label?.type === 'application'
            ? {
                address:
                  legacyAction.label.display_value.contract_address || '',
                dapp: {
                  id: legacyAction.label.display_value.text || '',
                  name: legacyAction.label.display_value.text || '',
                  iconUrl: legacyAction.label.icon_url || null,
                  url: null,
                },
              }
            : null,
        wallet:
          legacyAction.label?.type === 'from' ||
          legacyAction.label?.type === 'to'
            ? {
                address: legacyAction.label.display_value.wallet_address || '',
                name: legacyAction.label.display_value.text || '',
                iconUrl: legacyAction.label.icon_url || null,
              }
            : null,
      }
    : null;
  const transaction = legacyAction
    ? {
        hash: legacyAction.transaction.hash,
        explorerUrl: `https://etherscan.io/tx/${legacyAction.transaction.hash}`,
        chain: {
          id: legacyAction.transaction.chain,
          name: legacyAction.transaction.chain,
          iconUrl: '',
        },
      }
    : null;
  return {
    warnings: legacyInterpretation.warnings,
    input: legacyInterpretation.input,
    action:
      legacyAction && transaction
        ? {
            id: legacyAction.id,
            address,
            content: null,
            gasback: null,
            refund: null,
            fee: null,
            type: {
              value: legacyAction.type.value,
              displayValue: legacyAction.type.display_value,
            },
            timestamp: new Date(legacyAction.datetime).getTime(),
            label,
            acts: [
              {
                content: {
                  approvals: legacyAction.content?.single_asset
                    ? [
                        {
                          amount: {
                            currency,
                            quantity: baseToCommon(
                              legacyAction.content.single_asset.quantity,
                              getDecimals({
                                asset: getFungibleAsset(
                                  legacyAction.content.single_asset.asset
                                ) as Asset,
                                chain: createChain(
                                  legacyAction.transaction.chain
                                ),
                              })
                            ).toFixed(),
                            value: null,
                            usdValue: null,
                          },
                          fungible: convertAssetToFungibleOutline(
                            getFungibleAsset(
                              legacyAction.content.single_asset.asset
                            )
                          ),
                          nft: null,
                          unlimited: false,
                          collection: null,
                        },
                      ]
                    : null,
                  transfers: legacyAction.content?.transfers
                    ? [
                        ...(legacyAction.content.transfers.incoming?.map(
                          (transfer) => ({
                            direction: 'in' as const,
                            amount: {
                              currency,
                              quantity: baseToCommon(
                                transfer.quantity,
                                getDecimals({
                                  asset: getFungibleAsset(
                                    transfer.asset
                                  ) as Asset,
                                  chain: createChain(
                                    legacyAction.transaction.chain
                                  ),
                                })
                              ).toFixed(),
                              value: baseToCommon(
                                transfer.quantity,
                                getDecimals({
                                  asset: getFungibleAsset(
                                    transfer.asset
                                  ) as Asset,
                                  chain: createChain(
                                    legacyAction.transaction.chain
                                  ),
                                })
                              )
                                .multipliedBy(transfer.price || 0)
                                .toNumber(),
                              usdValue: null,
                            },
                            fungible: convertAssetToFungibleOutline(
                              getFungibleAsset(transfer.asset)
                            ),
                            nft: null,
                          })
                        ) || []),
                        ...(legacyAction.content.transfers.outgoing?.map(
                          (transfer) => ({
                            direction: 'out' as const,
                            amount: {
                              currency,
                              quantity: baseToCommon(
                                transfer.quantity,
                                getDecimals({
                                  asset: getFungibleAsset(
                                    transfer.asset
                                  ) as Asset,
                                  chain: createChain(
                                    legacyAction.transaction.chain
                                  ),
                                })
                              ).toFixed(),
                              value: baseToCommon(
                                transfer.quantity,
                                getDecimals({
                                  asset: getFungibleAsset(
                                    transfer.asset
                                  ) as Asset,
                                  chain: createChain(
                                    legacyAction.transaction.chain
                                  ),
                                })
                              )
                                .multipliedBy(transfer.price || 0)
                                .toNumber(),
                              usdValue: null,
                            },
                            fungible: convertAssetToFungibleOutline(
                              getFungibleAsset(transfer.asset)
                            ),
                            nft: null,
                          })
                        ) || []),
                      ]
                    : null,
                },
                label,
                rate: null,
                status: legacyAction.transaction.status,
                type: {
                  value: legacyAction.type.value,
                  displayValue: legacyAction.type.display_value,
                },
                transaction,
              },
            ],
            transaction,
            status: legacyAction.transaction.status,
          }
        : null,
  };
}

export function interpretTransaction({
  address,
  chain,
  transaction,
  origin,
  client = defaultClient,
  currency,
}: {
  address: string;
  chain: Chain;
  transaction: MultichainTransaction;
  origin: string;
  client?: Client;
  currency: string;
}): Promise<InterpretResponse | null> {
  return Promise.race([
    rejectAfterDelay(10000, 'interpret transaction'),
    new Promise<InterpretResponse | null>((resolve) => {
      let value: LegacyInterpretResponse | null = null;

      let normalizedEvmTx;
      if (transaction.evm) {
        normalizedEvmTx = {
          ...transaction.evm,
          maxFee: transaction.evm.maxFeePerGas,
          maxPriorityFee: transaction.evm.maxPriorityFeePerGas,
        };
        const gas = getGas(transaction.evm);
        if (gas != null) {
          normalizedEvmTx.gas = valueToHex(gas);
        }
        if (normalizedEvmTx.value != null) {
          normalizedEvmTx.value = valueToHex(normalizedEvmTx.value);
        }
      }
      const unsubscribe = client.subscribe<
        LegacyInterpretResponse,
        'interpret',
        'transaction'
      >({
        namespace: 'interpret',
        method: 'stream',
        body: {
          scope: ['transaction'],
          payload: {
            address,
            chain: chain.toString(),
            currency,
            transaction: normalizedEvmTx,
            solanaTransaction: transaction.solana,
            domain: origin,
          },
        },
        // Here we're using onMessage instead of onData because of
        // bug in defi-sdk (unsubscribe function is not always returned)
        onMessage: (event, data) => {
          if (event === 'done') {
            convertToNewInterpretation(value, address, currency).then(
              (updatedValue) => resolve(updatedValue)
            );
            unsubscribe();
            return;
          }
          value = data.payload.transaction;
        },
      });
    }),
  ]);
}

export function interpretSignature({
  address,
  chainId,
  typedData,
  client = defaultClient,
  currency,
  origin,
}: {
  address: string;
  chainId?: ChainId | null;
  typedData: TypedData;
  client?: Client;
  currency: string;
  origin: string;
}): Promise<InterpretResponse> {
  return Promise.race([
    rejectAfterDelay(10000, 'interpret signature'),
    new Promise<InterpretResponse>((resolve) => {
      let value: InterpretResponse | null = null;

      const unsubscribe = client.subscribe<
        InterpretResponse,
        'interpret',
        'signature'
      >({
        namespace: 'interpret',
        method: 'stream',
        body: {
          scope: ['signature'],
          payload: {
            address,
            chain_id: chainId,
            currency,
            typed_data: typedData,
            domain: origin,
          },
        },
        // Here we're using onMessage instead of onData because of
        // bug in defi-sdk (unsubscribe function is not always returned)
        onMessage: (event, data) => {
          if (event === 'done') {
            resolve(value as InterpretResponse);
            unsubscribe();
            return;
          }
          value = data.payload.signature;
        },
      });
    }),
  ]);
}

export function getInterpretationFunctionName(
  interpretation: InterpretResponse
) {
  return interpretation.input?.sections[0]?.blocks.find(
    ({ name }) => name === 'Function Name'
  )?.value;
}
