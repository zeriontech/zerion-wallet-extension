/**
 * Detect GitHub Actions instead of `CI`. Agent shells on a developer machine
 * often export `CI=true`, which previously made local e2e runs headed (stealing
 * focus) and disabled local fail-fast.
 */
export const isCI = process.env.GITHUB_ACTIONS === 'true';

/**
 * Local runs fail fast: the first failing test stops the run, so an agent or
 * developer learns about a red suite immediately instead of waiting for the
 * rest. CI keeps running every shard to completion.
 *
 * `E2E_MAX_FAILURES=0` disables the limit locally for flake triage.
 */
const configured = Number(process.env.E2E_MAX_FAILURES);

export const maxFailures: number | undefined = isCI
  ? undefined
  : process.env.E2E_MAX_FAILURES && Number.isFinite(configured)
    ? configured
    : 1;
