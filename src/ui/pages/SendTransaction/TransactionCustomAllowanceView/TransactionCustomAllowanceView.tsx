import React, { useCallback, useMemo, useState } from 'react';
import InfinityIcon from 'jsx:src/ui/assets/infinity.svg';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import type { AddressAction } from 'defi-sdk';
import { useAddressPositions, type Asset } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { collectData } from 'src/ui/shared/form-data';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { almostEqual, noValueDash } from 'src/ui/shared/typography';
import { invariant } from 'src/shared/invariant';
import { getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { ethers } from 'ethers';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { Content } from 'react-area';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import { NavigationBar } from '../../SignInWithEthereum/NavigationBar';

const UNLIMITED = new BigNumber(ethers.constants.MaxUint256.toString());

function parseAmount(untypedValue: unknown): BigNumber | null {
  const value = untypedValue as string;
  if (!value) {
    return null;
  } else {
    return new BigNumber(value);
  }
}

function TransactionCustomAllowanceForm({
  asset,
  balance,
  initialAllowance,
  onSubmit,
}: {
  asset: Asset;
  balance: BigNumber | null;
  initialAllowance: BigNumber;
  onSubmit(value: BigNumber): void;
}) {
  const title = asset.symbol.toUpperCase();

  const isInitialAllowanceUnlimited = initialAllowance >= UNLIMITED;
  const [amount, setAmount] = useState(initialAllowance);
  // const [amountUsd, setAmountUsd] = useState(
  //   amount.times(asset.price?.value || 0)
  // );
  const [unlimitedAmount, setUnlimitedAmount] = useState(
    isInitialAllowanceUnlimited
  );

  // const handleSetAmount = useDebouncedCallback(
  //   useCallback((value: string) => {}, [setAmount]),
  //   300
  // );
  //
  return (
    <form
      style={{
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: '1fr auto',
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.checkValidity()) {
          return;
        }
        const formData = collectData(form, { amount: parseAmount });
        const amount = formData.amount as BigNumber;
        onSubmit(amount);
      }}
    >
      <VStack gap={16}>
        <VStack gap={4}>
          <UIText kind="small/regular" color="var(--black)">
            Amount
          </UIText>
          <Media
            style={{ gridAutoColumns: 'min-content 1fr' }}
            vGap={0}
            image={
              asset.icon_url ? (
                <TokenIcon
                  size={36}
                  src={asset.icon_url}
                  symbol={asset.symbol}
                />
              ) : (
                <UnknownIcon />
              )
            }
            text={
              <HStack
                gap={16}
                style={{
                  gridAutoColumns: unlimitedAmount
                    ? 'minmax(min-content, max-content)'
                    : 'min-content 1fr',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <UIText kind="headline/h3">{title}</UIText>
                {unlimitedAmount ? (
                  <InfinityIcon
                    style={{
                      width: 24,
                      height: 24,
                      color: 'var(--neutral-500)',
                    }}
                  />
                ) : (
                  <UIText kind="headline/h3">
                    <UnstyledInput
                      type="text"
                      inputMode="numeric"
                      defaultValue={formatTokenValue(initialAllowance)}
                      placeholder="0"
                      title="Amount must be a positive number"
                      autoFocus={true}
                      pattern="(\\d+\\.)?\\d+"
                      style={{ width: '100%', textAlign: 'end' }}
                      onChange={(event) => {
                        if (event.currentTarget.validity.patternMismatch) {
                          event.currentTarget.setCustomValidity(
                            'Amount must be a positive number'
                          );
                        } else {
                          event.currentTarget.setCustomValidity('');
                          const newAmount = event.currentTarget.value;
                        }
                      }}
                    />
                  </UIText>
                )}
              </HStack>
            }
            detailText={null}
          />
          <HStack
            gap={4}
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <HStack gap={4}>
              <UIText
                kind="small/regular"
                style={{ color: 'var(--neutral-600)' }}
              >
                Balance:
              </UIText>
              <UIText
                title={balance?.toString()}
                kind="small/regular"
                style={{ color: 'var(--primary-500)' }}
              >
                {balance ? formatTokenValue(balance) : noValueDash}
              </UIText>
            </HStack>
            {unlimitedAmount ? null : (
              <UIText
                kind="small/regular"
                style={{ color: 'var(--neutral-500)', textAlign: 'end' }}
              >
                {almostEqual}$130
              </UIText>
            )}
          </HStack>
        </VStack>
        <Spacer
          style={{ borderTop: '1px solid var(--neutral-300)' }}
          height={1}
        />
        <HStack gap={4} justifyContent="space-between">
          <Media
            image={null}
            text={<UIText kind="body/accent">Unlimited Amount</UIText>}
            vGap={4}
            detailText={null}
          />
          <Toggle
            checked={unlimitedAmount}
            onChange={(event) => {
              setUnlimitedAmount(event.currentTarget.checked);
            }}
          />
        </HStack>
      </VStack>
      <Content name="send-transaction-footer">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <Button
            ref={focusNode}
            kind="regular"
            type="button"
            onClick={() => ({})}
          >
            Reset
          </Button>
          <Button>Save</Button>
        </div>
      </Content>
    </form>
  );
}

export function TransactionCustomAllowanceView({
  address,
  singleAsset,
  chain,
  requestedAllowance,
  onChange,
}: {
  address: string;
  singleAsset: NonNullable<AddressAction['content']>['single_asset'];
  asset?: Asset | null;
  chain: Chain;
  requestedAllowance?: string;
  onChange: (amount: BigNumber) => void;
}) {
  invariant(
    requestedAllowance,
    'requestedAllowance is required to set custom allowance'
  );

  const asset = getFungibleAsset(singleAsset?.asset);
  invariant(asset, 'asset is required to set custom allowance');

  const { value: positionsResponse, isLoading: positionsAreLoading } =
    useAddressPositions({
      address,
      assets: [asset.asset_code],
      currency: 'usd',
    });

  const quantity = positionsResponse?.positions?.[0]?.quantity;
  const initialAllowance = useMemo(
    () =>
      getCommonQuantity({
        asset,
        chain,
        quantity: requestedAllowance,
      }),
    [asset, chain, requestedAllowance]
  );
  const balance = useMemo(
    () =>
      quantity
        ? getCommonQuantity({
            asset,
            chain,
            quantity,
          })
        : null,
    [asset, chain, quantity]
  );

  if (positionsAreLoading) {
    return <ViewLoading kind="network" />;
  }

  return (
    <>
      <NavigationBar title="Custom Allowance" />
      <PageTop />
      <TransactionCustomAllowanceForm
        asset={asset}
        balance={balance}
        initialAllowance={initialAllowance}
        onSubmit={onChange}
      />
    </>
  );
}
