import React from 'react';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import type {
  DepositQuote,
  OnrampCountry,
} from 'src/modules/zerion-api/types/DepositFlow';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CountryFlag, getCountryName } from '../shared/country';
import { CountrySelectDialog } from './CountrySelectDialog';
import { ProviderSelectDialog } from './ProviderSelectDialog';
import * as styles from './styles.module.css';

function SectionCard({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <VStack gap={8} className={styles.card}>
      <HStack
        gap={8}
        alignItems="start"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        <UIText kind="body/accent" color="var(--neutral-500)">
          {step}.
        </UIText>
        <UIText kind="body/accent">{title}</UIText>
      </HStack>
      {children}
      <UIText kind="small/regular" color="var(--neutral-500)">
        {hint}
      </UIText>
    </VStack>
  );
}

/**
 * The one place the purchase's *how* is configured, as opposed to its *what*.
 *
 * A dialog rather than a route: `size="full"` already renders full-screen in the
 * popup, so it reads as a page while leaving the provider and payment-method
 * choices as component state on the form instead of forcing them into the URL
 * just to survive a navigation.
 */
export function DepositSettingsDialog({
  open,
  onClose,
  countries,
  countryId,
  onCountryChange,
  quotes,
  selectedQuote,
  onProviderChange,
  selectedPaymentMethodId,
  onPaymentMethodChange,
}: {
  open: boolean;
  onClose: () => void;
  countries: OnrampCountry[] | null;
  countryId: string | undefined;
  onCountryChange: (countryId: string) => void;
  quotes: DepositQuote[] | null;
  selectedQuote: DepositQuote | null;
  onProviderChange: (providerId: string) => void;
  selectedPaymentMethodId: string | undefined;
  onPaymentMethodChange: (paymentMethodId: string) => void;
}) {
  const countryDialog = useDialog2();
  const providerDialog = useDialog2();

  const selectedCountry = countryId
    ? countries?.find((country) => country.id === countryId)
    : null;

  return (
    <Dialog2 open={open} onClose={onClose} title="Change Provider" size="full">
      <VStack gap={16} style={{ paddingInline: 16, paddingBottom: 24 }}>
        <SectionCard
          step={1}
          title="Country of your card or bank account"
          hint="Your country is pre-selected. Make sure to pick where your card was issued or your bank is located to avoid failed transactions — providers vary by country."
        >
          <UnstyledButton
            className={styles.selectorButton}
            onClick={countryDialog.openDialog}
          >
            {countryId ? (
              <>
                <CountryFlag code={countryId} />
                <UIText kind="body/regular">
                  {/* An unsupported country is absent from the list, but we can
                      still name it — and saying "Russia" beats saying "RU" */}
                  {selectedCountry?.name ?? getCountryName(countryId)}
                </UIText>
              </>
            ) : (
              <UIText kind="body/regular" color="var(--neutral-500)">
                Select Country
              </UIText>
            )}
            <ChevronRightIcon className={styles.selectorChevron} />
          </UnstyledButton>
        </SectionCard>

        {/* There is nothing to choose between until an amount has produced
            quotes, so this section simply isn't there yet */}
        {selectedQuote && quotes?.length ? (
          <SectionCard
            step={2}
            title="Provider & payment method"
            hint="Purchases are processed by external providers. Prices, conditions and available payment methods vary between them."
          >
            <UnstyledButton
              className={styles.selectorButton}
              onClick={providerDialog.openDialog}
            >
              <img
                alt=""
                src={selectedQuote.provider.iconUrl}
                className={styles.providerIcon}
              />
              <UIText kind="body/regular">{selectedQuote.provider.name}</UIText>
              <ChevronRightIcon className={styles.selectorChevron} />
            </UnstyledButton>
            <VStack gap={0} className={styles.methodList}>
              {selectedQuote.supportedPaymentMethods.map((method, index) => (
                <React.Fragment key={method.id}>
                  {index > 0 ? <div className={styles.methodDivider} /> : null}
                  <UnstyledButton
                    className={styles.methodRow}
                    aria-pressed={method.id === selectedPaymentMethodId}
                    onClick={() => onPaymentMethodChange(method.id)}
                  >
                    <HStack
                      gap={12}
                      alignItems="center"
                      justifyContent="space-between"
                      style={{ gridTemplateColumns: '1fr auto' }}
                    >
                      <HStack gap={12} alignItems="center">
                        <img
                          alt=""
                          src={method.iconUrl}
                          className={styles.methodIcon}
                        />
                        <UIText kind="body/regular">{method.name}</UIText>
                      </HStack>
                      {method.id === selectedPaymentMethodId ? (
                        <CheckIcon
                          style={{
                            width: 20,
                            height: 20,
                            color: 'var(--primary)',
                          }}
                        />
                      ) : null}
                    </HStack>
                  </UnstyledButton>
                </React.Fragment>
              ))}
            </VStack>
          </SectionCard>
        ) : null}
      </VStack>
      <CountrySelectDialog
        open={countryDialog.open}
        onClose={countryDialog.closeDialog}
        countries={countries ?? []}
        value={countryId}
        onSelect={onCountryChange}
      />
      <ProviderSelectDialog
        open={providerDialog.open}
        onClose={providerDialog.closeDialog}
        quotes={quotes ?? []}
        selectedProviderId={selectedQuote?.provider.id}
        countryName={selectedCountry?.name ?? null}
        onSelect={onProviderChange}
      />
    </Dialog2>
  );
}
