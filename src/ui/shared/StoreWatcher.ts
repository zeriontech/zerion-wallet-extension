import type { Store } from 'store-unit';
import { useStore } from '@store-unit/react';

export function StoreWatcher<T>({
  store,
  render,
}: {
  store: Store<T>;
  render: (state: T) => React.ReactNode;
}) {
  const state = useStore(store);
  return render(state);
}
