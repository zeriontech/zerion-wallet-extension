import { createNanoEvents } from 'nanoevents';
import { getError } from 'src/shared/errors/getError';
import type { ButtonClickedParams } from 'src/shared/types/button-events';

type EthersSignMethod = 'sendTransaction' | '_signTypedData' | 'signMessage';

export const emitter = createNanoEvents<{
  uiAccountsChanged: () => void;
  hotkeydown: (combination: string) => void;
  sessionLogout: () => void;
  error: (error: Error) => void;
  signingError: (type: EthersSignMethod, message: string) => void;
  mutationError: (error: unknown, variables: unknown, context: unknown) => void;
  networksSearchResponse: (query: string, resultsCount: number) => void;
  errorScreenView: (data: { message: string; location: string }) => void;
  loaderScreenView: (data: { location: string; duration: number }) => void;
  reloadExtension: () => void;
  navigationRequest: (params: { pathname: string }) => void;
  // this event means that some dapp-related data is updated (e.g. current account, chain)
  ethereumEvent: () => void;
  'sidepanel/activeTabUpdated': () => void;
  buttonClicked: (data: ButtonClickedParams) => void;
}>();

emitter.on('mutationError', (error, _variables, context) => {
  if (
    context === 'sendTransaction' ||
    context === '_signTypedData' ||
    context === 'signMessage'
  ) {
    emitter.emit('signingError', context, getError(error).message);
  }
});
