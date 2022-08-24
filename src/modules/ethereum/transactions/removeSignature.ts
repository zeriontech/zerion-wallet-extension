import omit from 'lodash/omit';

interface MaybeWithSignature {
  r?: string;
  s?: string;
  v?: number;
}

export function removeSignature<T extends MaybeWithSignature>(tx: T) {
  return omit(tx, ['r', 's', 'v']);
}
