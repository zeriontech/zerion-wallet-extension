import type { Store } from 'src/shared/store/store';
import { useStore } from 'src/shared/store/useStore';

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
