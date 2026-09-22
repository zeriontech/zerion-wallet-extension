import React, { useCallback } from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { useUSDetection } from '../useDisclaimerCountry';

export function USDisclaimer() {
  const { isUS } = useUSDetection();
  const { preferences, setPreferences } = usePreferences();

  const handleDismiss = useCallback(() => {
    setPreferences({ usDisclaimerDismissed: true });
  }, [setPreferences]);

  if (!isUS || preferences?.usDisclaimerDismissed) {
    return null;
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 24,
        backgroundColor: 'var(--z-index-2)',
      }}
    >
      <VStack gap={16}>
        <VStack gap={8}>
          <UIText kind="small/accent">Disclaimer for US Residents</UIText>
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Zerion is not registered with or regulated by the Securities and
            Exchange Commission relating to its creation, offering, and/or
            operation of a Covered User Interface.
          </UIText>
        </VStack>
        <HStack gap={0}>
          <Button
            kind="primary"
            size={32}
            onClick={handleDismiss}
            style={{
              borderRadius: 12,
              backgroundColor: 'var(--always-white)',
              color: 'var(--always-black)',
              paddingInline: 16,
            }}
          >
            Got It
          </Button>
        </HStack>
      </VStack>
    </div>
  );
}
