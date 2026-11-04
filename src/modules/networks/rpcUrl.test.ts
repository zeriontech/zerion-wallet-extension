import { maybeProxyRpcUrl } from './rpcUrl';

describe('maybeProxyRpcUrl', () => {
  test('routes Zerion RPC through the proxy', () => {
    expect(
      maybeProxyRpcUrl(
        'https://rpc.zerion.io/v1/ethereum?foo=bar',
        'http://127.0.0.1:4789/rpc'
      )
    ).toBe('http://127.0.0.1:4789/rpc/v1/ethereum?foo=bar');
  });

  test('keeps non-Zerion RPC URLs unchanged', () => {
    expect(
      maybeProxyRpcUrl(
        'https://rpc.example.com/v1/ethereum',
        'http://127.0.0.1:4789/rpc'
      )
    ).toBe('https://rpc.example.com/v1/ethereum');
  });

  test('is a no-op without a proxy base', () => {
    expect(maybeProxyRpcUrl('https://rpc.zerion.io/v1/ethereum', null)).toBe(
      'https://rpc.zerion.io/v1/ethereum'
    );
  });
});
