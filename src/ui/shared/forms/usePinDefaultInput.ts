import { useEffect } from 'react';

/** The asset a form spends, as its two form-state keys: chain and fungible id */
export interface InputAsset {
  inputChain?: string;
  inputFungibleId?: string;
}

/**
 * The input defaults that are not in the URL yet. `null` when there is
 * nothing to pin. Never returns a key the URL already has.
 */
export function getInputDefaultsToPin(
  userFormState: InputAsset,
  defaultFormState: InputAsset,
): InputAsset | null {
  const pinInputChain = userFormState.inputChain == null && defaultFormState.inputChain != null;
  const pinInputFungibleId =
    userFormState.inputFungibleId == null && defaultFormState.inputFungibleId != null;
  if (!pinInputChain && !pinInputFungibleId) {
    return null;
  }
  return {
    ...(pinInputChain ? { inputChain: defaultFormState.inputChain } : null),
    ...(pinInputFungibleId ? { inputFungibleId: defaultFormState.inputFungibleId } : null),
  };
}

/**
 * Writes the default input (chain and token) into the URL once, so the
 * displayed asset stays the same for the session. Defaults are recomputed
 * from balances on every refetch; without pinning, a new balance snapshot can
 * change which asset is selected while the user is looking at the form.
 * Only the input is pinned: outputs keep following fresh data.
 *
 * `userFormState` is what the URL holds; `setUserFormState` must be a stable
 * function (the one returned by `useSearchParamsObj` is).
 */
export function usePinDefaultInput<State extends InputAsset>({
  userFormState,
  defaultFormState,
  setUserFormState,
}: {
  userFormState: Partial<State>;
  defaultFormState: InputAsset;
  setUserFormState: (update: (state: Partial<State>) => Partial<State>) => void;
}) {
  const userInputChain = userFormState.inputChain;
  const userInputFungibleId = userFormState.inputFungibleId;
  const defaultInputChain = defaultFormState.inputChain;
  const defaultInputFungibleId = defaultFormState.inputFungibleId;
  useEffect(() => {
    const toPin = getInputDefaultsToPin(
      { inputChain: userInputChain, inputFungibleId: userInputFungibleId },
      { inputChain: defaultInputChain, inputFungibleId: defaultInputFungibleId },
    );
    if (toPin) {
      setUserFormState((state) => ({ ...state, ...toPin }));
    }
  }, [
    userInputChain,
    userInputFungibleId,
    defaultInputChain,
    defaultInputFungibleId,
    setUserFormState,
  ]);
}
