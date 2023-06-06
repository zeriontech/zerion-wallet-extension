import browser from 'webextension-polyfill';
import { FEATURE_WAITLIST_ONBOARDING } from 'src/env/config';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { pageTemplateType } from '../shared/getPageTemplateName';
import { OnboardingInterrupt } from './errors';

export async function maybeOpenOboarding() {
  const isPopup = pageTemplateType === 'popup';
  const hasOnboardingUrl = document.location.hash.startsWith('#/onboarding');

  const currentUser = await getCurrentUser();
  const userHasWallets = Boolean(currentUser);
  if (FEATURE_WAITLIST_ONBOARDING === 'on' && isPopup && !userHasWallets) {
    const url = new URL('../popup.html', import.meta.url);
    url.searchParams.append('templateType', 'tab');
    browser.tabs.create({
      url: url.toString(),
    });
    throw new OnboardingInterrupt();
  }
  const mode =
    FEATURE_WAITLIST_ONBOARDING === 'on' &&
    (hasOnboardingUrl || (!isPopup && !userHasWallets))
      ? 'onboarding'
      : 'wallet';
  return { mode } as const;
}
