/**
 * Whether the current user belongs to the cohort hit by the password
 * re-encryption bug (fixed in #929). This was a Statsig feature gate
 * (`users_affected_by_password_change_bug`); with Statsig removed there is no
 * way to resolve the cohort, so the proactive reminder stays inert until a
 * backend flag replaces it.
 *
 * The reactive path is unaffected: `maybeTriggerMnemonicRestoration` still
 * opens the restoration flow whenever decryption actually fails.
 */
export function useAffectedByPasswordChangeBug() {
  return { isAffected: false, isLoading: false };
}
