import { Interface, toBeHex } from 'ethers';
import { invariant } from 'src/shared/invariant';
import type { IncomingTransaction } from '../types/IncomingTransaction';

/**
 * In Ethers v6, toBeHex ensures the value is always represented as a valid
 * hexadecimal string with consistent zero-padding according to its byte length.
 * Example: toBeHex('0xde0b6b3a7640000') results in '0x0de0b6b3a7640000'
 * — it adds a leading 0 to make the total byte-length consistent.
 * To be safe and not break tests, we want to make the conversion compatible
 * with how ethers v5 worked
 */
export function toEthersV5CompatibleHexValue(value: string | number): string {
  const hex = toBeHex(value);
  return hex.replace(/^(0x0)(\w+)/, '0x$2');
}

export interface SendTransactionParams {
  tokenInterface: 'erc20' | 'native';
  /** Token contract address; required for erc-20 */
  inputToken: string | null;
  from: string;
  to: string;
  /** Amount in base units */
  value: string;
  chainId: string;
}

export type SendTransaction = IncomingTransaction & {
  from: string;
  to: string;
  data: string;
  chainId: string;
};

const erc20TransferAbi = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/** Inlined from `@zeriontech/transactions` (WLT-2470) */
export function createSendNativeOrContractTransaction({
  tokenInterface,
  from,
  to,
  value,
  chainId,
  inputToken,
}: SendTransactionParams): SendTransaction {
  const valueAsHex = toEthersV5CompatibleHexValue(value);
  if (tokenInterface === 'native') {
    return { from, to, value: valueAsHex, chainId, data: '0x' };
  } else if (tokenInterface === 'erc20') {
    invariant(inputToken, 'inputToken value is required for erc-20 tokens');
    const data = new Interface(erc20TransferAbi).encodeFunctionData(
      'transfer',
      [to, valueAsHex]
    );
    return { from, to: inputToken, data, chainId };
  } else {
    throw new Error('Unexpected token interface');
  }
}
