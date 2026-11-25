import type { TypedData } from './TypedData';

/**
 * The two public SafeTx vectors pinned by the CLI's typed-data work
 * (`cli/tests/fixtures/safe/` in `zeriontech/zerion-ai`), copied verbatim.
 * They are the only fixtures the SafeTx tests use: base 1.4.1 with a single
 * USDC transfer (operation 0) and an ethereum 1.4.1 MultiSend with two inner
 * calls (operation 1).
 *
 * Pinned hashes:
 * - base safeTxHash     0x81c02e13c21dc26f71f1c94dc233c1dc7bf12d8189b458daab9f07cac64da066
 * - base domain hash    0xb89121fe82944114dd49224f7219ca42785bb0363a39a5cd7b6dad86c12f5515
 * - base message hash   0x0d68966637917feadaf6b047f55bb1018612dc2416a6bcd0e252aec255de6bc7
 * - ethereum safeTxHash 0x59ad050aef49aafac0adcee7bc0fa9db1bf2608e8ee7582e3c13404b818a1cc5
 */

export const BASE_SAFE = '0xd2e580A552Cb7a6B87E45eDe8f0102698c476d7F';
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const BASE_TRANSFER_RECIPIENT = '0x29b66aa16b8fc99b2bd47c4030491e469ade297c';
export const BASE_TRANSFER_AMOUNT = 250_000_000n; // 250 USDC at 6 decimals

export const BASE_SAFE_TX_HASH =
  '0x81c02e13c21dc26f71f1c94dc233c1dc7bf12d8189b458daab9f07cac64da066';
export const BASE_DOMAIN_HASH =
  '0xb89121fe82944114dd49224f7219ca42785bb0363a39a5cd7b6dad86c12f5515';
export const BASE_MESSAGE_HASH =
  '0x0d68966637917feadaf6b047f55bb1018612dc2416a6bcd0e252aec255de6bc7';

export const ETHEREUM_SAFE = '0xF2900ED955194668afA92c08274d604C5aB7D652';
export const ETHEREUM_MULTISEND_CALL_ONLY = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2';
export const ETHEREUM_SAFE_TX_HASH =
  '0x59ad050aef49aafac0adcee7bc0fa9db1bf2608e8ee7582e3c13404b818a1cc5';

const BASE_SAFE_TX_TYPES = {
  EIP712Domain: [
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  SafeTx: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'operation', type: 'uint8' },
    { name: 'safeTxGas', type: 'uint256' },
    { name: 'baseGas', type: 'uint256' },
    { name: 'gasPrice', type: 'uint256' },
    { name: 'gasToken', type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** `base-1.4.1-op0.json` `.typedData` */
export const BASE_TYPED_DATA: TypedData = {
  domain: { chainId: 8453, verifyingContract: BASE_SAFE },
  types: BASE_SAFE_TX_TYPES,
  primaryType: 'SafeTx',
  message: {
    to: BASE_USDC,
    value: '0',
    data: '0xa9059cbb00000000000000000000000029b66aa16b8fc99b2bd47c4030491e469ade297c000000000000000000000000000000000000000000000000000000000ee6b280',
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce: '78',
  },
};

/** `ethereum-1.4.1-multisend.json` `.typedData` */
export const ETHEREUM_MULTISEND_TYPED_DATA: TypedData = {
  domain: { chainId: 1, verifyingContract: ETHEREUM_SAFE },
  types: BASE_SAFE_TX_TYPES,
  primaryType: 'SafeTx',
  message: {
    to: ETHEREUM_MULTISEND_CALL_ONLY,
    value: '0',
    data: '0x8d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000132000dc4f92879b7670e5f4e4e6e3c801d229129d90d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000f80eeec09f417fa7fcc4a848ef03af9df2658d7bffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00f80eeec09f417fa7fcc4a848ef03af9df2658d7b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000442608f81800000000000000000000000095cbbda273e74ec190b93a629412c204614ecaa4ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000',
    operation: 1,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce: '3519',
  },
};
