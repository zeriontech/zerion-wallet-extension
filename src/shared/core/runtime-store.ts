import { Store } from 'store-unit';

type State = { connected: boolean };
class RuntimeStore extends Store<State> {}

export const runtimeStore = new RuntimeStore({ connected: true });
