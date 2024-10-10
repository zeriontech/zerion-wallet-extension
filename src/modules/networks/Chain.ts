import memoize from 'lodash/memoize';

export class Chain {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.toString();
  }
}

export const createChain = memoize((chain: string) => new Chain(chain));
