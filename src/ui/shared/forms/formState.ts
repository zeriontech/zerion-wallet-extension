import { useEffect } from 'react';

/**
 * Form-state keys that hold a user's network-fee override. An override is
 * bound to one chain and one prepared transaction or quote, so spread this
 * into the state whenever either changes, and after a broadcast.
 */
export const CLEARED_GAS_OVERRIDES = {
  networkFeeSpeed: undefined,
  maxPriorityFee: undefined,
  maxFee: undefined,
  gasPrice: undefined,
  gasLimit: undefined,
} as const;

export type FormChangeHandler<State> = <K extends keyof State>(key: K, value: State[K]) => void;

export interface InputSelection {
  inputChain?: string;
  inputFungibleId?: string;
}

/**
 * The input keys that are absent from the URL but have a resolved default.
 * `null` when there is nothing to fill. Never returns a key the URL already
 * has.
 */
export function getMissingInputSelection(
  fromUrl: InputSelection,
  resolved: InputSelection,
): InputSelection | null {
  const missingInputChain = fromUrl.inputChain == null && resolved.inputChain != null;
  const missingInputFungibleId =
    fromUrl.inputFungibleId == null && resolved.inputFungibleId != null;
  if (!missingInputChain && !missingInputFungibleId) {
    return null;
  }
  return {
    ...(missingInputChain ? { inputChain: resolved.inputChain } : null),
    ...(missingInputFungibleId ? { inputFungibleId: resolved.inputFungibleId } : null),
  };
}

/**
 * Writes the resolved default input (chain and token) into the URL once, so
 * the displayed asset stays the same for the session. Defaults are recomputed
 * from balances on every refetch; without pinning, a new balance snapshot can
 * change which asset is selected while the user is looking at the form.
 * Only the input is pinned: outputs keep following fresh data.
 *
 * `pin` must be a stable function (wrap it in `useCallback`).
 */
export function usePinResolvedInput({
  fromUrl,
  resolved,
  pin,
}: {
  fromUrl: InputSelection;
  resolved: InputSelection;
  pin: (missing: InputSelection) => void;
}) {
  const urlInputChain = fromUrl.inputChain;
  const urlInputFungibleId = fromUrl.inputFungibleId;
  const resolvedInputChain = resolved.inputChain;
  const resolvedInputFungibleId = resolved.inputFungibleId;
  useEffect(() => {
    const missing = getMissingInputSelection(
      { inputChain: urlInputChain, inputFungibleId: urlInputFungibleId },
      { inputChain: resolvedInputChain, inputFungibleId: resolvedInputFungibleId },
    );
    if (missing) {
      pin(missing);
    }
  }, [urlInputChain, urlInputFungibleId, resolvedInputChain, resolvedInputFungibleId, pin]);
}
