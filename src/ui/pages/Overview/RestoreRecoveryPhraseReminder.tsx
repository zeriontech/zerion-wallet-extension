import { useEffect } from 'react';
import { usePreferences } from 'src/ui/features/preferences';
import { emitter } from 'src/ui/shared/events';
import { useAffectedByPasswordChangeBug } from 'src/ui/shared/requests/useAffectedByPasswordChangeBug';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function RestoreRecoveryPhraseReminder() {
  const { isAffected, isLoading } = useAffectedByPasswordChangeBug();
  const { preferences, setPreferences } = usePreferences();

  const shouldShow =
    isAffected &&
    !isLoading &&
    preferences &&
    !preferences.restoreRecoveryPhraseSuccess &&
    Date.now() -
      (preferences.restoreRecoveryPhraseReminderDismissedTime ?? 0) >=
      ONE_DAY;

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    setPreferences({ restoreRecoveryPhraseReminderDismissedTime: Date.now() });
    emitter.emit('mnemonicRestorationNeeded');
  }, [shouldShow, setPreferences]);

  return null;
}
