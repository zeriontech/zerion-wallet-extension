import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { Networks } from 'src/modules/networks/Networks';
import { RecipientLine } from './RecipientLine';

vi.mock('webextension-polyfill', () => ({ default: {} }));
// The blockie canvas needs `window`; the address link is what is under test.
vi.mock('src/ui/components/BlockieImg', () => ({ BlockieImg: () => null }));

const ADDRESS = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';
const network = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: '',
  explorer: { addressUrl: 'https://etherscan.io/address/{ADDRESS}' },
} as unknown as NetworkInfo;

function render(copyOnly: boolean) {
  return renderToStaticMarkup(
    <RecipientLine
      caption="Recipient"
      recipientAddress={ADDRESS}
      recipientName={null}
      network={network}
      showNetworkIcon={true}
      copyOnly={copyOnly}
      onCopy={() => null}
    />,
  );
}

describe('RecipientLine', () => {
  const explorerUrl = Networks.getExplorerAddressUrl(network, ADDRESS);

  test('the fixture network has an explorer URL', () => {
    expect(explorerUrl).toBe(`https://etherscan.io/address/${ADDRESS}`);
  });

  test('copy-only renders no link to the explorer', () => {
    const markup = render(true);
    expect(markup).not.toContain('href');
    expect(markup).not.toContain('etherscan.io');
    expect(markup).toContain('<button');
  });

  test('a trackable wallet keeps the explorer link', () => {
    expect(render(false)).toContain(`href="${explorerUrl}"`);
  });
});
