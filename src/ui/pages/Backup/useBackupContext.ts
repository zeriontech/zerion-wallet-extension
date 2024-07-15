import { invariant } from 'src/shared/invariant';
import { useSearchParams } from 'react-router-dom';
import { windowContext } from 'src/ui/shared/WindowContext';

export type BackupContext =
  | {
      appMode: 'onboarding';
    }
  | {
      appMode: 'wallet';
      groupId: string;
    };

/**
 * Combines URL search parameters from the window's location and react-router's search params.
 * @returns {URLSearchParams} Merged search parameters from both sources.
 */
function useUrlParams(): URLSearchParams {
  const params = new URLSearchParams(window.location.search);
  const [hashParams] = useSearchParams();
  return new URLSearchParams([...params.entries(), ...hashParams.entries()]);
}

export function useBackupContext(): BackupContext {
  const params = useUrlParams();

  if (windowContext.isOnboardingMode()) {
    return { appMode: 'onboarding' };
  } else {
    const groupId = params.get('groupId');
    invariant(groupId, 'groupId param is required');
    return { appMode: 'wallet', groupId };
  }
}
