import { getCurrentUser } from 'src/shared/getCurrentUser';
import { openOnboarding } from 'src/shared/openOnboarding';
import { windowContext } from 'src/ui/shared/WindowContext';
import { WindowParam, setAppMode } from 'src/ui/shared/WindowParam';
import { OnboardingInterrupt } from './errors';

async function getAppMode() {
  const hasOnboardingUrl = document.location.hash.startsWith('#/onboarding');
  const hasExistingUser = Boolean(await getCurrentUser());
  return hasOnboardingUrl || (!windowContext.isPopup() && !hasExistingUser)
    ? 'onboarding'
    : 'wallet';
}

export async function maybeOpenOnboarding() {
  const hasExistingUser = Boolean(await getCurrentUser());

  if (windowContext.isPopup() && !hasExistingUser) {
    openOnboarding();
    throw new OnboardingInterrupt();
  }

  const appMode = await getAppMode();
  if (appMode === 'onboarding' && !windowContext.isPopup()) {
    // TODO: setting "appMode=onboarding" is duplicated here and in {openOnboarding}
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has(WindowParam.appMode)) {
      setAppMode(searchParams, 'onboarding');
      window.location.search = searchParams.toString();
    }
  }
}
