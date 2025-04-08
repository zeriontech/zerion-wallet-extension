import { PersistentStore } from 'src/modules/persistent-store';

type BaseLocalAction = {
  datetime: number;
};

export type SendLocalAction = {
  kind: 'send';
  recepient: string;
  chain: string;
  amount: string;
  tokenId: string;
};

export type SwapLocalAction = {
  kind: 'swap';
  chain: string;
  spendTokenId: string;
  spendInput: string;
  receiveTokenId: string;
  receiveInput: string;
};

// TODO add bridge actions when merged

export type LocalAction = SendLocalAction | SwapLocalAction;
type State = {
  version: 1;
  localActions: Record<string, LocalAction & BaseLocalAction>;
};

export class LocalActionsStore extends PersistentStore<State> {
  static getActionLink(action: LocalAction) {
    if (action.kind === 'swap') {
      const searchParams = new URLSearchParams({
        chainInput: action.chain,
        spendTokenInput: action.spendTokenId,
        spendInput: action.spendInput,
        receiveTokenInput: action.receiveTokenId,
      });
      return `/swap-form/?${searchParams.toString()}`;
    }
    if (action.kind === 'send') {
      const searchParams = new URLSearchParams({
        addressInputValue: action.recepient,
        tokenValue: action.amount,
        tokenAssetCode: action.tokenId,
      });
      return `/send-form/?${searchParams.toString()}`;
    }
    return null;
  }

  saveAction(key: string, action: LocalAction) {
    this.setState((state) => ({
      ...state,
      localActions: {
        ...state.localActions,
        [key]: {
          ...action,
          datetime: new Date().getTime(),
        },
      },
    }));
  }
}

export const localActionsStore = new LocalActionsStore(
  { version: 1, localActions: {} },
  'localActions'
);
