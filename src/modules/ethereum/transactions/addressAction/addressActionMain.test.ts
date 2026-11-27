import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { Amount } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getLabelLine } from 'src/ui/components/address-action/getLabelLine';
import { getQuoteApplication } from 'src/ui/pages/SwapForm2/shared/getQuoteApplication';
import {
  createBridgeAddressAction,
  createTradeAddressAction,
  type ActionApplication,
} from './addressActionMain';

function network(id: string): NetworkInfo {
  return { id, name: id, iconUrl: null } as unknown as NetworkInfo;
}

function amount(quantity: string): Amount {
  return { currency: 'usd', quantity, value: null, usdValue: null };
}

const usdt = { id: 'usdt', symbol: 'USDT', name: 'Tether' } as Fungible;
const address = '0x52Fb91492000F2a900a6b75B37D588AB37378e59';
const ethereum = network('ethereum');
const base = network('base');

const application = getQuoteApplication({
  contractMetadata: { id: 'mayan', name: 'Mayan', iconUrl: '' },
  contractAddress: '0xrouter',
});

function bridge(receiverAddress: string | null, app: ActionApplication | null = application) {
  return createBridgeAddressAction({
    address,
    transaction: null,
    hash: null,
    explorerUrl: null,
    spendAmount: amount('2'),
    spendFungible: usdt,
    receiveAmount: amount('1.914'),
    receiveFungible: usdt,
    inputNetwork: ethereum,
    outputNetwork: base,
    receiverAddress,
    application: app,
  });
}

function trade(app: ActionApplication | null | undefined) {
  return createTradeAddressAction({
    address,
    transaction: null,
    hash: null,
    explorerUrl: null,
    spendAmount: amount('2'),
    spendFungible: usdt,
    receiveAmount: amount('1.99'),
    receiveFungible: usdt,
    network: ethereum,
    rate: null,
    application: app,
  });
}

describe('createBridgeAddressAction', () => {
  test('a bridge to yourself receives the output on the destination chain', () => {
    const action = bridge(null);
    const received = action.acts?.[1];
    expect(received?.type.value).toBe('receive');
    expect(received?.content?.transfers?.map((transfer) => transfer.direction)).toEqual(['in']);
    expect(received?.transaction.chain.id).toBe('base');
    expect(action.type.displayValue).toBe('Bridge');
  });

  test('a bridge to yourself carries the application label', () => {
    const action = bridge(null);
    expect(getLabelLine(action.label)).toEqual({ kind: 'application-contract' });
    expect(action.label?.contract?.dapp.name).toBe('Mayan');
    expect(action.label?.contract?.dapp.iconUrl).toBeNull();
  });

  test('a bridge to another address sends to that recipient', () => {
    const action = bridge('0xother');
    expect(action.acts?.[1].type.value).toBe('send');
    expect(action.acts?.[1].label?.wallet?.address).toBe('0xother');
    expect(action.label?.wallet?.address).toBe('0xother');
    expect(action.label?.contract).toBeNull();
  });

  test('no application leaves a self bridge unlabelled', () => {
    expect(bridge(null, null).label).toBeNull();
  });
});

describe('createTradeAddressAction', () => {
  test('carries the application label', () => {
    const action = trade(application);
    expect(getLabelLine(action.label)).toEqual({ kind: 'application-contract' });
    expect(action.label?.contract?.dapp.name).toBe('Mayan');
    expect(action.label?.contract?.address).toBe('0xrouter');
  });

  test('no application leaves the action unlabelled', () => {
    expect(trade(null).label).toBeNull();
    expect(trade(undefined).label).toBeNull();
  });
});
