import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getError } from 'get-error';
import { useLocation } from 'react-router-dom';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import { useDepositQuotes } from 'src/modules/zerion-api/hooks/useDepositQuotes';
import { isNumeric } from 'src/shared/isNumeric';
import { Background } from 'src/ui/components/Background';
import { Callout } from 'src/ui/components/Callout';
import { useReadonlyReceiverGate } from 'src/ui/components/ReadonlyReceiverDialog';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { TokenAndNetworkIcon } from 'src/ui/components/TokenAndNetworkIcon';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { FLOAT_INPUT_PATTERN } from 'src/ui/shared/forms/inputs';
import { useBackTo } from 'src/ui/shared/navigation/useBackTo';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { DepositSettingsDialog } from '../DepositSettings';
import { DEPOSIT_PAGE_TOP } from '../shared/constants';
import { getCountryName } from '../shared/country';
import { DepositHeaderControls } from '../shared/DepositHeaderControls';
import { DepositSubtitle } from '../shared/DepositSubtitle';
import { FormFieldset } from '../shared/FormFieldset';
import { useApplePaySupported } from '../shared/useApplePaySupported';
import { useDepositFormState } from '../shared/useDepositFormState';
import { useDepositHandoff } from '../shared/useDepositHandoff';
import { useOutputAssetPreview } from '../shared/useOutputAssetPreview';
import { CurrencySelectDialog } from './CurrencySelectDialog';
import { DepositFormSkeleton } from './DepositFormSkeleton';
import * as styles from './styles.module.css';

const FIAT_INPUT_ID = 'deposit-fiat-amount';

function DepositFormView({ address }: { address: string }) {
  const {
    formState,
    handleChange,
    setCountryId,
    countries,
    countryIsSupported,
    isLoading: isFormStateLoading,
  } = useDepositFormState({ address });

  const { fiatValue, currency, outputFungibleId, outputChain, countryId } =
    formState;

  const { search } = useLocation();
  // Falls back to navigating when the token step isn't behind us, which is how
  // a popup reopened straight onto this form arrives
  const backToTokenStep = useBackTo({
    hashPathname: '/deposit',
    to: `/deposit${search}`,
  });
  const currencyDialog = useDialog2();
  const settingsDialog = useDialog2();

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

  const handoffMutation = useDepositHandoff({ address, formState });

  // A failed hand-off is about one specific quote, so any input that re-prices
  // makes the error stale — otherwise the callout outlives what it describes
  const resetHandoff = handoffMutation.reset;
  useEffect(() => {
    resetHandoff();
  }, [
    resetHandoff,
    currency,
    outputFungibleId,
    outputChain,
    countryId,
    fiatValue,
  ]);

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

  /**
   * The money lands on whichever address is selected, including one the user
   * merely watches. That is a legitimate way to top up a cold wallet, so this
   * warns rather than blocks — reusing the same gate the send and swap forms
   * put in front of a watch-only recipient.
   */
  const fireHandoff = useCallback(() => {
    if (selectedQuote && selectedPaymentMethod) {
      handoffMutation.mutate({
        quote: selectedQuote,
        paymentMethodId: selectedPaymentMethod.id,
      });
    }
  }, [handoffMutation, selectedQuote, selectedPaymentMethod]);
  const { guardedFire: guardedHandoff, dialog: readonlyReceiverDialog } =
    useReadonlyReceiverGate({ to: address, fire: fireHandoff });

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
    return <DepositFormSkeleton address={address} />;
  }

  return (
    <Background backgroundKind="white">
      <DepositHeaderControls
        address={address}
        onSettings={settingsDialog.openDialog}
      />
      <PageColumn>
        <Spacer height={DEPOSIT_PAGE_TOP} />
        {/* No `backTo`: the URL bar's own back button pops, which returns to
            the token step *and* keeps the flow two entries deep. Navigating
            there instead — by push or by replace — leaves a second token-step
            entry behind on every round trip, and leaving the flow then costs a
            back-click per token the user tried. */}
        <NavigationTitle title="Buy Crypto" />
        <form onSubmit={(event) => event.preventDefault()}>
          <VStack gap={16}>
            <DepositSubtitle />

            <VStack gap={0} className={styles.fieldsetSurface}>
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
              />
              {/* Same 2px rule SwapForm2 draws between its two positions */}
              <div className={styles.divider} />
              <FormFieldset
                inputId="deposit-output-amount"
                startTitle="Receive"
                endTitle={null}
                startContent={
                  <UnstyledButton
                    type="button"
                    // A button rather than a link because this goes *back* to
                    // the token step rather than onward to it — see the
                    // navigation note above the title
                    onClick={backToTokenStep}
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
                  </UnstyledButton>
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
              />
            </VStack>

            {countryId && !countryIsSupported ? (
              <Callout
                title={`No providers in ${getCountryName(countryId)}`}
                description="We have no on-ramp partner covering that country. If your card was issued somewhere else, change the country below."
              />
            ) : null}
            {!countryId ? (
              <Callout description="Tell us the country of your card or bank account so we can find providers that serve it." />
            ) : null}
            {clampedToMinimum != null && selectedQuote ? (
              <Callout
                description={`${
                  selectedQuote.provider.name
                } has a minimum of ${clampedToMinimum} ${currency?.toUpperCase()}. That is what you will be charged.`}
              />
            ) : null}
            {/* An unsupported country already explains the empty quote list */}
            {noQuotes && countryIsSupported ? (
              <Callout
                description={
                  /* Measured: SOL is unquotable at $100 in GB but fine at $200
                     in the US, and USDT-on-Solana quotes where SOL does not.
                     Amount and token are the real levers — a user's country is
                     a fact about their card, not a dial to turn. */
                  'No providers support this purchase right now. Try a different amount or token.'
                }
              />
            ) : null}
            {quotesQuery.isError ? (
              <Callout
                kind="negative"
                description={getError(quotesQuery.error).message}
              />
            ) : null}
            {handoffMutation.isError ? (
              <Callout
                kind="negative"
                title="Could not reach the provider"
                description={getError(handoffMutation.error).message}
              />
            ) : null}

            {countryIsSupported ? (
              <Button
                kind="primary"
                disabled={
                  !selectedQuote ||
                  !selectedPaymentMethod ||
                  quotesQuery.isFetching ||
                  handoffMutation.isLoading
                }
                onClick={guardedHandoff}
              >
                {handoffMutation.isLoading ? (
                  <HStack gap={8} alignItems="center">
                    <CircleSpinner color="currentColor" />
                    <span>Opening {selectedQuote?.provider.name}…</span>
                  </HStack>
                ) : selectedQuote ? (
                  `Continue with ${selectedQuote.provider.name}`
                ) : noQuotes ? (
                  'No Providers Available'
                ) : (
                  'Enter Amount'
                )}
              </Button>
            ) : (
              <Button
                kind="primary"
                type="button"
                onClick={settingsDialog.openDialog}
              >
                {countryId ? 'Change Country' : 'Select Country'}
              </Button>
            )}

            {selectedQuote ? (
              <UnstyledButton
                type="button"
                className={styles.settingsSummary}
                onClick={settingsDialog.openDialog}
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
      {readonlyReceiverDialog}
      <CurrencySelectDialog
        open={currencyDialog.open}
        onClose={currencyDialog.closeDialog}
        value={currency}
        onSelect={(code) => handleChange('currency', code)}
      />
      <DepositSettingsDialog
        open={settingsDialog.open}
        onClose={settingsDialog.closeDialog}
        countries={countries}
        countryId={countryId}
        onCountryChange={setCountryId}
        quotes={quotes}
        selectedQuote={selectedQuote}
        onProviderChange={(providerId) => {
          setUserProviderId(providerId);
          // The new provider may not accept the method chosen for the old one
          setUserPaymentMethodId(null);
        }}
        selectedPaymentMethodId={selectedPaymentMethod?.id}
        onPaymentMethodChange={setUserPaymentMethodId}
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
