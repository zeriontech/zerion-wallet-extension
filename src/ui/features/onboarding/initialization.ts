import { getCurrentUser } from 'src/shared/getCurrentUser';
import { openOnboarding } from 'src/shared/openOnboarding';
import {
  UrlContextParam,
  urlContext,
  windowContext,
} from 'src/ui/shared/UrlContext';
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
    if (!searchParams.has(UrlContextParam.appMode)) {
      urlContext.set(searchParams, { appMode: 'onboarding' });
      window.location.search = searchParams.toString();
    }
  }
}
