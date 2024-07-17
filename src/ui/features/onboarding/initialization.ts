import { getCurrentUser } from 'src/shared/getCurrentUser';
import { openOnboarding } from 'src/shared/openOnboarding';
import { UrlContextParam, urlContext } from 'src/ui/shared/UrlContext';
import { setUrlContext } from 'src/ui/shared/setUrlContext';
import { OnboardingInterrupt } from './errors';

async function getAppMode() {
  const hasOnboardingUrl = document.location.hash.startsWith('#/onboarding');
  const hasExistingUser = Boolean(await getCurrentUser());
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

  const appMode = await getAppMode();
  if (appMode === 'onboarding' && !isPopup) {
    // TODO: setting "appMode=onboarding" is duplicated here and in {openOnboarding}
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has(UrlContextParam.appMode)) {
      setUrlContext(searchParams, { appMode: 'onboarding' });
      window.location.search = searchParams.toString();
    }
  }
}
