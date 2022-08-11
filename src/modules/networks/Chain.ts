import memoize from 'lodash/memoize';

export class Chain {
  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export const createChain = memoize((chain: string) => new Chain(chain));
