import { ethers } from 'ethers';

export const DEBUGGING_TX_HASH = '0x123123';

export function createMockReceipt() {
  return {
    blockHash:
      '0xe485aa7e58d3338909fdc77fc7445da5f552e260dc23bdfe285a2adbe54b4f64',
    blockNumber: 31658369,
    byzantium: true,
    confirmations: 1,
    contractAddress: '',
    cumulativeGasUsed: {},
    effectiveGasPrice: {},
    from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
    gasUsed: {},
    logs: [],
    logsBloom: '0x002000...',
    status: 1,
    to: '0xd7F1Dd5D49206349CaE8b585fcB0Ce3D96f1696F',
    transactionHash: DEBUGGING_TX_HASH,
    transactionIndex: 6,
    type: 2,
  } as unknown as ethers.providers.TransactionReceipt;
}

export function createMockTxResponse() {
  return {
    accessList: [],
    chainId: 1,
    confirmations: 0,
    data: '0x095ea7b3000000000000000000000000d7f1dd5d49206349cae8b585fcb0ce3d96f1696fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
    gasLimit: ethers.BigNumber.from(1337),
    gasPrice: null,
    hash: DEBUGGING_TX_HASH,
    maxFeePerGas: {},
    maxPriorityFeePerGas: {},
    nonce: 5000,
    to: '0xd7F1Dd5D49206349CaE8b585fcB0Ce3D96f1696F',
    type: 2,
    value: {},
  } as unknown as ethers.providers.TransactionResponse;
}
