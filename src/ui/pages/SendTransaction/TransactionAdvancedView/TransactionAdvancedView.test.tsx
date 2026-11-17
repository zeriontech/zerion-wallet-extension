import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { TransactionAdvancedView } from './TransactionAdvancedView';

vi.mock('webextension-polyfill', () => ({ default: {} }));
// The blockie canvas needs `window`; the label address is what is under test.
vi.mock('src/ui/components/BlockieImg', () => ({ BlockieImg: () => null }));

const WALLET = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';
const OTHER = '0x2222222222222222222222222222222222222222';
const network = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: '',
  explorer: { addressUrl: 'https://etherscan.io/address/{ADDRESS}' },
} as unknown as NetworkInfo;

const walletAddressMarkup = truncateAddress(toChecksumAddress(WALLET), 15);

function action(label: unknown): AnyAddressAction {
  return { label, type: { value: 'execute', displayValue: 'Execute' } } as AnyAddressAction;
}

const toLabel = action({
  title: 'to',
  displayTitle: 'To',
  wallet: { address: WALLET, name: null, iconUrl: null },
  contract: null,
});

function render(transaction: React.ComponentProps<typeof TransactionAdvancedView>['transaction']) {
  return renderToStaticMarkup(
    <TransactionAdvancedView network={network} transaction={transaction} addressAction={toLabel} />,
  );
}

describe('TransactionAdvancedView label lines', () => {
  test('hides the wallet line when the raw from/to rows already show that address', () => {
    const markup = render({
      evm: { from: OTHER, to: WALLET, chainId: 1, nonce: 1 } as never,
    });
    expect(markup).not.toContain(walletAddressMarkup);
  });

  test('keeps the wallet line when the raw rows show other addresses', () => {
    const markup = render({
      evm: { from: OTHER, to: OTHER, chainId: 1, nonce: 1 } as never,
    });
    expect(markup).toContain(walletAddressMarkup);
  });

  test('keeps the wallet line for Solana, whose raw payload has no from/to rows', () => {
    const markup = render({ solana: ['raw-transaction'] as StringBase64[] });
    expect(markup).toContain(walletAddressMarkup);
  });
});
