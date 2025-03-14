import { PersistentStore } from 'src/modules/persistent-store';

export enum HideBalanceMode {
  default,
  poorMode1,
  poorMode2,
  poorMode3,
  blurred,
}

const poorModeKinds = new Set([
  HideBalanceMode.poorMode1,
  HideBalanceMode.poorMode2,
  HideBalanceMode.poorMode3,
]);

export function isPoorMode(mode: HideBalanceMode) {
  return poorModeKinds.has(mode);
}

interface State {
  mode: HideBalanceMode;
  poorModeKind: HideBalanceMode;
}

class HideBalancesStore extends PersistentStore<State> {
  MODE = HideBalanceMode;

  nextMode() {
    this.setState((state) => {
      const nextMap = {
        [HideBalanceMode.default]: state.poorModeKind,
        [HideBalanceMode.poorMode1]: HideBalanceMode.blurred,
        [HideBalanceMode.poorMode2]: HideBalanceMode.blurred,
        [HideBalanceMode.poorMode3]: HideBalanceMode.blurred,
        [HideBalanceMode.blurred]: HideBalanceMode.default,
      };
      return {
        ...state,
        mode: nextMap[state.mode],
      };
    });
  }

  nextTemporary() {
    this.setState((state) => {
      const nextMap = {
        [HideBalanceMode.default]: HideBalanceMode.poorMode1,
        [HideBalanceMode.poorMode1]: HideBalanceMode.poorMode2,
        [HideBalanceMode.poorMode2]: HideBalanceMode.poorMode3,
        [HideBalanceMode.poorMode3]: HideBalanceMode.default,
        [HideBalanceMode.blurred]: HideBalanceMode.default,
      };
      const mode = nextMap[state.mode];
      return {
        mode,
        poorModeKind: isPoorMode(mode) ? mode : state.poorModeKind,
      };
    });
  }

  setMode(mode: HideBalanceMode) {
    this.setState((state) => ({
      mode,
      poorModeKind: isPoorMode(mode) ? mode : state.poorModeKind,
    }));
  }
}

const KEY = 'hide-balances-v1';
export const hideBalancesStore = new HideBalancesStore(
  { mode: HideBalanceMode.default, poorModeKind: HideBalanceMode.poorMode1 },
  KEY
);
