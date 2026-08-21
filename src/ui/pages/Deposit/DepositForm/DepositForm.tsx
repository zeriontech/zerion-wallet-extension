import React, { useEffect, useMemo, useState } from 'react';
import { getError } from 'get-error';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import SettingsIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import { CURRENCIES } from 'src/modules/currency/currencies';
import { useDepositQuotes } from 'src/modules/zerion-api/hooks/useDepositQuotes';
import { isNumeric } from 'src/shared/isNumeric';
import { Background } from 'src/ui/components/Background';
import { Callout } from 'src/ui/components/Callout';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { TokenAndNetworkIcon } from 'src/ui/components/TokenAndNetworkIcon';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { FormFieldset } from '../shared/FormFieldset';
import { useApplePaySupported } from '../shared/useApplePaySupported';
import { useDepositFormState } from '../shared/useDepositFormState';
import { useOutputAssetPreview } from '../shared/useOutputAssetPreview';
import { CurrencySelectDialog } from './CurrencySelectDialog';
import { DepositFormSkeleton } from './DepositFormSkeleton';
import * as styles from './styles.module.css';

const FIAT_INPUT_ID = 'deposit-fiat-amount';

function DepositFormView({ address }: { address: string }) {
  const {
    formState,
    handleChange,
    countryIsSupported,
    isLoading: isFormStateLoading,
  } = useDepositFormState({ address });

  const { fiatValue, currency, outputFungibleId, outputChain, countryId } =
    formState;

  const currencyDialog = useDialog2();

  // Resolved before the quote is requested so the answer is part of its query
  // key rather than an invisible dependency of it
  const applePayQuery = useApplePaySupported();

  const hasValidAmount = Boolean(
    fiatValue && isNumeric(fiatValue) && Number(fiatValue) > 0
  );

  const quotesQuery = useDepositQuotes(
    {
      address,
      countryId: countryId ?? '',
      currency: currency ?? '',
      assetId: outputFungibleId ?? '',
      chainId: outputChain ?? '',
      fiatAmount: fiatValue ?? '',
      supportsApplePay: applePayQuery.data === true,
    },
    {
      enabled: Boolean(
        countryId &&
          currency &&
          outputFungibleId &&
          outputChain &&
          hasValidAmount &&
          // Don't fire before the probe settles, or the first request would go
          // out with the wrong flag and immediately be superseded
          !applePayQuery.isLoading
      ),
    }
  );

  // Provider and payment method are chosen against a specific quote list, so a
  // change to any input that re-prices invalidates the choice
  const [userProviderId, setUserProviderId] = useState<string | null>(null);
  const [userPaymentMethodId, setUserPaymentMethodId] = useState<string | null>(
    null
  );
  useEffect(() => {
    setUserProviderId(null);
    setUserPaymentMethodId(null);
  }, [currency, outputFungibleId, outputChain, countryId]);

  const quotes = quotesQuery.data?.data.quotes ?? null;

  const selectedQuote = useMemo(() => {
    if (!quotes) {
      return null;
    }
    const userQuote = quotes.find(
      (quote) => quote.provider.id === userProviderId
    );
    return userQuote ?? quotes.at(0) ?? null;
  }, [quotes, userProviderId]);

  const selectedPaymentMethod = useMemo(() => {
    const methods = selectedQuote?.supportedPaymentMethods;
    const userMethod = methods?.find(
      (method) => method.id === userPaymentMethodId
    );
    return userMethod ?? methods?.at(0) ?? null;
  }, [selectedQuote, userPaymentMethodId]);

  const outputPreview = useOutputAssetPreview({
    address,
    outputFungibleId,
    outputChain,
    quote: selectedQuote,
  });

  const noQuotes = quotesQuery.isSuccess && quotes?.length === 0;

  /**
   * Providers do not refuse an amount below their minimum — they quote the
   * minimum instead. So typing "1" comes back priced at $24 worth of ETH, and
   * without saying so the form looks like it is lying about the exchange rate.
   */
  const clampedToMinimum = useMemo(() => {
    const quotedValue = selectedQuote?.amount.value;
    if (quotedValue == null || !fiatValue || !isNumeric(fiatValue)) {
      return null;
    }
    const requested = Number(fiatValue);
    // A cent of slack: these are floats coming back from a pricing service
    return quotedValue - requested > 0.01 ? quotedValue : null;
  }, [selectedQuote, fiatValue]);

  if (isFormStateLoading) {
    return <DepositFormSkeleton />;
  }

  const currencyConfig = currency ? CURRENCIES[currency] : undefined;

  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title="Buy Crypto" backTo="/deposit" />
        <form onSubmit={(event) => event.preventDefault()}>
          <VStack gap={16}>
            <HStack
              gap={12}
              alignItems="start"
              justifyContent="space-between"
              style={{ gridTemplateColumns: '1fr auto' }}
            >
              <UIText kind="body/accent">
                Use credit/debit card, or bank transfer to buy crypto
              </UIText>
              <Button
                type="button"
                kind="ghost"
                size={32}
                title="Change provider"
                aria-label="Change provider"
                onClick={() => {
                  // Wired up in the settings slice
                }}
              >
                <SettingsIcon
                  style={{ display: 'block', width: 20, height: 20 }}
                />
              </Button>
            </HStack>

            <VStack gap={4} className={styles.fieldsetSurface}>
              <FormFieldset
                inputId={FIAT_INPUT_ID}
                startTitle="Pay with"
                endTitle={null}
                startContent={
                  <UnstyledButton
                    type="button"
                    className={styles.currencyButton}
                    onClick={currencyDialog.openDialog}
                  >
                    <UIText kind="headline/h3">
                      {currency?.toUpperCase()}
                    </UIText>
                    <ChevronDownIcon className={styles.chevron} />
                  </UnstyledButton>
                }
                endContent={
                  <DebouncedInput
                    delay={300}
                    value={fiatValue ?? ''}
                    onChange={(value) => handleChange('fiatValue', value)}
                    render={({ value, handleChange: onInputChange }) => (
                      <input
                        id={FIAT_INPUT_ID}
                        name="fiatValue"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoFocus={true}
                        // An unsupported country cannot be quoted at any amount,
                        // so there is nothing useful to type
                        disabled={!countryIsSupported}
                        pattern={FLOAT_INPUT_PATTERN}
                        placeholder="0"
                        className={styles.amountInput}
                        value={value}
                        onChange={(event) =>
                          onInputChange(event.target.value.replace(',', '.'))
                        }
                      />
                    )}
                  />
                }
                startDescription={
                  currencyConfig ? currencyConfig.name : <span />
                }
                endDescription={<span />}
              />
              <FormFieldset
                inputId="deposit-output-amount"
                startTitle="Receive"
                endTitle={null}
                startContent={
                  <UnstyledLink
                    to="/deposit"
                    className={styles.currencyButton}
                    title="Change token"
                  >
                    {outputPreview ? (
                      <HStack gap={8} alignItems="center">
                        <TokenAndNetworkIcon
                          size={32}
                          symbol={outputPreview.symbol}
                          iconUrl={outputPreview.iconUrl}
                          networkIconUrl={outputPreview.chainIconUrl}
                          networkName={outputPreview.chainName}
                          networkIconSize={16}
                          networkIconBorderRadius={6}
                        />
                        <UIText kind="headline/h3">
                          {outputPreview.symbol}
                        </UIText>
                      </HStack>
                    ) : (
                      <HStack gap={8} alignItems="center">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'var(--neutral-300)',
                          }}
                        />
                        <UIText kind="headline/h3" color="var(--neutral-500)">
                          Select
                        </UIText>
                      </HStack>
                    )}
                    <ChevronDownIcon className={styles.chevron} />
                  </UnstyledLink>
                }
                endContent={
                  <input
                    id="deposit-output-amount"
                    name="outputValue"
                    readOnly={true}
                    placeholder="0"
                    className={styles.amountInput}
                    title={selectedQuote?.amount.quantity}
                    // Not run through formatTokenValue: it caps at two
                    // significant digits under 0.1, turning 0.079438 ETH into
                    // "0.08" — too lossy for the amount you are buying
                    value={selectedQuote?.amount.quantity ?? ''}
                  />
                }
                startDescription={
                  outputPreview ? `on ${outputPreview.chainName}` : <span />
                }
                endDescription={<span />}
              />
            </VStack>

            {clampedToMinimum != null && selectedQuote ? (
              <Callout
                description={`${
                  selectedQuote.provider.name
                } has a minimum of ${clampedToMinimum} ${currency?.toUpperCase()}. That is what you will be charged.`}
              />
            ) : null}
            {noQuotes ? (
              <Callout description="No providers support this purchase. Try a different amount or currency." />
            ) : null}
            {quotesQuery.isError ? (
              <Callout
                kind="negative"
                description={getError(quotesQuery.error).message}
              />
            ) : null}

            <Button
              kind="primary"
              disabled={
                !countryIsSupported || !selectedQuote || quotesQuery.isFetching
              }
              onClick={() => {
                // Wired up in the hand-off slice
              }}
            >
              {selectedQuote
                ? `Continue with ${selectedQuote.provider.name}`
                : !countryIsSupported
                ? 'Change country settings'
                : noQuotes
                ? 'No Providers Available'
                : 'Enter Amount'}
            </Button>

            {selectedQuote ? (
              <UnstyledButton
                type="button"
                className={styles.settingsSummary}
                onClick={() => {
                  // Wired up in the settings slice
                }}
              >
                <HStack gap={8} alignItems="center" justifyContent="center">
                  <UIText
                    kind="body/regular"
                    className={styles.settingsSummaryLabel}
                  >
                    {selectedPaymentMethod?.name ?? 'Buy'} via{' '}
                    {selectedQuote.provider.name}
                  </UIText>
                  <ChevronDownIcon
                    className={styles.chevron}
                    style={{ transform: 'rotate(-90deg)' }}
                  />
                </HStack>
              </UnstyledButton>
            ) : null}
          </VStack>
        </form>
        <Spacer height={16} />
        <PageBottom />
      </PageColumn>
      <CurrencySelectDialog
        open={currencyDialog.open}
        onClose={currencyDialog.closeDialog}
        value={currency}
        onSelect={(code) => handleChange('currency', code)}
      />
    </Background>
  );
}

export function DepositForm() {
  const { singleAddress } = useAddressParams();
  if (!singleAddress) {
    return <DepositFormSkeleton />;
  }
  return <DepositFormView address={singleAddress} />;
}
