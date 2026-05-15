import BigNumber from 'bignumber.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerpsRemoteConfig } from 'src/modules/hyperliquid/hooks/usePerpsRemoteConfig';
import { useHyperliquidAccountSummary } from 'src/modules/hyperliquid/hooks/useHyperliquidAccountSummary';
import { runPerpsIntent } from 'src/modules/hyperliquid/useCases';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useBackgroundKind } from 'src/ui/components/Background';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { useReceiverDisplayName } from 'src/ui/components/ReceiverAddressDialog';
import {
  KeyboardShortcut,
  ShortcutHint,
} from 'src/ui/components/KeyboardShortcut';
import { useWindowFocus } from 'src/ui/shared/useWindowFocus';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { invariant } from 'src/shared/invariant';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import * as s from './styles.module.css';

const MIN_WITHDRAW_USD = 5;
const AVATAR_SIZE = 24;
const AVATAR_RADIUS = 8;

function clampAmount(raw: string): string {
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
  const inputId = useId();

  const [amount, setAmount] = useState('');

  const {
    isLoading: isClearinghouseLoading,
    isModeReady,
    effectiveWithdrawableUSDC,
  } = useHyperliquidAccountSummary({ address }, { enabled: Boolean(address) });

  const balanceLoading = isClearinghouseLoading || !isModeReady;
  const withdrawable = useMemo(
    () => new BigNumber(effectiveWithdrawableUSDC),
    [effectiveWithdrawableUSDC]
  );

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
      // Withdrawal originates from the main perps DEX (dexIdentifier=undefined);
      // only that variant's clearinghouseState needs refreshing. Keyed
      // `[name, payload]`, so partial-match needs predicate form.
      queryClient.invalidateQueries({
        predicate: (q) => {
          const [name, payload] = q.queryKey as [
            string,
            { address?: string; dexIdentifier?: string } | undefined
          ];
          return (
            name === 'hyperliquid/clearinghouseState' &&
            payload?.address === address &&
            payload?.dexIdentifier === undefined
          );
        },
      });
      queryClient.invalidateQueries({ queryKey: ['walletPortfolio'] });
      queryClient.invalidateQueries({ queryKey: ['hyperliquidBalance'] });
    },
  });

  function handleSubmit() {
    withdrawMutation.mutate();
    navigate(-1);
  }

  function handleMax() {
    if (withdrawable.gt(0)) {
      setAmount(withdrawable.toFixed());
    }
  }

  const submitDisabled = !address || !amountValid || withdrawMutation.isLoading;

  const { preferences } = usePreferences();
  const keyboardShortcutEnabled = Boolean(
    preferences?.enableKeyboardShortcutToSign
  );
  const windowFocused = useWindowFocus();
  const shortcutActive = keyboardShortcutEnabled && !submitDisabled;

  const errorText = amountTooHigh
    ? 'Exceeds available balance'
    : amountTooLow
    ? `Minimum withdrawal is ${formatUsd(MIN_WITHDRAW_USD)}`
    : null;

  const normalizedAddress = address ? normalizeAddress(address) : null;
  const display = useReceiverDisplayName(normalizedAddress);
  const resolvedName = useMemo(() => {
    if (!normalizedAddress) return null;
    return (
      display.addressBookName ||
      display.walletName ||
      display.handle ||
      truncateAddress(normalizedAddress, 4)
    );
  }, [normalizedAddress, display]);

  const addressHead = normalizedAddress ? normalizedAddress.slice(0, -6) : '';
  const addressTail = normalizedAddress ? normalizedAddress.slice(-6) : '';

  return (
    <PageColumn>
      <NavigationTitle
        title="Withdraw"
        documentTitle="Withdraw USDC"
        elementEnd={
          address ? (
            <UnstyledLink
              style={{ placeSelf: 'center end', marginRight: 16 - 8 }}
              to="/wallet-select"
              title="Change Wallet"
            >
              <WalletAvatar
                active={false}
                address={address}
                size={24}
                borderRadius={6}
              />
            </UnstyledLink>
          ) : undefined
        }
      />
      <PageTop />
      <VStack gap={16} style={{ paddingBottom: 112 }}>
        <fieldset
          className={s.amountFieldset}
          onClick={(event) => {
            const target = event.target as Node;
            const container = event.currentTarget;
            if (
              target === container ||
              target.parentElement === container ||
              target.parentElement?.parentElement === container
            ) {
              const input = event.currentTarget.querySelector(
                `#${CSS.escape(inputId)}`
              );
              if (input && input instanceof HTMLInputElement) {
                input.focus();
              }
            }
          }}
        >
          <VStack gap={6} style={{ width: '100%' }}>
            <HStack
              gap={16}
              justifyContent="space-between"
              alignItems="center"
              style={{ width: '100%' }}
            >
              <UIText kind="small/regular" as="label" htmlFor={inputId}>
                Amount
              </UIText>
              {balanceLoading ? null : (
                <UnstyledButton
                  type="button"
                  onClick={handleMax}
                  disabled={withdrawable.lte(0)}
                  className={s.maxButton}
                >
                  Max
                </UnstyledButton>
              )}
            </HStack>
            <HStack
              gap={8}
              justifyContent="space-between"
              alignItems="center"
              style={{ width: '100%' }}
            >
              <UIText kind="headline/h3">USD</UIText>
              <UIText kind="headline/h3" style={{ minWidth: 0, flex: 1 }}>
                <UnstyledInput
                  id={inputId}
                  inputMode="decimal"
                  placeholder="0"
                  autoFocus={true}
                  value={amount}
                  onChange={(e) =>
                    setAmount(clampAmount(e.currentTarget.value))
                  }
                  className={s.amountInput}
                />
              </UIText>
            </HStack>
            <HStack
              gap={16}
              justifyContent="space-between"
              style={{ width: '100%' }}
            >
              <UIText kind="small/regular" color="var(--neutral-600)">
                {balanceLoading
                  ? 'Loading balance…'
                  : `Available ${formatUsd(withdrawable.toFixed())}`}
              </UIText>
              {errorText ? (
                <UIText kind="small/regular" className={s.error}>
                  {errorText}
                </UIText>
              ) : null}
            </HStack>
          </VStack>
        </fieldset>

        <div className={s.destinationCard}>
          {normalizedAddress ? (
            <>
              <div className={s.destinationRow}>
                <UIText
                  kind="body/regular"
                  className={s.destinationLabel}
                  color="var(--neutral-700)"
                >
                  To:
                </UIText>
                <div
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: AVATAR_RADIUS,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {display.avatarUrl ? (
                    <img
                      src={display.avatarUrl}
                      alt=""
                      width={AVATAR_SIZE}
                      height={AVATAR_SIZE}
                      style={{
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderRadius: AVATAR_RADIUS,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <BlockieImg
                      address={normalizedAddress}
                      size={AVATAR_SIZE}
                      borderRadius={AVATAR_RADIUS}
                    />
                  )}
                </div>
                <UIText kind="body/accent" className={s.destinationName}>
                  {resolvedName}
                </UIText>
              </div>
              <div style={{ height: 4 }} />
              <div
                className={s.destinationAddressRow}
                title={normalizedAddress}
              >
                <UIText
                  kind="caption/regular"
                  color="var(--neutral-500)"
                  className={s.destinationAddressHead}
                >
                  {addressHead}
                </UIText>
                <UIText
                  kind="caption/regular"
                  color="var(--neutral-500)"
                  className={s.destinationAddressTail}
                >
                  {addressTail}
                </UIText>
              </div>
            </>
          ) : (
            <UIText kind="body/regular" color="var(--neutral-500)">
              —
            </UIText>
          )}
        </div>

        <UIText kind="caption/regular" color="var(--neutral-600)">
          You will receive USDC on Arbitrum in a few minutes.
        </UIText>
      </VStack>
      <div className={s.absoluteFooter}>
        <Spacer height={16} />
        <KeyboardShortcut
          combination="mod+enter"
          onKeyDown={handleSubmit}
          disabled={!shortcutActive}
          availableDuringInputs={true}
        />
        <Button
          kind="primary"
          size={48}
          onClick={handleSubmit}
          disabled={submitDisabled}
          style={{ width: '100%' }}
        >
          <HStack gap={8} alignItems="center" justifyContent="center">
            <span>Withdraw</span>
            {shortcutActive && windowFocused ? <ShortcutHint /> : null}
          </HStack>
        </Button>
        <PageBottom />
      </div>
    </PageColumn>
  );
}
