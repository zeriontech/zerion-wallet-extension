import React, { useCallback } from 'react';
import { useStore } from '@store-unit/react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { devMenuStore } from 'src/ui/features/dev-menu/store';

const US_TIMEZONES = new Set([
  'America/New_York',
  'America/Detroit',
  'America/Kentucky/Louisville',
  'America/Kentucky/Monticello',
  'America/Indiana/Indianapolis',
  'America/Indiana/Vincennes',
  'America/Indiana/Winamac',
  'America/Indiana/Marengo',
  'America/Indiana/Petersburg',
  'America/Indiana/Vevay',
  'America/Indiana/Tell_City',
  'America/Indiana/Knox',
  'America/Chicago',
  'America/Menominee',
  'America/North_Dakota/Center',
  'America/North_Dakota/New_Salem',
  'America/North_Dakota/Beulah',
  'America/Denver',
  'America/Boise',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Juneau',
  'America/Sitka',
  'America/Metlakatla',
  'America/Yakutat',
  'America/Nome',
  'America/Adak',
  'Pacific/Honolulu',
  'America/Puerto_Rico',
  'America/St_Thomas',
  'Pacific/Guam',
  'Pacific/Saipan',
  'Pacific/Pago_Pago',
]);

function detectUSByTimezone(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return US_TIMEZONES.has(tz);
  } catch {
    return false;
  }
}

function useUSDetection() {
  const { usDisclaimerOverride } = useStore(devMenuStore);
  if (usDisclaimerOverride === 'force-on') return { isUS: true };
  if (usDisclaimerOverride === 'force-off') return { isUS: false };
  return { isUS: detectUSByTimezone() };
}

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
        backgroundColor: 'var(--neutral-100)',
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
