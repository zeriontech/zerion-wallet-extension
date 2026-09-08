import type { NetworkInfo } from './NetworkInfo';
import fallback from './networks-fallback.json';

/**
 * Snapshot of mainnet `chain/list/v1?supportedOnly=true&includeTestnets=false`,
 * used when ZPI is unreachable. Regenerate with `npm run refresh-networks-fallback`.
 */
export const networksFallbackInfo = fallback as unknown as NetworkInfo[];
