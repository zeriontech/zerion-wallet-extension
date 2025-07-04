import { emitter } from 'src/background/events';
import { PersistentStore } from 'src/modules/persistent-store';

interface State {
  installedEvent: null | number;
  firstUiOpenEvent: null | number;
}

/**
 * This store tracks the first time user opens the UI.
 * It's supposed to work for new users only
 * (those who install the extension after this store is created)
 * For all existing users the {'runtime:installed'} should never fire,
 * and therefore the {firstUiOpenEvent} property will never be set.
 */
class UserLifecycleStore extends PersistentStore<State> {
  static initialState: State = { installedEvent: null, firstUiOpenEvent: null };

  constructor(
    initialState = UserLifecycleStore.initialState,
    key = 'userLifecycle'
  ) {
    super(initialState, key);

    emitter.on('analyticsIdSet', async () => {
      await this.ready();
      this.setState((state) => {
        if (state.installedEvent == null) {
          return state;
        }
        if (state.firstUiOpenEvent) {
          return state;
        }
        return { ...state, firstUiOpenEvent: Date.now() };
      });
    });
  }

  async handleRuntimeInstalledEvent() {
    await this.ready();
    this.setState((state) => ({ ...state, installedEvent: Date.now() }));
  }
}

export const userLifecycleStore = new UserLifecycleStore();

userLifecycleStore.on('change', (newState, prevState) => {
  if (newState.firstUiOpenEvent && !prevState.firstUiOpenEvent) {
    emitter.emit('firstScreenView', newState.firstUiOpenEvent);
  }
});
