import { getBridgeReceiverAddress } from './getBridgeReceiverAddress';

const address = '0x52Fb91492000F2a900a6b75B37D588AB37378e59';

describe('getBridgeReceiverAddress', () => {
  test('no recipient is the signing address', () => {
    expect(getBridgeReceiverAddress({ address, to: undefined })).toBeNull();
    expect(getBridgeReceiverAddress({ address, to: null })).toBeNull();
    expect(getBridgeReceiverAddress({ address, to: '' })).toBeNull();
  });

  test('the signing address in another letter case is not a recipient', () => {
    expect(getBridgeReceiverAddress({ address, to: address.toLowerCase() })).toBeNull();
    expect(
      getBridgeReceiverAddress({ address: address.toLowerCase(), to: address }),
    ).toBeNull();
  });

  test('a different address is the recipient', () => {
    const other = '0x1111111111111111111111111111111111111111';
    expect(getBridgeReceiverAddress({ address, to: other })).toBe(other);
  });
});
