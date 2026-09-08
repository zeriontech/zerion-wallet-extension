import type { Account } from './account/Account';

/**
 * Leaf module on purpose: low-level services (e.g. the ZerionAPI background
 * client) read the current account from here without importing the
 * composition root in `initialize.ts`, which would create an import cycle.
 */
export const ServiceLocator: { account?: Account } = {};
