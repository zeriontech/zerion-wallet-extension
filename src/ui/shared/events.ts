import { createNanoEvents } from 'nanoevents';
import { getError } from 'src/shared/errors/getError';

type EthersSignMethod = 'sendTransaction' | '_signTypedData' | 'signMessage';

export const emitter = createNanoEvents<{
  uiAccountsChanged: () => void;
  hotkeydown: (combination: string) => void;
  sessionLogout: () => void;
  error: (error: Error) => void;
  signingError: (type: EthersSignMethod, message: string) => void;
  mutationError: (error: unknown, variables: unknown, context: unknown) => void;
  networksSearchResponse: (query: string, resultsCount: number) => void;
  errorScreenView: (error: Error) => void;
  loaderScreenView: (data: {
    sessionId: string;
    location: string;
    duration: number;
  }) => void;
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
