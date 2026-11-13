import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Wallet } from './Wallet';
import type { NotificationWindowProps } from '../NotificationWindow/NotificationWindow';

/**
 * These tests pin the observable behaviour of the six dapp signing methods of
 * `PublicController`: which requests are refused, in which order the checks
 * run, when an approval dialog opens and with which arguments.
 *
 * They are written against the implementation that exists before the
 * refactor, so the refactor is only allowed to change them if it also changes
 * behaviour — which it must not.
 */

const phishing = vi.hoisted(() => ({
  checkDapp: vi.fn(),
  blockOriginWithWarning: vi.fn(),
}));

vi.mock('src/background/constants', () => import('src/background/constants.mock'));
vi.mock('src/modules/phishing-defence/phishing-defence-service', () => ({
  phishingDefenceService: phishing,
}));

/**
 * `store-unit` ships a CommonJS bundle that `require`s an ES-module copy of
 * `nanoevents`, which the test runner cannot parse. It is a plain observable
 * store with no wallet logic; this keeps its contract (on/getState/setState/
 * setStateSilent) so `PersistentStore` and `GlobalPreferences` behave normally.
 */
vi.mock('store-unit', () => {
  type Listener = (state: unknown, prevState: unknown) => void;
  class Store {
    state: unknown;
    private listeners: Listener[] = [];
    constructor(initialState: unknown) {
      this.state = initialState;
    }
    on(_event: string, listener: Listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter((item) => item !== listener);
      };
    }
    getState() {
      return this.state;
    }
    setState(next: unknown) {
      const resolved =
        typeof next === 'function' ? (next as (state: unknown) => unknown)(this.state) : next;
      if (resolved === this.state) {
        return;
      }
      const prevState = this.state;
      this.state = resolved;
      for (const listener of this.listeners) {
        listener(this.state, prevState);
      }
    }
    setStateSilent(next: unknown) {
      this.state = next;
    }
  }
  class FormDataStore extends Store {}
  return { Store, FormDataStore };
});
/**
 * `Wallet.ts` pulls in browser storage, the extension runtime and the sidepanel
 * messaging at module load. Only those are replaced; anything that takes part
 * in the permission decision (Wallet methods, error classes, address helpers,
 * validators, ecosystem matching) stays real.
 */
vi.mock('webextension-polyfill', () => {
  const storage = new Map<string, unknown>();
  const local = {
    get: async (key: string) => ({ [key]: storage.get(key) }),
    set: async (entries: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(entries)) {
        storage.set(key, value);
      }
    },
    remove: async (key: string) => {
      storage.delete(key);
    },
    clear: async () => {
      storage.clear();
    },
  };
  const listener = { addListener: () => {}, removeListener: () => {} };
  const browser = {
    runtime: {
      getURL: (path: string) => `chrome-extension://test-extension/${path}`,
      getManifest: () => ({ action: { default_popup: 'popup.html' } }),
      sendMessage: async () => undefined,
      onMessage: listener,
    },
    storage: { local, session: local, onChanged: listener },
    tabs: { query: async () => [], sendMessage: async () => undefined },
    windows: {
      onRemoved: listener,
      get: async () => ({ id: 1, tabs: [] }),
      getCurrent: async () => ({ top: 0, left: 0, width: 1200 }),
      create: async () => ({ id: 1 }),
      update: async () => ({ id: 1 }),
      remove: async () => undefined,
    },
    alarms: { create: () => undefined, onAlarm: listener },
  };
  return { default: browser };
});

const ORIGIN = 'https://dapp.example';
const EVM = '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1';
const OTHER_EVM = '0x2222222222222222222222222222222222222222';
const SOL = '11111111111111111111111111111111';

const TYPED_DATA = {
  types: {
    EIP712Domain: [],
    Mail: [{ name: 'contents', type: 'string' }],
  },
  primaryType: 'Mail',
  domain: { name: 'Test', version: '1' },
  message: { contents: 'hello' },
};

const TRANSACTION = { from: EVM, to: OTHER_EVM, value: '0x1' };

type MethodName =
  | 'sol_signTransaction'
  | 'sol_signAndSendTransaction'
  | 'sol_signAllTransactions'
  | 'sol_signMessage'
  | 'eth_sendTransaction'
  | 'eth_signTypedData_v4'
  | 'personal_sign';

type HarnessState = {
  /** what `readCurrentAddress` / `ensureCurrentAddress` report */
  address: string | null;
  /** what `allowedOrigin` answers for a public origin */
  connected: boolean;
  /**
   * When set, `allowedOrigin` answers whether the asked-about address is in
   * this set, ignoring `connected` and the current address. Used to prove the
   * code asks about the address that will actually sign.
   */
  connectedAddresses?: string[];
  /** `ensureCurrentAddress` throws, as it does with no wallet unlocked */
  ensureThrows: boolean;
  /** `getCurrentWalletSync` / `uiGetCurrentWallet` report a hardware wallet */
  device: boolean;
  bluetooth: boolean;
};

type DialogResponse =
  | { kind: 'dismiss-signing' }
  | { kind: 'resolve-signing'; value: unknown }
  | { kind: 'resolve-ecosystem'; address: string }
  | { kind: 'dismiss-ecosystem' };

type Config = {
  method: MethodName;
  label?: string;
  params?: unknown;
  context?: Record<string, unknown>;
  state?: Partial<HarnessState>;
  responses?: DialogResponse[];
  phishing?: boolean;
};

type ErrorInfo = { class: string; code?: number; message?: string };

function errorInfo(error: unknown): ErrorInfo {
  if (error instanceof DOMException) {
    // Base64 decoding is the only thing that can throw a DOMException here and
    // its message text is platform specific; the name is the contract.
    return { class: 'DOMException', message: error.name };
  }
  if (error instanceof Error) {
    const withCode = error as Error & { code?: number };
    return {
      class: error.constructor.name,
      ...(typeof withCode.code === 'number' ? { code: withCode.code } : {}),
      message: error.message,
    };
  }
  return { class: typeof error, message: String(error) };
}

function dialogRecord(props: NotificationWindowProps<unknown>) {
  return {
    route: props.route,
    search: Object.fromEntries(new URLSearchParams(props.search)),
    height: props.height,
    type: props.type,
    tabId: props.tabId,
    // The ecosystem-switch dialog adds a nanoid(); signing dialogs use the
    // dapp's request id. Keep the suffix shape, drop the random value.
    requestId: props.requestId.replace(/ecosystem-switch:.+$/, 'ecosystem-switch:<random>'),
  };
}

function createHarness(state: HarnessState) {
  const opened: NotificationWindowProps<unknown>[] = [];
  const emitted: Array<{ event: string; id: unknown; error: unknown }> = [];
  const notificationWindow = {
    open: vi.fn(async (props: NotificationWindowProps<unknown>) => {
      opened.push(props);
      return `window-${opened.length}`;
    }),
    emit: vi.fn((event: string, payload: { id?: unknown; error?: unknown }) => {
      emitted.push({ event, id: payload?.id, error: payload?.error });
    }),
  };

  const wallet = new Wallet(
    'test-wallet',
    null,
    notificationWindow as unknown as ConstructorParameters<typeof Wallet>[2],
  );
  const controller = wallet.publicEthereumController as unknown as Record<
    MethodName,
    (args: unknown) => Promise<unknown>
  >;

  const setCurrentAddressCalls: string[] = [];
  const ensureTestnetCalls: Array<{ initiator: string; tabId: number | null }> = [];
  const allowedOriginCalls: Array<{ origin: unknown; address: string }> = [];

  vi.spyOn(wallet, 'readCurrentAddress').mockImplementation(() => state.address);
  vi.spyOn(wallet, 'ensureCurrentAddress').mockImplementation(() => {
    if (state.ensureThrows || !state.address) {
      throw new Error('Wallet is not initialized');
    }
    return state.address;
  });
  vi.spyOn(wallet, 'allowedOrigin').mockImplementation(((
    context: { origin?: unknown } | undefined,
    address: string,
  ) => {
    allowedOriginCalls.push({ origin: context?.origin, address });
    if (!context || !context.origin) {
      throw new Error('This method requires context');
    }
    if (state.connectedAddresses) {
      return state.connectedAddresses.includes(address);
    }
    return state.connected && address === state.address;
  }) as never);
  vi.spyOn(wallet, 'getCurrentWalletSync').mockImplementation(() =>
    state.device
      ? ({ address: state.address, derivationPath: "m/44'/60'/0'/0/0" } as never)
      : ({ address: state.address } as never),
  );
  vi.spyOn(wallet, 'uiGetCurrentWallet').mockImplementation(async () =>
    state.device
      ? ({ address: state.address, derivationPath: "m/44'/60'/0'/0/0" } as never)
      : ({ address: state.address } as never),
  );
  vi.spyOn(wallet, 'getGlobalPreferences').mockImplementation(
    async () => ({ bluetoothSupportEnabled: state.bluetooth }) as never,
  );
  vi.spyOn(wallet, 'setCurrentAddress').mockImplementation(async (args) => {
    const { address } = args.params;
    setCurrentAddressCalls.push(address);
    state.address = address;
  });
  vi.spyOn(wallet, 'ensureTestnetModeForTx').mockImplementation(async (args) => {
    ensureTestnetCalls.push({ initiator: args.initiator, tabId: args.tabId });
  });

  return {
    wallet,
    controller,
    notificationWindow,
    opened,
    emitted,
    setCurrentAddressCalls,
    ensureTestnetCalls,
    allowedOriginCalls,
  };
}

async function flush() {
  // Everything awaited here is an already-resolved promise (storage, the
  // phishing check, window.open), so a fixed number of microtask turns drains
  // the chain without depending on wall-clock time.
  for (let index = 0; index < 24; index++) {
    await Promise.resolve();
  }
}

async function run(config: Config) {
  const state: HarnessState = {
    address: config.context?.origin === undefined && config.method.startsWith('sol_') ? SOL : EVM,
    connected: true,
    ensureThrows: false,
    device: false,
    bluetooth: false,
    ...config.state,
  };
  const harness = createHarness(state);
  phishing.checkDapp.mockResolvedValue(
    config.phishing
      ? { status: 'phishing', isWhitelisted: false }
      : { status: 'ok', isWhitelisted: false },
  );

  const outcome: { settled: boolean; returns?: unknown; throws?: unknown } = {
    settled: false,
  };
  const resolutionErrors: ErrorInfo[] = [];
  const responded = new Set<NotificationWindowProps<unknown>>();
  const responses = [...(config.responses ?? [])];

  const promise = harness.controller[config.method]({
    id: 'request-1',
    params: config.params,
    context: config.context ?? { origin: ORIGIN, tabId: 7 },
  });
  promise.then(
    (value) => {
      if (!outcome.settled) {
        outcome.settled = true;
        outcome.returns = value;
      }
    },
    (error) => {
      if (!outcome.settled) {
        outcome.settled = true;
        outcome.throws = error;
      }
    },
  );

  for (let step = 0; step < 4; step++) {
    await flush();
    const next = harness.opened.find((props) => !responded.has(props));
    const response = responses.shift();
    if (!next || !response) {
      break;
    }
    responded.add(next);
    try {
      if (response.kind === 'resolve-signing') {
        const result = next.onResolve(response.value);
        await Promise.resolve(result);
      } else if (response.kind === 'resolve-ecosystem') {
        await next.onResolve({ address: response.address } as never);
      } else if (response.kind === 'dismiss-ecosystem' || response.kind === 'dismiss-signing') {
        next.onDismiss();
      }
    } catch (error) {
      resolutionErrors.push(errorInfo(error));
    }
  }
  await flush();

  const record = {
    outcome: outcome.settled
      ? 'returns' in outcome
        ? { returns: outcome.returns }
        : { throws: errorInfo(outcome.throws) }
      : { pending: true },
    dialogs: harness.opened.map(dialogRecord),
    allowedOrigin: harness.allowedOriginCalls,
    emitted: harness.emitted.map(({ event, id, error }) => ({
      event,
      id,
      error: error === undefined ? null : errorInfo(error),
    })),
    setCurrentAddress: harness.setCurrentAddressCalls,
    ensureTestnetModeForTx: harness.ensureTestnetCalls,
    resolutionErrors,
  };

  harness.wallet.destroy();
  return { record, harness, outcome, resolutionErrors };
}

type MethodCase = {
  method: MethodName;
  /** current address while the request arrives */
  address: string;
  /** the address the ecosystem dialog must resolve with to be acceptable */
  switchTo: string;
  /** an address of the wrong ecosystem for this method */
  wrongEcosystemAddress: string;
  params: unknown;
};

const METHODS: MethodCase[] = [
  {
    method: 'sol_signTransaction',
    address: SOL,
    switchTo: SOL,
    wrongEcosystemAddress: EVM,
    params: { txBase64: 'AQID', clientScope: 'Swap' },
  },
  {
    method: 'sol_signAndSendTransaction',
    address: SOL,
    switchTo: SOL,
    wrongEcosystemAddress: EVM,
    params: { txBase64: 'AQID' },
  },
  {
    method: 'sol_signAllTransactions',
    address: SOL,
    switchTo: SOL,
    wrongEcosystemAddress: EVM,
    params: { transactionsBase64: ['AQID', 'BAUG'] },
  },
  {
    method: 'sol_signMessage',
    address: SOL,
    switchTo: SOL,
    wrongEcosystemAddress: EVM,
    params: { messageSerialized: 'aGVsbG8=' },
  },
  {
    method: 'eth_sendTransaction',
    address: EVM,
    switchTo: EVM,
    wrongEcosystemAddress: SOL,
    params: [TRANSACTION, { clientScope: 'Swap' }],
  },
  {
    method: 'eth_signTypedData_v4',
    address: EVM,
    switchTo: EVM,
    wrongEcosystemAddress: SOL,
    params: [EVM, TYPED_DATA],
  },
  {
    method: 'personal_sign',
    address: EVM,
    switchTo: EVM,
    wrongEcosystemAddress: SOL,
    params: ['hello', EVM, ''],
  },
];

const APPROVAL_ROUTE: Record<MethodName, string> = {
  sol_signTransaction: '/sendTransaction',
  sol_signAndSendTransaction: '/sendTransaction',
  sol_signAllTransactions: '/sendTransaction',
  sol_signMessage: '/signMessage',
  eth_sendTransaction: '/sendTransaction',
  eth_signTypedData_v4: '/signTypedData',
  personal_sign: '/signMessage',
};

const APPROVAL_VALUE: Record<MethodName, unknown> = {
  sol_signTransaction: 'sol-signature',
  sol_signAndSendTransaction: 'sol-signature',
  sol_signAllTransactions: ['sol-signature'],
  sol_signMessage: 'sol-signature',
  eth_sendTransaction: '0xtransaction-hash',
  eth_signTypedData_v4: '0xsignature',
  personal_sign: '0xsignature',
};

function genericCases({ method, address, switchTo, wrongEcosystemAddress, params }: MethodCase) {
  const base = { method, params };
  const cases: Config[] = [
    {
      ...base,
      label: 'refuses when there is no current wallet',
      state: { address: null, ensureThrows: true },
    },
    {
      ...base,
      label: 'refuses when the site is not connected',
      state: { connected: false },
    },
    {
      ...base,
      label: 'refuses when the context has no origin',
      context: { tabId: 3 },
    },
    {
      ...base,
      label: 'refuses when the user dismisses the ecosystem switch',
      state: { address: wrongEcosystemAddress },
      responses: [{ kind: 'dismiss-ecosystem' }],
    },
    {
      ...base,
      label: 'rejects an ecosystem switch that resolves a wrong-ecosystem address',
      state: { address: wrongEcosystemAddress },
      responses: [{ kind: 'resolve-ecosystem', address: wrongEcosystemAddress }],
    },
    {
      ...base,
      label: 'refuses when the user dismisses the signing dialog',
      responses: [{ kind: 'dismiss-signing' }],
    },
    {
      ...base,
      label: 'tells the window to reject when the dapp is phishing',
      phishing: true,
    },
    {
      ...base,
      label: 'opens one dialog and returns what the user resolves',
      responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
    },
    {
      ...base,
      label: 'opens a tab for a bluetooth hardware wallet',
      state: { device: true, bluetooth: true },
      responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
    },
    {
      ...base,
      label: 'opens a dialog for a hardware wallet without bluetooth',
      state: { device: true, bluetooth: false },
      responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
    },
    {
      ...base,
      label: 'opens a dialog for a software wallet',
      state: { device: false },
      responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
    },
    {
      ...base,
      label: 'switches to the wallet the user picks and then opens the signing dialog',
      state: { address: wrongEcosystemAddress },
      responses: [
        { kind: 'resolve-ecosystem', address: switchTo },
        { kind: 'resolve-signing', value: APPROVAL_VALUE[method] },
      ],
    },
    {
      ...base,
      label: 'defaults tabId to null when the context has none',
      context: { origin: ORIGIN },
      responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
    },
    {
      ...base,
      label: 'does not send clientScope when the parameters omit it',
      params: Array.isArray(params) ? [params[0]] : { ...(params as object), clientScope: '' },
      responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
    },
    {
      ...base,
      label:
        'refuses when the site is connected to the wallet from before the switch but not the picked one',
      state: { address: wrongEcosystemAddress, connectedAddresses: [wrongEcosystemAddress] },
      responses: [{ kind: 'resolve-ecosystem', address: switchTo }],
    },
    {
      ...base,
      label:
        'opens the signing dialog when the site is connected to the picked wallet but not the previous one',
      state: { address: wrongEcosystemAddress, connectedAddresses: [switchTo] },
      responses: [
        { kind: 'resolve-ecosystem', address: switchTo },
        { kind: 'resolve-signing', value: APPROVAL_VALUE[method] },
      ],
    },
  ];
  return cases.map((config) => ({
    ...config,
    state: { ...config.state, address: config.state?.address ?? address },
  }));
}

function perMethodCases({ method }: MethodCase): Config[] {
  switch (method) {
    case 'sol_signTransaction':
    case 'sol_signAndSendTransaction':
      return [
        {
          method,
          label: 'opens a dialog when txBase64 is missing',
          params: {},
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label: 'opens a dialog when txBase64 is not a string',
          params: { txBase64: 42 },
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
      ];
    case 'sol_signAllTransactions':
      return [
        {
          method,
          label: 'opens a dialog when the batch is missing',
          params: {},
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label: 'opens a dialog for an empty batch',
          params: { transactionsBase64: [] },
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
      ];
    case 'sol_signMessage':
      return [
        {
          method,
          label: 'throws when the message is missing',
          params: {},
        },
        {
          method,
          label: 'opens a dialog when the message is empty',
          params: { messageSerialized: '' },
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label: 'throws when the message is not base64',
          params: { messageSerialized: 'not base64!' },
        },
      ];
    case 'eth_sendTransaction':
      return [
        {
          method,
          label: 'refuses an empty params array',
          params: [],
        },
        {
          method,
          label: 'opens a dialog when the transaction slot is the number 0 (not rejected)',
          params: [0],
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label: 'refuses a null transaction',
          params: [null],
        },
        {
          method,
          label:
            "pins whether the permission check uses the parameters' address or the current one",
          state: { address: OTHER_EVM, connectedAddresses: [EVM] },
          params: [{ from: EVM, to: OTHER_EVM, value: '0x1' }],
        },
      ];
    case 'eth_signTypedData_v4':
      return [
        {
          method,
          label: 'refuses an address different from the current one',
          params: [OTHER_EVM, TYPED_DATA],
        },
        {
          method,
          label: 'accepts an address in a different case',
          params: [EVM.toLowerCase(), TYPED_DATA],
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label: 'accepts a stringified typed data payload',
          params: [EVM, JSON.stringify(TYPED_DATA)],
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label: 'passes a malformed typed data payload through unchanged',
          params: [EVM, '{"types":"not an object"}'],
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label:
            "pins whether the permission check uses the parameters' address or the current one",
          state: { address: OTHER_EVM, connectedAddresses: [EVM] },
          params: [EVM, TYPED_DATA],
        },
      ];
    case 'personal_sign':
      return [
        {
          method,
          label: 'refuses when there are no parameters',
          params: [],
        },
        {
          method,
          label: 'refuses when neither parameter is an address',
          params: ['hello', 'world'],
        },
        {
          method,
          label: 'refuses an address different from the current one',
          params: ['hello', OTHER_EVM, ''],
        },
        {
          method,
          label: 'accepts the parameters in the spec order with a lower-case address',
          params: ['hello', EVM.toLowerCase(), ''],
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[method] }],
        },
        {
          method,
          label:
            "pins whether the permission check uses the parameters' address or the current one",
          state: { address: OTHER_EVM, connectedAddresses: [EVM] },
          params: ['hello', EVM, ''],
        },
      ];
  }
}

function orderingCases({ method, params }: MethodCase): Config[] {
  const cases: Config[] = [
    {
      method,
      label: 'pins which error wins when the site is not connected and the parameters are invalid',
      state: { connected: false },
      params: [],
    },
    {
      method,
      label: 'pins which error wins when there is no current wallet and the site is not connected',
      state: { address: null, connected: false },
      params: [],
    },
  ];
  if (method === 'personal_sign') {
    cases.push({
      method,
      label: 'pins whether the address comparison or the connection check runs first',
      state: { connected: false },
      params: ['hello', OTHER_EVM, ''],
    });
  }
  if (method === 'eth_signTypedData_v4') {
    cases.push({
      method,
      label: 'pins whether the address comparison or the connection check runs first',
      state: { connected: false },
      params: [OTHER_EVM, TYPED_DATA],
    });
  }
  if (method === 'eth_sendTransaction') {
    cases.push({
      method,
      label: 'pins whether the missing transaction or the connection check runs first',
      state: { connected: false },
      params: [],
    });
  }
  return cases.map((config) => ({ ...config, params: config.params ?? params }));
}

const ALL_CASES: Config[] = METHODS.flatMap((methodCase) => [
  ...genericCases(methodCase),
  ...perMethodCases(methodCase),
  ...orderingCases(methodCase),
]);

describe('PublicController signing methods', () => {
  beforeEach(() => {
    phishing.checkDapp.mockReset();
    phishing.checkDapp.mockResolvedValue({ status: 'ok', isWhitelisted: false });
    phishing.blockOriginWithWarning.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recorded behaviour of every method and refusal', () => {
    it.each(ALL_CASES.map((config) => [`${config.method}: ${config.label}`, config] as const))(
      '%s',
      async (_label, config) => {
        const { record } = await run(config);
        expect(record).toMatchSnapshot();
      },
    );
  });

  describe('refusals are explicit', () => {
    const approvalRoutes = ['/sendTransaction', '/signMessage', '/signTypedData'];

    it.each(METHODS.map((methodCase) => [methodCase.method, methodCase] as const))(
      '%s refuses when there is no current wallet and opens no approval dialog',
      async (_method, methodCase) => {
        const { outcome, harness } = await run({
          method: methodCase.method,
          params: methodCase.params,
          state: { address: null, ensureThrows: true },
        });
        expect(outcome.throws).toBeInstanceOf(Error);
        expect((outcome.throws as Error).message).toBe('Wallet is not initialized');
        expect(harness.opened.map((props) => props.route)).toEqual([]);
      },
    );

    it.each(METHODS.map((methodCase) => [methodCase.method, methodCase] as const))(
      '%s refuses with OriginNotAllowed when the site is not connected',
      async (_method, methodCase) => {
        const { outcome, harness } = await run({
          method: methodCase.method,
          params: methodCase.params,
          state: { connected: false },
        });
        const error = outcome.throws as Error & { code?: number };
        expect(error.constructor.name).toBe('OriginNotAllowed');
        expect(error.code).toBe(4100);
        expect(error.message).toBe('Origin Not Allowed: Try calling eth_requestAccounts first.');
        const routes = harness.opened.map((props) => props.route);
        expect(routes.filter((route) => approvalRoutes.includes(route))).toEqual([]);
      },
    );

    it.each(METHODS.map((methodCase) => [methodCase.method, methodCase] as const))(
      '%s refuses with UserRejected when the user dismisses the ecosystem switch',
      async (_method, methodCase) => {
        const {
          outcome,
          harness,
          harness: { opened },
        } = await run({
          method: methodCase.method,
          params: methodCase.params,
          state: { address: methodCase.wrongEcosystemAddress },
          responses: [{ kind: 'dismiss-ecosystem' }],
        });
        const error = outcome.throws as Error & { code?: number };
        expect(error.constructor.name).toBe('UserRejected');
        expect(error.code).toBe(4001);
        expect(error.message).toBe('User rejected ecosystem wallet switch');
        expect(opened.map((props) => props.route)).toEqual(['/selectConnectedWallet']);
        expect(harness.setCurrentAddressCalls).toEqual([]);
      },
    );

    it.each(METHODS.map((methodCase) => [methodCase.method, methodCase] as const))(
      '%s refuses with UserRejectedTxSignature when the user dismisses the signing dialog',
      async (_method, methodCase) => {
        const { outcome, harness } = await run({
          method: methodCase.method,
          params: methodCase.params,
          responses: [{ kind: 'dismiss-signing' }],
        });
        const error = outcome.throws as Error & { code?: number };
        expect(error.constructor.name).toBe('UserRejectedTxSignature');
        expect(error.code).toBe(4001);
        expect(error.message).toBe('Tx Signature: User denied transaction signature.');
        expect(harness.opened).toHaveLength(1);
      },
    );
  });

  describe('the permission check asks about the address that will sign', () => {
    it.each(METHODS.map((methodCase) => [methodCase.method, methodCase] as const))(
      '%s checks the connection of the current address on an approved request',
      async (_method, methodCase) => {
        const { harness } = await run({
          method: methodCase.method,
          params: methodCase.params,
          responses: [{ kind: 'resolve-signing', value: APPROVAL_VALUE[methodCase.method] }],
        });
        expect(harness.allowedOriginCalls).toEqual([
          { origin: ORIGIN, address: methodCase.address },
        ]);
      },
    );

    it.each(METHODS.map((methodCase) => [methodCase.method, methodCase] as const))(
      '%s checks the connection of the address the user picked after an ecosystem switch',
      async (_method, methodCase) => {
        const { harness } = await run({
          method: methodCase.method,
          params: methodCase.params,
          state: {
            address: methodCase.wrongEcosystemAddress,
            connectedAddresses: [methodCase.switchTo],
          },
          responses: [
            { kind: 'resolve-ecosystem', address: methodCase.switchTo },
            { kind: 'resolve-signing', value: APPROVAL_VALUE[methodCase.method] },
          ],
        });
        expect(harness.setCurrentAddressCalls).toEqual([methodCase.switchTo]);
        // The old address is never asked about: the check runs after the switch
        expect(harness.allowedOriginCalls).toEqual([
          { origin: ORIGIN, address: methodCase.switchTo },
        ]);
        expect(harness.opened.map((props) => props.route)).toEqual([
          '/selectConnectedWallet',
          APPROVAL_ROUTE[methodCase.method],
        ]);
      },
    );
  });
});
