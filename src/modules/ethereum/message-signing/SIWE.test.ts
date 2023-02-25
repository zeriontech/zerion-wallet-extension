import { Message } from './SIWE';

describe('SIWE (EIP-4361)', () => {
  const testCases = [
    `service.invalid wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

I accept the ServiceOrg Terms of Service: https://service.invalid/tos

URI: https://service.invalid/login
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z
Resources:
- ipfs://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq/
- https://example.com/my-web2-claim.json`,

    `https://lenster.xyz wants you to sign in with your Ethereum account:
0x3083A9c26582C01Ec075373A8327016A15c1269B

Sign in with ethereum to lens

URI: https://lenster.xyz
Version: 1
Chain ID: 137
Nonce: a83183e64822e4a4
Issued At: 2023-02-25T14:34:03.642Z`,
  ];

  it('should parse the EIP-4361 example message', () => {
    const message = Message.parse(testCases[0]);
    expect(message.domain).toBe('service.invalid');
    expect(message.address).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    expect(message.statement).toBe(
      'I accept the ServiceOrg Terms of Service: https://service.invalid/tos'
    );
    expect(message.uri).toBe('https://service.invalid/login');
    expect(message.version).toBe('1');
    expect(message.chainId).toBe(1);
    expect(message.nonce).toBe('32891756');
    expect(message.issuedAt).toBe('2021-09-30T16:25:24Z');
    expect(message.resources).toStrictEqual([
      'ipfs://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq/',
      'https://example.com/my-web2-claim.json',
    ]);
  });

  it('should parse Lenster sign-in message', () => {
    const message = Message.parse(testCases[1]);
    expect(message.domain).toBe('https://lenster.xyz');
    expect(message.address).toBe('0x3083A9c26582C01Ec075373A8327016A15c1269B');
    expect(message.statement).toBe('Sign in with ethereum to lens');
    expect(message.uri).toBe('https://lenster.xyz');
    expect(message.version).toBe('1');
    expect(message.chainId).toBe(137);
    expect(message.nonce).toBe('a83183e64822e4a4');
    expect(message.issuedAt).toBe('2023-02-25T14:34:03.642Z');
  });
});
