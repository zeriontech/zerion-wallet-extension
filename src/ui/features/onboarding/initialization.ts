import { getCurrentUser } from 'src/shared/getCurrentUser';
import { openOnboarding } from 'src/shared/openOnboarding';
import { setUrlContext } from 'src/shared/setUrlContext';
import { urlContext } from 'src/shared/UrlContext';
import { UrlContextParam } from 'src/shared/types/UrlContext';
import { OnboardingInterrupt } from './errors';

function getAppMode({ hasExistingUser }: { hasExistingUser: boolean }) {
  const hasOnboardingUrl = document.location.hash.startsWith('#/onboarding');
  const isPopup = urlContext.windowType === 'popup';
  return hasOnboardingUrl || (!isPopup && !hasExistingUser)
    ? 'onboarding'
    : 'wallet';
}

export async function maybeOpenOnboarding() {
  const hasExistingUser = Boolean(await getCurrentUser());
  const isPopup = urlContext.windowType === 'popup';

  if (isPopup && !hasExistingUser) {
    openOnboarding();
    throw new OnboardingInterrupt();
  }

  const appMode = getAppMode({ hasExistingUser });
  if (appMode === 'onboarding' && !isPopup) {
    // TODO: setting "appMode=onboarding" is duplicated here and in {openOnboarding}
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has(UrlContextParam.appMode)) {
      setUrlContext(searchParams, { appMode: 'onboarding' });
      window.location.search = searchParams.toString();
    }
  }
}
