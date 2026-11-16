import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { RecipientLine } from './RecipientLine';

vi.mock('webextension-polyfill', () => ({ default: {} }));
// The blockie canvas needs `window`; the address action is what is under test.
vi.mock('src/ui/components/BlockieImg', () => ({ BlockieImg: () => null }));

const ADDRESS = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';
const network = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: '',
  explorer: { addressUrl: 'https://etherscan.io/address/{ADDRESS}' },
} as unknown as NetworkInfo;

function render() {
  return renderToStaticMarkup(
    <RecipientLine
      caption="Recipient"
      recipientAddress={ADDRESS}
      recipientName={null}
      network={network}
      showNetworkIcon={true}
      onCopy={() => null}
    />,
  );
}

describe('RecipientLine', () => {
  test('copies the address on tap and never links to the explorer', () => {
    const markup = render();
    expect(markup).not.toContain('href');
    expect(markup).not.toContain('etherscan.io');
    expect(markup).toContain('<button');
  });
});
