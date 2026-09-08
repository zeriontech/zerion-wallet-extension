/**
 * Regenerates src/modules/networks/networks-fallback.json from the mainnet ZPI
 * supported chain list, stripped to the extension's NetworkInfo shape.
 *
 *   node scripts/refresh-networks-fallback.mjs
 *   node scripts/refresh-networks-fallback.mjs --from ./chain-list.json
 *
 * zpi.zerion.io sits behind a Cloudflare challenge that rejects plain HTTP
 * clients and headless browsers, so a direct fetch is tried first and, when it
 * is challenged, the list is fetched from a headed Google Chrome via Playwright
 * (installed as a dev dependency). `--from` converts a response saved by hand
 * from DevTools instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = 'https://zpi.zerion.io';
const ENDPOINT = '/chain/list/v1?supportedOnly=true&includeTestnets=false';
const HEADERS = {
  'Zerion-Client-Type': 'web-extension',
  'Zerion-Client-Version': '1.0.0',
};
/** ChainFlags keys as declared in src/modules/zerion-api/types/ChainFullInfo.ts */
const FLAG_KEYS = [
  'supportsTrading',
  'supportsSending',
  'supportsBridging',
  'supportsActions',
  'supportsPositions',
  'supportsNftPositions',
  'supportsSponsoredTransactions',
  'supportsGasPrices',
  'supportsSimulations',
];
const OUTPUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/modules/networks/networks-fallback.json'
);

async function fetchDirect() {
  const res = await fetch(HOST + ENDPOINT, { headers: HEADERS });
  const text = await res.text();
  if (res.status !== 200 || !text.startsWith('{')) {
    throw new Error(`Direct fetch challenged (${res.status})`);
  }
  return text;
}

async function fetchViaChrome() {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(HOST + '/chain/get/v1?eip155Id=1', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(3000);
    const { status, text } = await page.evaluate(
      async ({ url, headers }) => {
        const res = await fetch(url, { headers, credentials: 'include' });
        return { status: res.status, text: await res.text() };
      },
      { url: HOST + ENDPOINT, headers: HEADERS }
    );
    if (status !== 200) {
      throw new Error(
        `chain/list/v1 answered ${status}: ${text.slice(0, 200)}`
      );
    }
    return text;
  } finally {
    await browser.close();
  }
}

/** Keeps only what NetworkInfo declares; drops price data and other chains' implementations */
function toNetworkInfo(chain) {
  const { eip155, solana } = chain.specification;
  const specification = eip155
    ? { eip155: { chainId: eip155.chainId } }
    : solana
    ? { solana: { genesisHash: solana.genesisHash } }
    : null;
  if (!specification) {
    return null; // a standard the extension does not model, e.g. tron
  }
  const implementation = chain.baseAsset?.implementations?.[chain.id];
  return {
    id: chain.id,
    name: chain.name,
    iconUrl: chain.iconUrl ?? null,
    testnet: chain.testnet,
    specification,
    explorer: chain.explorer ?? null,
    baseAsset: chain.baseAsset
      ? {
          id: chain.baseAsset.id,
          name: chain.baseAsset.name,
          symbol: chain.baseAsset.symbol,
          iconUrl: chain.baseAsset.iconUrl ?? null,
          implementations: implementation ? { [chain.id]: implementation } : {},
        }
      : null,
    flags: Object.fromEntries(
      FLAG_KEYS.map((key) => [key, Boolean(chain.flags?.[key])])
    ),
    rpcUrl: chain.rpcUrl,
    publicRpcUrl: chain.publicRpcUrl,
  };
}

async function main() {
  const fromIndex = process.argv.indexOf('--from');
  let text;
  if (fromIndex !== -1) {
    text = fs.readFileSync(path.resolve(process.argv[fromIndex + 1]), 'utf8');
  } else {
    text = await fetchDirect().catch((error) => {
      console.warn(`${error.message}; retrying through a headed Chrome`);
      return fetchViaChrome();
    });
  }
  const { data } = JSON.parse(text);
  const networks = data.map(toNetworkInfo).filter(Boolean);
  fs.writeFileSync(OUTPUT, JSON.stringify(networks, null, 2) + '\n');
  console.log(
    `Wrote ${networks.length} chains to ${path.relative(process.cwd(), OUTPUT)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
