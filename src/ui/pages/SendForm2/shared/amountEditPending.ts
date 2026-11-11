/**
 * `draft` is the raw string last typed into the amount input, or null when no
 * edit is in flight; `debounced` is the form-state amount the request uses.
 * While they differ, the response on hand belongs to an older amount.
 */
export function isAmountEditPending(draft: string | null, debounced: string | undefined): boolean {
  return draft !== null && draft !== (debounced ?? '');
}
