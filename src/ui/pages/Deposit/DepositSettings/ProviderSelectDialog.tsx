import React from 'react';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import type { DepositQuote } from 'src/modules/zerion-api/types/DepositFlow';
import { roundTokenValue } from 'src/shared/units/formatTokenValue';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

/**
 * The payment methods a provider accepts, as a strip of its own logos. Names
 * (Visa, SEPA, Apple Pay) are longer than the strip has room for, so they move
 * to the group's accessible label.
 */
function PaymentMethodStrip({
  methods,
}: {
  methods: DepositQuote['supportedPaymentMethods'];
}) {
  return (
    <div
      className={styles.methodStrip}
      aria-label={`Accepts ${methods.map((method) => method.name).join(', ')}`}
    >
      {methods.map((method) => (
        <div key={method.id} className={styles.methodChip}>
          <img alt="" src={method.iconUrl} title={method.name} />
        </div>
      ))}
    </div>
  );
}

export function ProviderSelectDialog({
  open,
  onClose,
  quotes,
  selectedProviderId,
  countryName,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  quotes: DepositQuote[];
  selectedProviderId: string | undefined;
  countryName: string | null;
  onSelect: (providerId: string) => void;
}) {
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title="Provider"
      size="full"
      autoFocusInput={false}
    >
      <VStack gap={12} style={{ paddingInline: 16, paddingBottom: 24 }}>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {countryName
            ? `Providers operating in ${countryName}. `
            : 'Providers operating in your country. '}
          Rates and payment methods differ between them.
        </UIText>
        <VStack gap={8}>
          {quotes.map((quote) => {
            const isSelected = quote.provider.id === selectedProviderId;
            return (
              <UnstyledButton
                key={quote.provider.id}
                className={styles.providerRow}
                aria-pressed={isSelected}
                onClick={() => {
                  onSelect(quote.provider.id);
                  onClose();
                }}
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
                      src={quote.provider.iconUrl}
                      className={styles.providerIcon}
                    />
                    <VStack gap={4}>
                      <UIText kind="body/accent">{quote.provider.name}</UIText>
                      <PaymentMethodStrip
                        methods={quote.supportedPaymentMethods}
                      />
                    </VStack>
                  </HStack>
                  <HStack gap={8} alignItems="center">
                    <VStack gap={0} style={{ textAlign: 'right' }}>
                      <UIText kind="body/accent">{quote.asset.symbol}</UIText>
                      <UIText
                        kind="small/regular"
                        color="var(--neutral-500)"
                        title={quote.amount.quantity}
                      >
                        ≈{roundTokenValue(quote.amount.quantity)}
                      </UIText>
                    </VStack>
                    {isSelected ? (
                      <CheckIcon
                        style={{
                          width: 20,
                          height: 20,
                          color: 'var(--primary)',
                        }}
                      />
                    ) : null}
                  </HStack>
                </HStack>
              </UnstyledButton>
            );
          })}
        </VStack>
      </VStack>
    </Dialog2>
  );
}
