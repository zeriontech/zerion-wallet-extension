import type { ExchangeSetReferrerAction } from './types';

export function buildSetReferrerAction({
  code,
}: {
  code: string;
}): ExchangeSetReferrerAction {
  return { type: 'setReferrer', code };
}
