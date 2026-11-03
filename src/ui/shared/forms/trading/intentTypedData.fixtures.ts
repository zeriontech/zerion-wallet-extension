import type { TypedDataDocument } from 'src/shared/types/Quote';

/** EIP-712 documents from transaction-builder-go testdata @46581e7; long calldata shortened */
export const ZEROX_GASLESS_PERMIT: TypedDataDocument = {
  types: {
    EIP712Domain: [
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'version',
        type: 'string',
      },
      {
        name: 'chainId',
        type: 'uint256',
      },
      {
        name: 'verifyingContract',
        type: 'address',
      },
    ],
    Permit: [
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
      },
      {
        name: 'nonce',
        type: 'uint256',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
    ],
  },
  domain: {
    name: 'USD Coin',
    version: '2',
    chainId: 8453,
    verifyingContract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  },
  message: {
    owner: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
    spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
    value:
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    nonce: 0,
    deadline: '1783515667',
  },
  primaryType: 'Permit',
};

export const ZEROX_GASLESS_TRADE: TypedDataDocument = {
  types: {
    TokenPermissions: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    SlippageAndActions: [
      {
        name: 'recipient',
        type: 'address',
      },
      {
        name: 'buyToken',
        type: 'address',
      },
      {
        name: 'minAmountOut',
        type: 'uint256',
      },
      {
        name: 'actions',
        type: 'bytes[]',
      },
    ],
    PermitWitnessTransferFrom: [
      {
        name: 'permitted',
        type: 'TokenPermissions',
      },
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'nonce',
        type: 'uint256',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
      {
        name: 'slippageAndActions',
        type: 'SlippageAndActions',
      },
    ],
    EIP712Domain: [
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'chainId',
        type: 'uint256',
      },
      {
        name: 'verifyingContract',
        type: 'address',
      },
    ],
  },
  domain: {
    name: 'Permit2',
    chainId: 8453,
    verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
  },
  message: {
    permitted: {
      token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      amount: '100000000',
    },
    spender: '0x68a14203953130ae840e37dbe3d64c1e6858da7b',
    nonce: '2241959297937691820908574931991606',
    deadline: '1783429566',
    slippageAndActions: {
      recipient: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
      buyToken: '0x4200000000000000000000000000000000000006',
      minAmountOut: '55173585948043068',
      actions: [
        '0x0dfeb41900000000000000000000000068a14203953130ae840e37dbe3d64c1e6858da7b',
      ],
    },
  },
  primaryType: 'PermitWitnessTransferFrom',
};

export const RELAY_RECEIVE_WITH_AUTHORIZATION: TypedDataDocument = {
  domain: {
    name: 'USD Coin',
    version: '2',
    chainId: 8453,
    verifyingContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  types: {
    ReceiveWithAuthorization: [
      {
        name: 'from',
        type: 'address',
      },
      {
        name: 'to',
        type: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
      },
      {
        name: 'validAfter',
        type: 'uint256',
      },
      {
        name: 'validBefore',
        type: 'uint256',
      },
      {
        name: 'nonce',
        type: 'bytes32',
      },
    ],
  },
  primaryType: 'ReceiveWithAuthorization',
  message: {
    from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    to: '0xccc88a9d1b4ed6b0eaba998850414b24f1c315be',
    value: '5000000',
    validAfter: 0,
    validBefore: 1785326249,
    nonce: '0x1b00a9efc409973ebac9c373e84c66ad1e1c35ae523d3d77e750331e8785afd7',
  },
};

export const RELAY_PERMIT2_BATCH: TypedDataDocument = {
  domain: {
    name: 'Permit2',
    chainId: 8453,
    verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },
  types: {
    PermitBatchWitnessTransferFrom: [
      {
        name: 'permitted',
        type: 'TokenPermissions[]',
      },
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'nonce',
        type: 'uint256',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
      {
        name: 'witness',
        type: 'RelayerWitness',
      },
    ],
    TokenPermissions: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    RelayerWitness: [
      {
        name: 'relayer',
        type: 'address',
      },
      {
        name: 'refundTo',
        type: 'address',
      },
      {
        name: 'nftRecipient',
        type: 'address',
      },
      {
        name: 'metadata',
        type: 'bytes',
      },
      {
        name: 'call3Values',
        type: 'Call3Value[]',
      },
    ],
    Call3Value: [
      {
        name: 'target',
        type: 'address',
      },
      {
        name: 'allowFailure',
        type: 'bool',
      },
      {
        name: 'value',
        type: 'uint256',
      },
      {
        name: 'callData',
        type: 'bytes',
      },
    ],
  },
  primaryType: 'PermitBatchWitnessTransferFrom',
  message: {
    permitted: [
      {
        token: '0x4200000000000000000000000000000000000006',
        amount: '2000000000000000',
      },
    ],
    nonce: '90497376344974',
    deadline: 1785846867,
    spender: '0xccc88a9d1b4ed6b0eaba998850414b24f1c315be',
    witness: {
      relayer: '0xf70da97812cb96acdf810712aa562db8dfa3dbef',
      refundTo: '0xf70da97812cb96acdf810712aa562db8dfa3dbef',
      nftRecipient: '0xf70da97812cb96acdf810712aa562db8dfa3dbef',
      metadata:
        '0xa0368de0988f4b6a161babaa78e9e879778a3bff51fff98072a759649b61a7d200',
      call3Values: [
        {
          target: '0xb92fe925dc43a0ecde6c8b1a2709c170ec4fff4f',
          allowFailure: false,
          value: 0,
          callData: '0x73b7bb2f',
        },
      ],
    },
  },
};

export const UNISWAPX_DUTCH_V2: TypedDataDocument = {
  domain: {
    name: 'Permit2',
    chainId: 1,
    verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
  },
  types: {
    PermitWitnessTransferFrom: [
      {
        name: 'permitted',
        type: 'TokenPermissions',
      },
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'nonce',
        type: 'uint256',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
      {
        name: 'witness',
        type: 'V2DutchOrder',
      },
    ],
    TokenPermissions: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    V2DutchOrder: [
      {
        name: 'info',
        type: 'OrderInfo',
      },
      {
        name: 'cosigner',
        type: 'address',
      },
      {
        name: 'baseInputToken',
        type: 'address',
      },
      {
        name: 'baseInputStartAmount',
        type: 'uint256',
      },
      {
        name: 'baseInputEndAmount',
        type: 'uint256',
      },
      {
        name: 'baseOutputs',
        type: 'DutchOutput[]',
      },
    ],
    OrderInfo: [
      {
        name: 'reactor',
        type: 'address',
      },
      {
        name: 'swapper',
        type: 'address',
      },
      {
        name: 'nonce',
        type: 'uint256',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
      {
        name: 'additionalValidationContract',
        type: 'address',
      },
      {
        name: 'additionalValidationData',
        type: 'bytes',
      },
    ],
    DutchOutput: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'startAmount',
        type: 'uint256',
      },
      {
        name: 'endAmount',
        type: 'uint256',
      },
      {
        name: 'recipient',
        type: 'address',
      },
    ],
  },
  primaryType: 'PermitWitnessTransferFrom',
  message: {
    permitted: {
      token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      amount: '5000000000',
    },
    spender: '0x00000011F84B9aa48e5f8aA8B9897600006289Be',
    nonce:
      '1993352846920734032634734350928880511572699632845146716255647359580601202434',
    deadline: 1785331177,
    witness: {
      info: {
        reactor: '0x00000011F84B9aa48e5f8aA8B9897600006289Be',
        swapper: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        nonce:
          '1993352846920734032634734350928880511572699632845146716255647359580601202434',
        deadline: 1785331177,
        additionalValidationContract:
          '0x0000000000000000000000000000000000000000',
        additionalValidationData: '0x',
      },
      cosigner: '0x4449Cd34d1eb1FEDCF02A1Be3834FfDe8E6A6180',
      baseInputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      baseInputStartAmount: '5000000000',
      baseInputEndAmount: '5000000000',
      baseOutputs: [
        {
          token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          startAmount: '2606838986169813837',
          endAmount: '2580770596308115699',
          recipient: '0x3333333333333333333333333333333333333333',
        },
        {
          token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          startAmount: '17583631538646685',
          endAmount: '17407795223260218',
          recipient: '0x8888888888888888888888888888888888888888',
        },
      ],
    },
  },
};
