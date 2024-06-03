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
  return { mode } as const;
}
