import { ethers } from 'ethers';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';
import { decodeMasked } from 'src/shared/wallet/encode-locally';
import { opaqueType } from 'src/shared/type-utils/Opaque';
import { signTypedData } from './signTypedData';

const sample = {
  typedData: {
    types: {
      Transaction: [
        { name: 'txType', type: 'uint256' },
        { name: 'from', type: 'uint256' },
        { name: 'to', type: 'uint256' },
        { name: 'gasLimit', type: 'uint256' },
        { name: 'gasPerPubdataByteLimit', type: 'uint256' },
        { name: 'maxFeePerGas', type: 'uint256' },
        { name: 'maxPriorityFeePerGas', type: 'uint256' },
        { name: 'paymaster', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'factoryDeps', type: 'bytes32[]' },
        { name: 'paymasterInput', type: 'bytes' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
    },
    domain: { name: 'zkSync', version: '2', chainId: '543210' },
    primaryType: 'Transaction',
    message: {
      txType: 113,
      from: '0xE093d671dA3D42fBf79BC333692a7A5f794EdDFb',
      to: '0x6a6394f47dd0baf794808f2749c09bd4ee874e70',
      gasLimit: '0x453f3',
      gasPerPubdataByteLimit: '0xc350',
      maxFeePerGas: '0x564eba0',
      maxPriorityFeePerGas: '0x0',
      paymaster: '0x4667ffb6a24017f977c93da1bd630cf1801343b6',
      nonce: '0x0',
      value: '0x0',
      data: '0xa9059cbb0000000000000000000000001b620fae836730584803dd11bca76bc393ba641900000000000000000000000000000000000000000000000000000000000fb770',
      factoryDeps: [],
      paymasterInput:
        '0x8c5a3445000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000674ebb8700000000000000000000000036615cf349d7f6344891b1e7ca7c72883f5dc049000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000417312857f0f0598c9dbfb0ef89cf69c81079b09582003ea4ba58ba888a7d8d0e61a845694b710c8405d9c54308e7f2c49031447d4935299e3913789422fa379db1c00000000000000000000000000000000000000000000000000000000000000',
    },
  },
  /** The key is supposed to be empty. It's masked only to avoid automatic detection by tools and bots */
  sampleKey: opaqueType<LocallyEncoded>(
    'AkhQUBgIB0wGAQEHAwQUUw9PA11UCFBVHwQPH1BeAAVQV0kEBh5VCAIDAwZMU1QbBgoGAQAESFFQTwQNUFNXABUG'
  ),
  signature:
    '0x3f95712ebab7d433d35532e32282785ada5749f28ed4c8b8a535146b7657452e21d22e79cce97c43709ef8d958865696ea6b1a43edc0cf1e517d3a46e23d63341c',
};

describe('signTypedData', () => {
  test('Created expected signature from typedData', async () => {
    const key = decodeMasked(sample.sampleKey);
    const signer = new ethers.Wallet(key);
    const signature = await signTypedData(sample.typedData, signer);
    expect(signature).toBe(sample.signature);
  });
});
