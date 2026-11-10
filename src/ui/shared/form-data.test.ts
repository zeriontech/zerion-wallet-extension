import { naiveFormDataToObject } from './form-data';

describe('naiveFormDataToObject', () => {
  test('builds nested objects and arrays from form field names', () => {
    const formData = new FormData();
    formData.set('nativeCurrency.symbol', 'ETH');
    formData.append('rpcUrls[]', 'https://rpc-a.example');
    formData.append('rpcUrls[]', 'https://rpc-b.example');
    formData.set('hidden', 'on');

    expect(naiveFormDataToObject(formData, (_key, value) => value)).toEqual({
      nativeCurrency: { symbol: 'ETH' },
      rpcUrls: ['https://rpc-a.example', 'https://rpc-b.example'],
      hidden: 'on',
    });
  });
});
