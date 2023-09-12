import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
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
import type { Asset } from 'defi-sdk';
import { useAddressPositions } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { collectData } from 'src/ui/shared/form-data';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { almostEqual, noValueDash } from 'src/ui/shared/typography';
import { invariant } from 'src/shared/invariant';
import * as s from 'src/ui/style/helpers.module.css';
import { getBaseQuantity, getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { Content } from 'react-area';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { AssetLink } from 'src/ui/components/AssetLink';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import {
  UNLIMITED_APPROVAL_AMOUNT,
  isUnlimitedApproval,
} from 'src/ui/pages/History/isUnlimitedApproval';
import { NavigationBar } from 'src/ui/pages/SignInWithEthereum/NavigationBar';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';

function parseAmount(untypedValue: unknown): BigNumber | null {
  const value = untypedValue as string;
  if (!value) {
    return null;
  } else {
    return new BigNumber(value);
  }
}

function CustomAllowanceForm({
  asset,
  chain,
  address,
  balance,
  requestedAllowanceQuantityBase,
  value,
  onSubmit,
}: {
  asset: Asset;
  chain: Chain;
  address: string;
  balance: BigNumber | null;
  requestedAllowanceQuantityBase: BigNumber;
  value: BigNumber;
  onSubmit(newValue: BigNumber): void;
}) {
  const isRequestedAllowanceUnlimited = isUnlimitedApproval(
    requestedAllowanceQuantityBase
  );
  const isCurrentAllowanceUnlimited = isUnlimitedApproval(value);
  const [isAllowanceUnlimited, setIsAllowanceUnlimited] = useState(
    isCurrentAllowanceUnlimited
  );
  const initialAllowanceQuantityCommon = useMemo(
    () =>
      getCommonQuantity({
        asset,
        chain,
        baseQuantity: requestedAllowanceQuantityBase,
      }),
    [asset, chain, requestedAllowanceQuantityBase]
  );
  const currentAllowanceQuantityCommon = useMemo(
    () =>
      isCurrentAllowanceUnlimited
        ? null
        : getCommonQuantity({
            asset,
            chain,
            baseQuantity: value.toString(),
          }),
    [asset, chain, value, isCurrentAllowanceUnlimited]
  );

  const assetPrice = asset.price?.value;
  const currentAllowanceQuantityUsd =
    assetPrice && currentAllowanceQuantityCommon
      ? currentAllowanceQuantityCommon.times(assetPrice)
      : null;

  const [allowanceQuantityUsd, setAllowanceQuantityUsd] = useState(
    currentAllowanceQuantityUsd
  );
  const allowanceQuantityCommonRef = useRef<HTMLInputElement | null>(null);

  const updateAllowanceQuantityUsd = useCallback(
    (value: string | null) => {
      if (value && assetPrice) {
        const newAllowanceQuantityUsd = new BigNumber(value).times(assetPrice);
        setAllowanceQuantityUsd(newAllowanceQuantityUsd);
      } else {
        setAllowanceQuantityUsd(null);
      }
    },
    [setAllowanceQuantityUsd, assetPrice]
  );

  const setAllowanceQuantityCommon = useCallback(
    (value: string | null) => {
      if (allowanceQuantityCommonRef?.current) {
        allowanceQuantityCommonRef.current.value = value || '';
      }
      updateAllowanceQuantityUsd(value);
    },
    [updateAllowanceQuantityUsd]
  );

  const handleReset = () => {
    setIsAllowanceUnlimited(isRequestedAllowanceUnlimited);
    setAllowanceQuantityCommon(
      isRequestedAllowanceUnlimited
        ? null
        : initialAllowanceQuantityCommon.toFixed()
    );
  };

  const id = useId();

  return (
    <form
      id={id}
      style={{
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: '1fr auto',
      }}
      onSubmit={(event) => {
        event.preventDefault();

        if (!isAllowanceUnlimited) {
          const form = event.currentTarget;
          if (!form.checkValidity()) {
            return;
          }
          const formData = collectData(form, { amount: parseAmount });
          const newAllowanceQuantityCommon = formData.amount as BigNumber;
          const newValue = getBaseQuantity({
            asset,
            chain,
            commonQuantity: newAllowanceQuantityCommon,
          });
          onSubmit(newValue);
        } else {
          onSubmit(
            isRequestedAllowanceUnlimited
              ? requestedAllowanceQuantityBase
              : UNLIMITED_APPROVAL_AMOUNT
          );
        }
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
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <UIText kind="headline/h3">
                  <AssetLink asset={asset} address={address} />
                </UIText>
                {isAllowanceUnlimited ? (
                  <InfinityIcon
                    style={{
                      width: 24,
                      height: 24,
                      color: 'var(--neutral-500)',
                    }}
                  />
                ) : null}
                <UIText
                  kind="headline/h3"
                  style={{
                    display: isAllowanceUnlimited ? 'none' : 'initial',
                  }}
                >
                  <UnstyledInput
                    ref={allowanceQuantityCommonRef}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    name="amount"
                    style={{ textAlign: 'end' }}
                    required={!isAllowanceUnlimited}
                    pattern="^(\d+\.)?\d+"
                    defaultValue={currentAllowanceQuantityCommon?.toFixed()}
                    onInvalid={(event) => {
                      if (event.currentTarget.validity.patternMismatch) {
                        event.currentTarget.setCustomValidity(
                          'Amount must be a positive number'
                        );
                      } else if (event.currentTarget.validity.valueMissing) {
                        event.currentTarget.setCustomValidity(
                          'Amount is required'
                        );
                      }
                    }}
                    onInput={(event) => {
                      event.currentTarget.setCustomValidity('');
                      if (event.currentTarget.validity.valid) {
                        updateAllowanceQuantityUsd(event.currentTarget.value);
                      } else {
                        setAllowanceQuantityUsd(null);
                      }
                    }}
                  />
                </UIText>
              </HStack>
            }
            detailText={null}
          />
          <HStack
            gap={12}
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              gridAutoColumns: 'max-content auto',
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
                {balance ? (
                  <UnstyledButton
                    type="button"
                    onClick={() => {
                      setIsAllowanceUnlimited(false);
                      setAllowanceQuantityCommon(balance.toString());
                    }}
                  >
                    <UIText
                      className={s.hoverUnderline}
                      kind="small/regular"
                      color="var(--primary-500)"
                    >
                      {formatTokenValue(balance)}
                    </UIText>
                  </UnstyledButton>
                ) : (
                  noValueDash
                )}
              </UIText>
            </HStack>
            {isAllowanceUnlimited || allowanceQuantityUsd == null ? null : (
              <UIText
                kind="small/regular"
                style={{
                  color: 'var(--neutral-500)',
                  textAlign: 'end',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {almostEqual}
                {formatCurrencyValue(allowanceQuantityUsd, 'en', 'usd')}
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
            checked={isAllowanceUnlimited}
            onChange={(event) => {
              setIsAllowanceUnlimited(event.currentTarget.checked);
              if (event.currentTarget.checked) {
                allowanceQuantityCommonRef?.current?.setCustomValidity('');
              }
            }}
          />
        </HStack>
      </VStack>
      <Content name="sign-transaction-footer">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <Button ref={focusNode} kind="regular" onClick={handleReset}>
            Reset
          </Button>
          <Button kind="primary" form={id}>
            Save
          </Button>
        </div>
      </Content>
    </form>
  );
}

export function CustomAllowanceView({
  address,
  chain,
  asset,
  value,
  requestedAllowanceQuantityBase,
  onChange,
}: {
  address: string;
  chain: Chain;
  asset?: Asset | null;
  value: string;
  requestedAllowanceQuantityBase?: string;
  onChange: (value: BigNumber) => void;
}) {
  invariant(
    requestedAllowanceQuantityBase,
    'requestedAllowanceQuantityBase is required to set custom allowance'
  );

  const { value: positionsResponse, isLoading: arePositionsLoading } =
    useAddressPositions(
      {
        address,
        assets: asset ? [asset?.asset_code] : [],
        currency: 'usd',
      },
      { enabled: Boolean(asset) }
    );

  const positions = positionsResponse?.positions;
  const positionsFiltered = useMemo(
    () => positions?.filter((position) => position.chain === chain.toString()),
    [chain, positions]
  );
  const positionQuantity = positionsFiltered?.[0]?.quantity;
  const balance = useMemo(
    () =>
      positionQuantity && asset
        ? getCommonQuantity({
            asset,
            chain,
            baseQuantity: positionQuantity,
          })
        : null,
    [asset, chain, positionQuantity]
  );

  if (arePositionsLoading || !asset) {
    return <ViewLoading kind="network" />;
  }

  return (
    <>
      <NavigationBar title="Custom Allowance" />
      <PageTop />
      <CustomAllowanceForm
        asset={asset}
        chain={chain}
        address={address}
        balance={balance}
        requestedAllowanceQuantityBase={
          new BigNumber(requestedAllowanceQuantityBase)
        }
        value={new BigNumber(value || requestedAllowanceQuantityBase)}
        onSubmit={onChange}
      />
    </>
  );
}
