import EventEmitter from 'events';
import type { Connection } from './connection';
import { EthereumProvider } from './provider';

type InitialState = { chainId: string; accounts: string[] };

/** Stands in for the BroadcastChannel-backed Connection: answers the three start-up requests */
class FakeConnection extends EventEmitter {
  connected = false;
  connecting = false;
  sent: string[] = [];

  constructor(private state: InitialState) {
    super();
  }

  async open() {
    this.connected = true;
  }

  async close() {}

  async send(payload: { method: string }) {
    this.sent.push(payload.method);
    if (payload.method === 'eth_chainId') return this.state.chainId;
    if (payload.method === 'eth_accounts') return this.state.accounts;
    if (payload.method === 'wallet_getWalletNameFlags') return [];
    throw new Error(`Unexpected request in test: ${payload.method}`);
  }

  /** What the content script forwards from the background */
  background(event: string, value?: unknown) {
    this.emit('ethereumEvent', { event, value });
  }
}

const ACCOUNT = '0x1111111111111111111111111111111111111111';
const OTHER_ACCOUNT = '0x2222222222222222222222222222222222222222';

function setup(state: InitialState = { chainId: '0x89', accounts: [] }) {
  const connection = new FakeConnection(state);
  const provider = new EthereumProvider(connection as unknown as Connection);
  return { connection, provider };
}

describe('EthereumProvider EIP-1193 events', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { origin: 'https://dapp.example' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits connect once with the chain id reported by the wallet', async () => {
    const { provider } = setup({ chainId: '0x89', accounts: [] });
    const onConnect = vi.fn();
    provider.on('connect', onConnect);

    await provider.open();

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onConnect).toHaveBeenCalledWith({ chainId: '0x89' });
    expect(provider.chainId).toBe('0x89');
    expect(provider.networkVersion).toBe('137');
  });

  it('answers eth_chainId from the state loaded at start-up', async () => {
    const { provider, connection } = setup({ chainId: '0xa', accounts: [] });
    await provider.open();
    const requestsAtStartUp = connection.sent.length;

    await expect(provider.request({ method: 'eth_chainId' })).resolves.toBe('0xa');
    expect(connection.sent.length).toBe(requestsAtStartUp);
  });

  it('emits chainChanged with the new hex chain id and updates its state', async () => {
    const { provider, connection } = setup({ chainId: '0x1', accounts: [] });
    await provider.open();
    const onChainChanged = vi.fn();
    provider.on('chainChanged', onChainChanged);

    connection.background('chainChanged', '0x2105');

    expect(onChainChanged).toHaveBeenCalledTimes(1);
    expect(onChainChanged).toHaveBeenCalledWith('0x2105');
    expect(provider.chainId).toBe('0x2105');
    expect(provider.networkVersion).toBe('8453');
  });

  it('does not emit chainChanged when the chain id is unchanged', async () => {
    const { provider, connection } = setup({ chainId: '0x1', accounts: [] });
    await provider.open();
    const onChainChanged = vi.fn();
    provider.on('chainChanged', onChainChanged);

    connection.background('chainChanged', '0x1');

    expect(onChainChanged).not.toHaveBeenCalled();
  });

  it('emits accountsChanged when the site is granted an account', async () => {
    const { provider, connection } = setup({ chainId: '0x1', accounts: [] });
    await provider.open();
    const onAccountsChanged = vi.fn();
    provider.on('accountsChanged', onAccountsChanged);

    connection.background('accountsChanged', [ACCOUNT]);

    expect(onAccountsChanged).toHaveBeenCalledTimes(1);
    expect(onAccountsChanged).toHaveBeenCalledWith([ACCOUNT]);
    expect(provider.accounts).toEqual([ACCOUNT]);
  });

  it('does not emit accountsChanged when the accounts are unchanged', async () => {
    const { provider, connection } = setup({ chainId: '0x1', accounts: [ACCOUNT] });
    await provider.open();
    const onAccountsChanged = vi.fn();
    provider.on('accountsChanged', onAccountsChanged);

    connection.background('accountsChanged', [ACCOUNT]);
    expect(onAccountsChanged).not.toHaveBeenCalled();

    connection.background('accountsChanged', [OTHER_ACCOUNT]);
    expect(onAccountsChanged).toHaveBeenCalledWith([OTHER_ACCOUNT]);
  });

  it('emits accountsChanged with an empty list when access is revoked', async () => {
    const { provider, connection } = setup({ chainId: '0x1', accounts: [ACCOUNT] });
    await provider.open();
    const onAccountsChanged = vi.fn();
    provider.on('accountsChanged', onAccountsChanged);

    connection.background('accountsChanged', []);

    expect(onAccountsChanged).toHaveBeenCalledWith([]);
    expect(provider.accounts).toEqual([]);
  });

  it('does not emit connect again when accounts change', async () => {
    const { provider, connection } = setup({ chainId: '0x1', accounts: [] });
    const onConnect = vi.fn();
    provider.on('connect', onConnect);
    await provider.open();

    connection.background('accountsChanged', [ACCOUNT]);

    expect(onConnect).toHaveBeenCalledTimes(1);
  });
});
