import { data } from './dapps-list.data';
import { isFlaggedAsDapp } from './index';

export const knownDappOrigins = new Set(
  data.map((entry) => new URL(entry.url).origin)
);

export function isKnownDapp({ origin }: { origin: string }) {
  return knownDappOrigins.has(origin);
}

export const isKnownAsDapp: typeof isFlaggedAsDapp = async (params) => {
  return isKnownAsDapp(params) || isFlaggedAsDapp(params);
};
