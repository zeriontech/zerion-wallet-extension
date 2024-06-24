import dotenv from 'dotenv';
dotenv.config();
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { invariant } from 'src/shared/invariant';
import { isCancelTx } from './accelerate-helpers';

const testAddress = process.env.TEST_WALLET_ADDRESS;

invariant(testAddress, 'TEST_WALLET_ADDRESS Env var not found');

const cancelTxSample = {
  id: '0xd188a791d2538e6a4dca6377300362fe1e196b00161321ecf5f345e2196739a1',
  address: testAddress,
  transaction: {
    accessList: [],
    chainId: 137,
    confirmations: 0,
    data: '0x',
    from: testAddress,
    gasLimit: {
      _hex: '0x5a3c',
      _isBigNumber: true,
    },
    gasPrice: null,
    hash: '0xd188a791d2538e6a4dca6377300362fe1e196b00161321ecf5f345e2196739a1',
    maxFeePerGas: {
      _hex: '0x24501f821d',
      _isBigNumber: true,
    },
    maxPriorityFeePerGas: {
      _hex: '0x09634297af',
      _isBigNumber: true,
    },
    nonce: 946,
    to: testAddress,
    type: 2,
    value: {
      _hex: '0x00',
      _isBigNumber: true,
    },
    chain: 'polygon',
    status: 'pending',
    fee: null,
    sponsored: false,
  },
  datetime: '2023-12-17T17:24:16.396Z',
  label: {
    type: 'to',
    value: testAddress,
    display_value: {
      text: '',
      wallet_address: testAddress,
    },
  },
  type: {
    display_value: 'Send',
    value: 'send',
  },
  content: null,
  local: true,
  relatedTransaction:
    '0x7852c04e7a7e00b09e5900146d0ac4dc2939da89f556a530e332278a4da21f68',
};

const otherTxSample = {
  ...cancelTxSample,
  address: '0x064bd35c9064fc3e628a3be3310a1cf65488103d',
};

test('isCancelTx', () => {
  expect(isCancelTx(cancelTxSample as AnyAddressAction)).toBe(true);
  expect(isCancelTx(otherTxSample as AnyAddressAction)).toBe(false);
});
