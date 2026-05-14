import BigNumber from 'bignumber.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerpsRemoteConfig } from 'src/modules/hyperliquid/hooks/usePerpsRemoteConfig';
import { useClearinghouseState } from 'src/modules/hyperliquid/hooks/useClearinghouseState';
import { runPerpsIntent } from 'src/modules/hyperliquid/useCases';
import { showSuccessToast } from 'src/ui/components/SuccessToast';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageTop } from 'src/ui/components/PageTop';
import { useBackgroundKind } from 'src/ui/components/Background';
import { invariant } from 'src/shared/invariant';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from './styles.module.css';

const MIN_WITHDRAW_USD = 5;

function clampAmount(raw: string): string {
  // Only digits and a single decimal point.
  const sanitized = raw.replace(/[^0-9.]/g, '');
  const firstDot = sanitized.indexOf('.');
  if (firstDot === -1) return sanitized;
  return (
    sanitized.slice(0, firstDot + 1) +
    sanitized.slice(firstDot + 1).replace(/\./g, '')
  );
}

function formatUsd(value: string | number): string {
  const n = Number(value);
  if (!isFinite(n)) return '$0.00';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseAmount(value: string): BigNumber {
  if (!value) return new BigNumber(0);
  const bn = new BigNumber(value);
  return bn.isFinite() ? bn : new BigNumber(0);
}

export function PerpsWithdraw() {
  useBackgroundKind({ kind: 'white' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { singleAddress: address } = useAddressParams();

  const [amount, setAmount] = useState('');

  const { data: clearingState, isLoading: balanceLoading } =
    useClearinghouseState({ address }, { enabled: Boolean(address) });

  const withdrawable = useMemo(() => {
    const raw = clearingState?.withdrawable ?? '0';
    return new BigNumber(raw);
  }, [clearingState]);

  const { data: config } = usePerpsRemoteConfig();

  const amountBn = parseAmount(amount);
  const amountTooLow = amount !== '' && amountBn.lt(MIN_WITHDRAW_USD);
  const amountTooHigh = amountBn.gt(withdrawable);
  const amountValid =
    amount !== '' && amountBn.gt(0) && !amountTooLow && !amountTooHigh;

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      invariant(address, 'Wallet address is required');
      invariant(amountValid, 'Amount is not valid');
      await runPerpsIntent({
        intent: {
          kind: 'withdraw',
          amount: amountBn.toFixed(),
          destination: address,
          successText: 'Withdrawal submitted',
        },
        context: {
          address,
          builder: config?.builderAddress ?? '',
          requiredMaxBuilderFee: config?.builderFee ?? 0,
          referralCode: config?.referralCode ?? '',
        },
      });
    },
    onSuccess: () => {
      showSuccessToast({
        text: 'Withdrawal submitted',
        subtitle: 'Funds may take a few minutes to settle',
      });
      queryClient.invalidateQueries({
        queryKey: ['hyperliquid/clearinghouseState'],
      });
      queryClient.invalidateQueries({ queryKey: ['walletPortfolio'] });
      queryClient.invalidateQueries({ queryKey: ['hyperliquidBalance'] });
    },
  });

  function handleSubmit() {
    // Kick off the orchestrator (which mounts a toaster) and immediately
    // navigate the user back — they can leave the page while signing
    // continues in the background.
    withdrawMutation.mutate();
    navigate(-1);
  }

  function handleMax() {
    if (withdrawable.gt(0)) {
      setAmount(withdrawable.toFixed());
    }
  }

  const submitDisabled = !address || !amountValid || withdrawMutation.isLoading;

  const errorText = amountTooHigh
    ? 'Exceeds available balance'
    : amountTooLow
    ? `Minimum withdrawal is ${formatUsd(MIN_WITHDRAW_USD)}`
    : null;

  return (
    <PageColumn>
      <NavigationTitle title="Withdraw" documentTitle="Withdraw USDC" />
      <PageTop />
      <VStack gap={16}>
        <FormFieldset
          title="Amount"
          endTitle={
            balanceLoading ? null : (
              <UnstyledButton
                type="button"
                onClick={handleMax}
                disabled={withdrawable.lte(0)}
                className={s.maxButton}
              >
                Max
              </UnstyledButton>
            )
          }
          startInput={
            <UnstyledInput
              inputMode="decimal"
              placeholder="0"
              autoFocus={true}
              value={amount}
              onChange={(e) => setAmount(clampAmount(e.currentTarget.value))}
              className={s.amountInput}
            />
          }
          endInput={<span className={s.usdLabel}>USDC</span>}
          startDescription={
            balanceLoading
              ? 'Loading balance…'
              : `Available ${formatUsd(withdrawable.toFixed())}`
          }
          endDescription={
            errorText ? <span className={s.error}>{errorText}</span> : null
          }
          inputSelector={`.${s.amountInput}`}
        />

        <div className={s.destinationCard}>
          <VStack gap={4}>
            <UIText kind="small/regular" color="var(--neutral-600)">
              Destination
            </UIText>
            <HStack gap={8} alignItems="center" justifyContent="space-between">
              <UIText kind="body/accent">
                {address ? truncateAddress(address, 6) : '—'}
              </UIText>
              <UIText kind="small/regular" color="var(--neutral-600)">
                on Arbitrum
              </UIText>
            </HStack>
          </VStack>
        </div>

        <UIText kind="caption/regular" color="var(--neutral-600)">
          Withdrawals from Hyperliquid to Arbitrum can take a few minutes to
          settle.
        </UIText>
      </VStack>

      <Spacer height={24} />

      <PageStickyFooter>
        <Spacer height={16} />
        <Button
          kind="primary"
          size={48}
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          Withdraw
        </Button>
        <PageBottom />
      </PageStickyFooter>
    </PageColumn>
  );
}
