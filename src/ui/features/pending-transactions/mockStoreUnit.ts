import { jest } from '@jest/globals';

/** store-unit ships ESM only, which jest doesn't transform; call before dynamically importing a module that creates a Store */
export function mockStoreUnit() {
  jest.unstable_mockModule('store-unit', () => ({
    Store: class Store<T> {
      private state: T;
      constructor(state: T) {
        this.state = state;
      }
      getState() {
        return this.state;
      }
      setState(next: T) {
        this.state = next;
      }
    },
  }));
}
