import React, { useCallback, useState } from 'react';
import { usePreferences } from 'src/ui/features/preferences';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';

const REFERRER_WITH_CLAIMED_LINK_ADDRESS =
  '0x86face6bc9b386b8827adb7f84279d8474f96030';
const REFERRER_WITH_CLAIMED_LINK_ENS =
  '0xdafe50ffa1c56e36ebd4a1baf1f6785dbd0267a7';
export const REFERRER_WITH_FREE_LINK =
  '0x3c88a585f752075fb4721d14e205830c4171f22d';

export function DebugButtons() {
  const { preferences, setPreferences } = usePreferences();

  const [currentReferrer, setCurrentReferrer] = useState(() =>
    localStorage.getItem('referrer_test')
  );
  const handleReferrerChange = useCallback((value: string) => {
    setCurrentReferrer(value);
    localStorage.setItem('referrer_test', value);
  }, []);

  return (
    <VStack gap={4}>
      <Spacer height={20} />
      {preferences?.hiddenInvitationFlow ? (
        <Button onClick={() => setPreferences({ hiddenInvitationFlow: false })}>
          Return banner
        </Button>
      ) : null}
      <Button
        disabled={currentReferrer === REFERRER_WITH_FREE_LINK}
        onClick={() => handleReferrerChange(REFERRER_WITH_FREE_LINK)}
      >
        Referrer with free link
      </Button>
      <Button
        disabled={currentReferrer === REFERRER_WITH_CLAIMED_LINK_ENS}
        onClick={() => handleReferrerChange(REFERRER_WITH_CLAIMED_LINK_ENS)}
      >
        Referrer with claimed link (ens)
      </Button>
      <Button
        disabled={currentReferrer === REFERRER_WITH_CLAIMED_LINK_ADDRESS}
        onClick={() => handleReferrerChange(REFERRER_WITH_CLAIMED_LINK_ADDRESS)}
      >
        Referrer with claimed link (address)
      </Button>
    </VStack>
  );
}

// Dev section end
