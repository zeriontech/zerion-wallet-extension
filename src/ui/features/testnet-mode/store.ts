import { Store } from 'store-unit';

interface State {
  shortcutsDisabled: boolean;
}

class TestnetModeStore extends Store<State> {
  private requests = new Set<string>();

  disable(id: string) {
    this.requests.add(id);
    if (!this.getState().shortcutsDisabled) {
      this.setState({ shortcutsDisabled: true });
    }
  }

  enable(id: string) {
    this.requests.delete(id);
    if (this.requests.size === 0 && this.getState().shortcutsDisabled) {
      this.setState({ shortcutsDisabled: false });
    }
  }
}

export const testnetModeStore = new TestnetModeStore({
  shortcutsDisabled: false,
});
