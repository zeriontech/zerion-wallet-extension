import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import InfinityIcon from 'jsx:src/ui/assets/infinity.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import UnknownIcon from 'jsx:src/ui/assets/actionTypes/unknown.svg';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import type { Asset } from 'defi-sdk';
import BigNumber from 'bignumber.js';
import { collectData } from 'src/ui/shared/form-data';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { almostEqual, noValueDash } from 'src/ui/shared/typography';
import * as s from 'src/ui/style/helpers.module.css';
import { getBaseQuantity, getCommonQuantity } from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { Content } from 'react-area';
import { Button } from 'src/ui/ui-kit/Button';
import { AssetLink } from 'src/ui/components/AssetLink';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { isUnlimitedApproval } from 'src/ui/pages/History/isUnlimitedApproval';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UNLIMITED_APPROVAL_AMOUNT } from 'src/modules/ethereum/constants';
import { focusNode } from 'src/ui/shared/focusNode';
import { useCurrency } from 'src/modules/currency/useCurrency';

export function AllowanceForm({
  asset,
  chain,
  address,
  balance,
  requestedAllowanceQuantityBase,
  value,
  onSubmit,
  footerRenderArea,
}: {
  asset: Asset;
  chain: Chain;
  address: string;
  balance: BigNumber | null;
  requestedAllowanceQuantityBase: BigNumber;
  value: BigNumber;
  onSubmit(newValue: string): void;
  footerRenderArea?: string;
}) {
  const { currency } = useCurrency();
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

  const submitRow = (
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
  );

  return (
    <>
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
            const formData = collectData(form, {});
            const newAllowanceQuantityCommon = formData.amount as string;
            const newValue = getBaseQuantity({
              asset,
              chain,
              commonQuantity: newAllowanceQuantityCommon,
            });
            onSubmit(newValue.toFixed());
          } else {
            onSubmit(
              isRequestedAllowanceUnlimited
                ? requestedAllowanceQuantityBase.toFixed()
                : UNLIMITED_APPROVAL_AMOUNT.toFixed()
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
                      style={{ width: '100%', textAlign: 'end' }}
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
                        setAllowanceQuantityCommon(balance.toFixed());
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
                  {formatCurrencyValue(allowanceQuantityUsd, 'en', currency)}
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
      </form>
      <Spacer height={20} />
      {footerRenderArea ? (
        <Content name={footerRenderArea}>{submitRow}</Content>
      ) : (
        submitRow
      )}
    </>
  );
}
