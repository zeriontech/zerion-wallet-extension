import React from 'react';
import { focusNode } from 'src/ui/shared/focusNode';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import WarningIcon from 'jsx:src/ui/assets/info-big.svg';
import { formatPercent } from 'src/shared/units/formatPercent';
import { getPriceImpactPercentage, type PriceImpact } from './price-impact';

export function getBlockingWarningProps(priceImpact: PriceImpact) {
  const priceImpactPercentage = getPriceImpactPercentage(priceImpact);
  if (!priceImpactPercentage || priceImpactPercentage > -50) {
    return null;
  }

  return {
    title: `This trade will result\nin ${formatPercent(
      Math.abs(priceImpactPercentage),
      'en',
      { maximumFractionDigits: 0 }
    )}% loss`,
    description:
      'This may be caused by low liquidity. Try lowering the amount to improve the rate.',
    submitText: 'Proceed Anyway',
    dismissText: 'Edit Amount',
  };
}

export function BlockingWarningOverlay({
  title,
  description,
  submitText,
  dismissText,
}: {
  title: string;
  description: string;
  submitText: string;
  dismissText: string;
}) {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
    >
      <VStack gap={16} style={{ justifyItems: 'center', paddingTop: 32 }}>
        <WarningIcon
          style={{ color: 'var(--negative-500)', width: 64, height: 64 }}
        />
        <UIText
          kind="headline/h1"
          style={{ textAlign: 'center', whiteSpace: 'pre-line' }}
        >
          {title}
        </UIText>
        <UIText
          kind="body/regular"
          style={{ textAlign: 'center', whiteSpace: 'pre-line' }}
          color="var(--neutral-700)"
        >
          {description}
        </UIText>
      </VStack>
      <Spacer height={40} />
      <VStack gap={8}>
        <Button value="cancel" kind="primary" ref={focusNode}>
          {dismissText}
        </Button>
        <Button value="confirm" kind="regular" style={{ whiteSpace: 'nowrap' }}>
          {submitText}
        </Button>
      </VStack>
    </form>
  );
}
