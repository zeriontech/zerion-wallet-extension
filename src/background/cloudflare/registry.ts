import type { ChallengeCoordinator } from './ChallengeCoordinator';

/**
 * Kept separate from `index.ts` so that importing the ZPI background client in
 * unit tests does not pull browser APIs (and webextension-polyfill) into Node.
 */
let coordinator: ChallengeCoordinator | null = null;

export function setBackgroundChallengeCoordinator(instance: ChallengeCoordinator | null): void {
  coordinator = instance;
}

export function getBackgroundChallengeCoordinator(): ChallengeCoordinator | null {
  return coordinator;
}
