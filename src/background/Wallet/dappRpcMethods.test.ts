import { DAPP_RPC_METHODS, isDappRpcMethod } from './dappRpcMethods';

describe('isDappRpcMethod', () => {
  it('accepts the methods a dapp is meant to call', () => {
    expect(isDappRpcMethod('eth_requestAccounts')).toBe(true);
    expect(isDappRpcMethod('personal_sign')).toBe(true);
    expect(isDappRpcMethod('sol_signAndSendTransaction')).toBe(true);
  });

  it('rejects helpers that exist on the controller but are not RPC methods', () => {
    expect(isDappRpcMethod('showCorrectEcosystemWalletSelection')).toBe(false);
    expect(isDappRpcMethod('safeOpenDialogWindow')).toBe(false);
    expect(isDappRpcMethod('getIsAllowedOrigin')).toBe(false);
    expect(isDappRpcMethod('generatePermissionResponse')).toBe(false);
    expect(isDappRpcMethod('requireConnectedAccount')).toBe(false);
    expect(isDappRpcMethod('openSigningDialog')).toBe(false);
  });

  it('rejects names every object has', () => {
    expect(isDappRpcMethod('constructor')).toBe(false);
    expect(isDappRpcMethod('toString')).toBe(false);
    expect(isDappRpcMethod('__proto__')).toBe(false);
  });

  it('rejects methods the wallet leaves to the RPC node, and non-strings', () => {
    expect(isDappRpcMethod('eth_getBalance')).toBe(false);
    expect(isDappRpcMethod(undefined)).toBe(false);
    expect(isDappRpcMethod(42)).toBe(false);
  });

  it('lists only namespaced RPC names', () => {
    const notNamespaced = DAPP_RPC_METHODS.filter(
      (name) => !/^(eth|sol|net|wallet|personal)_/.test(name),
    );
    expect(notNamespaced).toEqual([]);
  });
});
