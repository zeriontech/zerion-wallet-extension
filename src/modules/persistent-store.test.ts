import { describe, expect, test, vi } from 'vitest';
import { PersistentStoreBase } from './persistent-store-base';

const delay = async () => new Promise((r) => setTimeout(r, 1000));
const delayAndCall = (fn: () => void) => async () => {
  await delay();
  return fn();
};

const retrieve = async () => null;

describe('PersistentStore', () => {
  test('new state is synchronously available', () => {
    const mockFn = vi.fn();
    const store = new PersistentStoreBase({ value: 1 }, 'key', {
      save: delayAndCall(() => mockFn()),
      retrieve,
    });
    store.setState({ value: 2 });
    expect(store.state).toStrictEqual({ value: 2 });
  });

  test('setState is async', () => {
    const mockFn = vi.fn();
    const store = new PersistentStoreBase({ value: 1 }, 'key', {
      save: delayAndCall(() => mockFn()),
      retrieve,
    });
    store.setState({ value: 3 });
    expect(mockFn).not.toHaveBeenCalled();
  });

  test('setState resolves when storage updates', async () => {
    const mockFn = vi.fn();
    const store = new PersistentStoreBase({ value: 1 }, 'key', {
      save: delayAndCall(() => mockFn()),
      retrieve,
    });
    expect(mockFn).not.toHaveBeenCalled();
    await store.setState({ value: 3 });
    expect(mockFn).toHaveBeenCalled();
  });

  test('setState crashes if storage update fails', async () => {
    const mockFn = vi.fn();
    const store = new PersistentStoreBase({ value: 1 }, 'key', {
      save: async () => {
        await delay();
        mockFn();
        throw new Error('Mocked Error');
      },
      retrieve,
    });
    expect(mockFn).not.toHaveBeenCalled();
    let didCrash = false;
    try {
      await store.setState({ value: 3 });
    } catch {
      didCrash = true;
    }
    expect(didCrash).toBe(true);
    expect(mockFn).toHaveBeenCalled();
  });
});
