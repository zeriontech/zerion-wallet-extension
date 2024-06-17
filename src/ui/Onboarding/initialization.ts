import { getCurrentUser } from 'src/shared/getCurrentUser';
import { openOnboarding } from 'src/shared/openOnboarding';
import { templateData } from '../shared/getPageTemplateName';
import { OnboardingInterrupt } from './errors';

export async function maybeOpenOboarding() {
  const isPopup = templateData.windowContext === 'popup';
  const hasOnboardingUrl = document.location.hash.startsWith('#/onboarding');

  const currentUser = await getCurrentUser();
  const userHasWallets = Boolean(currentUser);
  if (isPopup && !userHasWallets) {
    const url = new URL('../popup.html', import.meta.url);
    openOnboarding(url);
    throw new OnboardingInterrupt();
  }
  const mode =
    hasOnboardingUrl || (!isPopup && !userHasWallets) ? 'onboarding' : 'wallet';
  if (mode === 'onboarding' && !isPopup) {
    // TODO: setting "context=onboarding" is duplicated here and in {openOnboarding(url)}
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has('context')) {
      searchParams.append('context', 'onboarding');
      window.location.search = searchParams.toString();
    }
  }
  return { mode } as const;
}
