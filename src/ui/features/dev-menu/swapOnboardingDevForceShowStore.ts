import { Store } from 'src/shared/store/store';

export const swapOnboardingDevForceShowStore = new Store<boolean>(false);

export function devForceShowSwapOnboarding() {
  swapOnboardingDevForceShowStore.setState(true);
}

export function clearSwapOnboardingDevForceShow() {
  swapOnboardingDevForceShowStore.setState(false);
}
