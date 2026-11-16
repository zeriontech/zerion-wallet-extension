import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ActionLabel } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { ApplicationLine, ApplicationWalletLine } from './ApplicationLine';

// The blockie canvas needs `window`; the address action is what is under test.
vi.mock('src/ui/components/BlockieImg', () => ({ BlockieImg: () => null }));

const WALLET_ADDRESS = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';
const CONTRACT_ADDRESS = '0x2222222222222222222222222222222222222222';
const network = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: '',
  explorer: { addressUrl: 'https://etherscan.io/address/{ADDRESS}' },
} as unknown as NetworkInfo;

const contract = {
  address: CONTRACT_ADDRESS,
  dapp: { id: 'uniswap', name: 'Uniswap', iconUrl: null, url: null },
} as NonNullable<ActionLabel['contract']>;

function renderApplicationLine(label: ActionLabel) {
  return renderToStaticMarkup(<ApplicationLine addressAction={{ label }} network={network} />);
}

function expectCopyButton(markup: string) {
  expect(markup).not.toContain('href');
  expect(markup).not.toContain('etherscan.io');
  expect(markup).toContain('<button');
}

describe('ApplicationLine', () => {
  test('a contract-shaped application label copies its address', () => {
    expectCopyButton(renderApplicationLine({ title: 'application', contract, wallet: null }));
  });

  test('the extra application line under a to label copies the contract address', () => {
    expectCopyButton(
      renderApplicationLine({
        title: 'to',
        displayTitle: 'To',
        contract,
        wallet: { address: WALLET_ADDRESS, name: null, iconUrl: null },
      }),
    );
  });
});

describe('ApplicationWalletLine', () => {
  test('copies the wallet address instead of linking to the explorer', () => {
    expectCopyButton(
      renderToStaticMarkup(
        <ApplicationWalletLine
          caption="Application"
          address={WALLET_ADDRESS}
          network={network}
          onCopy={() => null}
        />,
      ),
    );
  });
});
