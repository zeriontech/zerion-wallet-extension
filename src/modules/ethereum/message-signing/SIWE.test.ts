import { SiweMessage, SiweError, SiweErrorType } from './SIWE';

export interface SiweMessageFields {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: Array<string>;
}

interface PositiveTestCase {
  message: string;
  fields: SiweMessageFields;
}

const testCases: {
  positive: Record<string, PositiveTestCase>;
  negative: Record<string, string>;
} = {
  positive: {
    lenster: {
      message:
        'https://lenster.xyz wants you to sign in with your Ethereum account:\n0x3083A9c26582C01Ec075373A8327016A15c1269B\n\nSign in with ethereum to lens\n\nURI: https://lenster.xyz\nVersion: 1\nChain ID: 137\nNonce: a83183e64822e4a4\nIssued At: 2023-02-25T14:34:03.642Z',
      fields: {
        domain: 'https://lenster.xyz',
        address: '0x3083A9c26582C01Ec075373A8327016A15c1269B',
        statement: 'Sign in with ethereum to lens',
        uri: 'https://lenster.xyz',
        version: '1',
        chainId: 137,
        nonce: 'a83183e64822e4a4',
        issuedAt: '2023-02-25T14:34:03.642Z',
      },
    },
    'couple of optional fields': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z\nResources:\n- ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu\n- https://example.com/my-web2-claim.json',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
        resources: [
          'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
          'https://example.com/my-web2-claim.json',
        ],
      },
    },
    'no optional field': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'timestamp without microseconds': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24Z',
      },
    },
    'domain is RFC 3986 authority with IP': {
      message:
        '127.0.0.1 wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: '127.0.0.1',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'domain is RFC 3986 authority with userinfo': {
      message:
        'test@127.0.0.1 wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'test@127.0.0.1',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'domain is RFC 3986 authority with port': {
      message:
        '127.0.0.1:8080 wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: '127.0.0.1:8080',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'domain is localhost authority with port': {
      message:
        'localhost:8080 wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'localhost:8080',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'domain is RFC 3986 authority with userinfo and port': {
      message:
        'test@127.0.0.1:8080 wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'test@127.0.0.1:8080',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        statement:
          'I accept the ServiceOrg Terms of Service: https://service.org/tos',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'no statement': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'domain ipv6': {
      message:
        '[::cafe] wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: '[::cafe]',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'uri ipv6': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\nURI: https://[::cafe]\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://[::cafe]',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'uri ipv4': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\nURI: https://127.0.0.1\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://127.0.0.1',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'uri with port': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\nURI: https://127.0.0.1:4361\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://127.0.0.1:4361',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'uri ipv4 query params and fragment': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\nURI: https://127.0.0.1/?query=one#begin\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://127.0.0.1/?query=one#begin',
        version: '1',
        chainId: 1,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'chainId not 1': {
      message:
        'service.org wants you to sign in with your Ethereum account:\n0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 4\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z',
      fields: {
        domain: 'service.org',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uri: 'https://service.org/login',
        version: '1',
        chainId: 4,
        nonce: '32891757',
        issuedAt: '2021-09-30T16:25:24.000Z',
      },
    },
    'recovery byte starting at 0': {
      message:
        'www.tally.xyz wants you to sign in with your Ethereum account:\n0xc95EB884FE852e241D409234bfC7045CB9E31BD7\n\nSign in with Ethereum to Tally\n\nURI: https://tally.xyz\nVersion: 1\nChain ID: 1\nNonce: 15050747\nIssued At: 2022-06-30T14:08:51.382Z',
      fields: {
        domain: 'www.tally.xyz',
        address: '0xc95EB884FE852e241D409234bfC7045CB9E31BD7',
        statement: 'Sign in with Ethereum to Tally',
        uri: 'https://tally.xyz',
        version: '1',
        chainId: 1,
        nonce: '15050747',
        issuedAt: '2022-06-30T14:08:51.382Z',
      },
    },
  },
  negative: {
    'missing domain':
      ' wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'missing address':
      'service.org wants you to sign in with your Ethereum account:\n\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'missing uri':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\n\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'missing version':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\n\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'missing chainId':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\n\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'missing nonce':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\n\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'missing issuedAt':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\n\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'out of order uri':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nVersion: 1\nURI: https://service.org/login\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'out of order version':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nChain ID: 1\nVersion: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'out of order chainId':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nNonce: 12341234Chain ID: 1\n\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'out of order nonce':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nIssued At: 2022-03-17T12:45:13.610Z\nNonce: 12341234\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'out of order issuedAt':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nExpiration Time: 2023-03-17T12:45:13.610Z\nIssued At: 2022-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'out of order expirationTime':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'out of order notBefore':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nRequest ID: some_id\nNot Before: 2022-03-17T12:45:13.610Z\nResources:\n- https://service.org/login',
    'out of order requestId':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nResources:\n- https://service.org/login\nRequest ID: some_id',
    'out of order resources':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nResources:\n- https://service.org/login\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id',
    'domain not RFC4501 authority':
      '#notrfc4501 wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'address not EIP-55':
      'service.org wants you to sign in with your Ethereum account:\n0xe5a12547fe4e872d192e3ececb76f2ce1aea4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'statement has line break':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: \nhttps://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'uri is non-RFC 3986':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: :not_a_rfc3986_valid_uri_\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'version not 1':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 3\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'not a valid chainId':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: ?\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'nonce with less then 8 chars':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 1234567\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'non-ISO 8601 issuedAt':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: Wed Oct 05 2011 16:48:00 GMT+0200 (CEST)\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'non-ISO 8601 expirationTime':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: Wed Oct 05 2011 16:48:00 GMT+0200 (CEST)\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'non-ISO 8601 notBefore':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: Wed Oct 05 2011 16:48:00 GMT+0200 (CEST)\nRequest ID: some_id\nResources:\n- https://service.org/login',
    'resources not separated by line break':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login - https://service.org/login/2',
    'first resource not-RFC 3986':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- :not_a_rfc3986_valid_uri_\n- https://service.org/login',
    'second resource is not-RFC3986':
      'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-03-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login\n- :not_a_rfc3986_valid_uri_',
  },
};

describe('SIWE (EIP-4361)', () => {
  describe('parse', () => {
    test.concurrent.each(Object.entries(testCases.positive))(
      'successfully parses message: %s',
      (_name: string, { message, fields }: PositiveTestCase) => {
        const parsed = SiweMessage.parse(message);
        expect(parsed.domain).toBe(fields.domain);
        expect(parsed.address).toBe(fields.address);
        expect(parsed.statement).toBe(fields.statement);
        expect(parsed.uri).toBe(fields.uri);
        expect(parsed.version).toBe(fields.version);
        expect(parsed.chainId).toBe(fields.chainId);
        expect(parsed.nonce).toBe(fields.nonce);
        expect(parsed.issuedAt).toBe(fields.issuedAt);
        expect(parsed.expirationTime).toBe(fields.expirationTime);
        expect(parsed.notBefore).toBe(fields.notBefore);
        expect(parsed.requestId).toBe(fields.requestId);
        expect(parsed.resources).toStrictEqual(fields.resources);
      }
    );

    test.concurrent.each(Object.entries(testCases.negative))(
      'fails to parse message: %s',
      (_name: string, message: string) => {
        try {
          SiweMessage.parse(message);
        } catch (error) {
          expect(
            Object.values(SiweErrorType).includes((error as SiweError).type)
          );
        }
      }
    );
  });

  describe('validate', () => {
    it('fails if domain does not equal origin', () => {
      const message =
        'https://lenster.xyz wants you to sign in with your Ethereum account:\n0x3083A9c26582C01Ec075373A8327016A15c1269B\n\nSign in with ethereum to lens\n\nURI: https://lenster.xyz\nVersion: 1\nChain ID: 137\nNonce: a83183e64822e4a4\nIssued At: 2023-02-25T14:34:03.642Z';
      const parsed = SiweMessage.parse(message);
      try {
        parsed.validate(new URL('https://whatever'), new Date().getTime());
      } catch (error) {
        expect((error as SiweError).type).toBe(SiweErrorType.DOMAIN_MISMATCH);
      }
    });

    it('fails if "Expiration Time" is in the past', () => {
      const message =
        'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 2023-02-17T12:45:13.610Z\nNot Before: 2022-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login';
      const parsed = SiweMessage.parse(message);
      try {
        parsed.validate(new URL('https://service.org'), new Date().getTime());
      } catch (error) {
        expect((error as SiweError).type).toBe(SiweErrorType.EXPIRED_MESSAGE);
      }
    });

    it('fails if "Not Before" is in the future', () => {
      const message =
        'service.org wants you to sign in with your Ethereum account:\n0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946\n\nI accept the ServiceOrg Terms of Service: https://service.org/tos\n\nURI: https://service.org/login\nVersion: 1\nChain ID: 1\nNonce: 12341234\nIssued At: 2022-03-17T12:45:13.610Z\nExpiration Time: 3023-02-17T12:45:13.610Z\nNot Before: 3023-03-17T12:45:13.610Z\nRequest ID: some_id\nResources:\n- https://service.org/login';
      const parsed = SiweMessage.parse(message);
      try {
        parsed.validate(new URL('https://service.org'), new Date().getTime());
      } catch (error) {
        expect((error as SiweError).type).toBe(
          SiweErrorType.INVALID_NOT_BEFORE
        );
      }
    });
  });
});
