#!/usr/bin/env node

/**
 * Balanced e2e shards.
 *
 * Playwright's `--shard=i/n` splits by test *index*, which leaves our suite
 * lopsided (measured: 56s / 28s / 32s over three shards) because the heavy
 * onboarding tests sit next to each other in the same file. Instead, every
 * test carries a measured duration below and the shards are filled greedily
 * (longest processing time first), then selected with `--grep`.
 *
 * `--verify` re-lists the suite and fails if a test is not covered by exactly
 * one shard, so adding or renaming a test cannot silently drop it from CI.
 *
 * Usage:
 *   node scripts/e2e-shards.mjs --shard=1 --total=5   # prints `grep=` for GITHUB_OUTPUT
 *   node scripts/e2e-shards.mjs --verify
 */

import { execFileSync } from 'node:child_process';

const TESTS = [
  // file, full title path after `:line:col › `, measured seconds locally
  ['confidential-balances.spec.ts', 'confidential balances: panel → reveal → unmasked', 7.9],
  ['connect-ledger.spec.ts', 'Connect Ledger › Matches snapshot', 3.4],
  ['forgot-password.spec.ts', 'Forgot Password › Matches snapshot', 3.3],
  ['get-started.spec.ts', 'Get Started › Onboarded with private key › Matches snapshot', 3.2],
  ['hidden-assets.spec.ts', 'Hidden Assets persists, lists and unhides a token', 4.0],
  [
    'get-started.spec.ts',
    'Get Started › Onboarded with private key › User can create a new wallet when there are no existing backups',
    6.1,
  ],
  [
    'get-started.spec.ts',
    'Get Started › Onboarded with recovery phrase › User can import wallets from existing backup',
    10.3,
  ],
  [
    'get-started.spec.ts',
    'Get Started › Onboarded with recovery phrase › User can create a new backup',
    8.4,
  ],
  [
    'get-started.spec.ts',
    'Get Started › Onboarded with recovery phrase › User can import existing wallet using private key',
    7.4,
  ],
  [
    'get-started.spec.ts',
    'Get Started › Onboarded with recovery phrase › User can import existing wallet using recovery phrase',
    10.4,
  ],
  [
    'get-started.spec.ts',
    'Get Started › Onboarded with recovery phrase › User can add watch address',
    5.2,
  ],
  ['login.spec.ts', 'Login › Matches snapshot', 4.2],
  ['manage-wallets.spec.ts', 'Manage Wallets › Matches snapshot', 3.3],
  ['network-fee-swap.spec.ts', 'Swap on Ethereum keeps row, picker and custom form in sync', 6.5],
  ['network-fee-swap.spec.ts', 'Classic Send on BSC prices Slow and Custom consistently', 5.3],
  ['network-fee-swap.spec.ts', 'Classic Swap on BSC prices Slow and Custom consistently', 5.2],
  ['network-fee-swap.spec.ts', 'Send Slow carries into Swap and another chain starts Fast', 4.3],
  ['network-fee.spec.ts', 'remembers the fee level per chain and flags non-Fast levels', 12.2],
  ['network-fee.spec.ts', 'keeps the acceleration fee UI unchanged', 5.3],
  ['network-fee.spec.ts', 'keeps custom fee values after switching to Fast', 5.5],
  ['manage-wallets.spec.ts', 'Manage Wallets › Action links are working', 3.6],
  ['manage-wallets.spec.ts', 'Manage Wallets › User can erase all data', 5.1],
  ['onboarding.spec.ts', 'Onboarding › Matches snapshot', 1.0],
  ['onboarding.spec.ts', 'Onboarding › User can create a new wallet and skip backup', 4.2],
  ['onboarding.spec.ts', 'Onboarding › User can create and backup a new wallet', 4.2],
  [
    'onboarding.spec.ts',
    'Onboarding › User can import an existing wallet using recovery phrase',
    4.9,
  ],
  ['onboarding.spec.ts', 'Onboarding › User can import an existing wallet using private key', 3.1],
  ['overview.spec.ts', 'Overview › Matches snapshot', 11.2],
  ['settings.spec.ts', 'Settings › Matches snapshot', 3.3],
  ['settings.spec.ts', 'Settings › User can lock and unlock wallet', 3.8],

  // Dapp suite. These only run when DAPP_URL is set; CI points then at the
  // hosted zerion-test-dapp deployment.
  [
    'connection.spec.ts',
    'Connection › EIP-6963 discovery exposes Zerion and connection returns the account',
    8.0,
  ],
  [
    'connection.spec.ts',
    'Connection › rejecting the connection leaves the dapp disconnected and allows a retry',
    8.0,
  ],
  [
    'connection.spec.ts',
    'Connection › clearing the active provider and selecting Zerion again reconnects without an approval window',
    8.0,
  ],
  [
    'networks.spec.ts',
    'Networks › wallet_switchEthereumChain switches the dapp and emits chainChanged',
    8.0,
  ],
  [
    'networks.spec.ts',
    'Networks › rejecting wallet_switchEthereumChain returns the rejection to the dapp',
    8.0,
  ],
  [
    'networks.spec.ts',
    'Networks › wallet_addEthereumChain surfaces the chain update and then switches',
    10.0,
  ],
  [
    'signatures.spec.ts',
    'Signatures › personal_sign approves a signature and a rejection reaches the dapp',
    9.0,
  ],
  [
    'signatures.spec.ts',
    'Signatures › eth_signTypedData_v4 signs typed data and reports rejection',
    9.0,
  ],
  [
    'signatures.spec.ts',
    'Signatures › SIWE and the PermitSingle fixture are signed as personal_sign and typed data',
    9.0,
  ],
  [
    'transactions.spec.ts',
    'Transactions › eth_sendTransaction opens the approval and surfaces the missing testnet balance',
    10.0,
  ],
  [
    'transactions.spec.ts',
    'Transactions › rejecting eth_sendTransaction returns error code 4001 to the dapp',
    8.0,
  ],
  [
    'unsupported-features.spec.ts',
    'Unsupported methods and malformed payloads › unsupported signing and transaction methods fail without an approval window',
    10.0,
  ],
  [
    'unsupported-features.spec.ts',
    'Unsupported methods and malformed payloads › malformed personal_sign params are rejected before an approval window',
    8.0,
  ],
].map(([file, title, seconds]) => ({ file, title, seconds }));

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Pattern for one test. `--grep` matches the test's title path joined with
 * spaces and prefixed with the spec's absolute path, i.e.
 * `/…/e2e/tests/login.spec.ts Login Matches snapshot`, so the pattern anchors on
 * the file name plus the full describe chain.
 */
function testPattern({ file, title }) {
  return `^.*${escapeRegex(file)} ${escapeRegex(title.replaceAll(' › ', ' '))}$`;
}

/** Longest-processing-time-first packing. */
function partition(total) {
  const shards = Array.from({ length: total }, () => ({
    seconds: 0,
    tests: [],
  }));
  for (const test of [...TESTS].sort((a, b) => b.seconds - a.seconds)) {
    const lightest = shards.reduce((min, shard) => (shard.seconds < min.seconds ? shard : min));
    lightest.tests.push(test);
    lightest.seconds += test.seconds;
  }
  return shards;
}

function listTests() {
  const output = execFileSync('npx', ['playwright', 'test', '--list'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return output
    .split('\n')
    .map((line) => line.match(/› (.+?\.spec\.ts):\d+:\d+ › (.+)$/))
    .filter(Boolean)
    .map(([, file, title]) => `${file.split('/').pop()} ${title.replaceAll(' › ', ' ')}`);
}

function verify(total) {
  const listed = listTests();
  const shards = partition(total);
  const patterns = shards.map((shard) => new RegExp(shard.tests.map(testPattern).join('|')));
  const problems = [];
  for (const test of listed) {
    const matches = patterns.filter((pattern) => pattern.test(test)).length;
    if (matches !== 1) {
      problems.push(`${test} matches ${matches} shards`);
    }
  }
  if (problems.length > 0) {
    console.error(`::error::${problems.length} e2e test(s) are not assigned to exactly one shard:`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('Update TESTS in scripts/e2e-shards.mjs.');
    process.exit(1);
  }
  console.log(`${listed.length} tests, each assigned to exactly one of ${total} shards`);
}

function main() {
  const args = process.argv.slice(2);
  const value = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
  const total = Number(value('total') ?? 5);

  if (args.includes('--verify')) return verify(total);

  const index = Number(value('shard'));
  if (!Number.isInteger(index) || index < 1 || index > total) {
    console.error('Usage: node scripts/e2e-shards.mjs --shard=N --total=5 | --verify');
    process.exit(1);
  }

  const shard = partition(total)[index - 1];
  const grep = shard.tests.map(testPattern).join('|');
  // Human summary on stderr: stdout is redirected into $GITHUB_OUTPUT.
  console.error(
    `Shard ${index}/${total}: ${shard.tests.length} tests, ~${shard.seconds.toFixed(1)}s measured`,
  );
  console.log(`grep=${grep}`);
}

main();
