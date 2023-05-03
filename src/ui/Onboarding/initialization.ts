import browser from 'webextension-polyfill';
import { FEATURE_WAITLIST_ONBOARDING } from 'src/env/config';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { getPageTemplateType } from '../shared/getPageTemplateName';
import { OnboardingInterrupt } from './errors';

const templateType = getPageTemplateType();

export async function maybeOpenOboarding() {
  const isPopup = templateType === 'popup';
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
