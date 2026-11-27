/** The batch interpretation describes the whole approve + swap, so only the swap or order step may carry it (WLT-3932). */
export function getStepAddressActions<A>({
  interpretationAction,
  fallbackApproveAction,
  fallbackSwapAction,
}: {
  interpretationAction: A | null;
  fallbackApproveAction: A | null;
  fallbackSwapAction: A;
}): { approve: A | null; swap: A } {
  return {
    approve: fallbackApproveAction,
    swap: interpretationAction ?? fallbackSwapAction,
  };
}
