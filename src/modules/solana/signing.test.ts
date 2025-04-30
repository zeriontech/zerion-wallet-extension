import { ethers } from 'ethers';
import { opaqueType } from 'src/shared/type-utils/Opaque';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';
import { decodeMasked } from 'src/shared/wallet/encode-locally';
import { uint8ArrayToBase64 } from '../crypto';
import { fromSecretKeyToEd25519 } from './keypairs';
import {
  solanaSignAllTransactions,
  solanaSignMessage,
  solanaSignTransaction,
} from './signing';
import { solFromBase64 } from './transactions/create';

const samples = {
  signMessage: {
    messageHex:
      '0x676d676e2e61692077616e747320796f7520746f207369676e20696e207769746820796f757220536f6c616e61206163636f756e743a0a4365395162694c766d6a5a6950434746384c586550367376354d4c76536b6b787a6476547a326e486d58634c0a0a77616c6c65745f7369676e5f73746174656d656e740a5552493a2068747470733a2f2f676d676e2e61690a56657273696f6e3a20310a436861696e2049443a203930300a4e6f6e63653a2074763676646f6d350a4973737565642041743a20323032352d30342d33305431353a34313a32372e3834365a0a45787069726174696f6e2054696d653a20323032352d30352d33305431353a34313a32372e3834365a',
    signatureSerialized:
      's53NPbWmjc3eJeB4g4GoxZ82mpZ1SD+kddEyjMLZOQvtbndBiGstxc0otzJEuN4JKqBNHOXUixGRtOxG5aXnCQ==',
    sampleKey: opaqueType<LocallyEncoded>(
      'AEdhfER+YHRgbkFDW3ZqV25eA1Z0XWFsYwUOXURTdlZHen9AQBl6W1NgQE4aBFloU1dUVlpTT0pwGVZQd2hnXkx8Yht9VUdjVUV4VHNPeQBDfFl/alYBQw=='
    ),
  },

  signTransaction: {
    txBase64:
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDrPSNQxC49BOfYHZ0ZxnI92VBagTCOfsKLHzbWm2dD/mZJYJfv0+ZDQOE8wHfCqPZrECMfaQNmEy9Z1wP76itKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc5V3WuZ2MQ6bufI5wNTBFCyI1pohm4v7RXl9jjcRWTcBAgIAAQwCAAAAIB2aAAAAAAA=',
    txSignedBase64:
      'AVHsSLzsv9cnBwBPULsjeyKljRODlEEX0+PGtO0xSuKUJyrcGGnqV7aWMIi4IY88yVpiXqw9yxeuNdOaPrbunQQBAAEDrPSNQxC49BOfYHZ0ZxnI92VBagTCOfsKLHzbWm2dD/mZJYJfv0+ZDQOE8wHfCqPZrECMfaQNmEy9Z1wP76itKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc5V3WuZ2MQ6bufI5wNTBFCyI1pohm4v7RXl9jjcRWTcBAgIAAQwCAAAAIB2aAAAAAAA=',
    signatureBase58:
      '2dzuWD1gBQGrn7PaHhfHXnTv5zKDTcSCiGky5iDCf6N9c7Zf63R87fbVkmgQW89M8r156ggRfD9W1f8Hw74vzMGw',
    sampleKey: opaqueType<LocallyEncoded>(
      'AEdhfER+YHRgbkFDW3ZqV25eA1Z0XWFsYwUOXURTdlZHen9AQBl6W1NgQE4aBFloU1dUVlpTT0pwGVZQd2hnXkx8Yht9VUdjVUV4VHNPeQBDfFl/alYBQw=='
    ),
  },

  signAllTransactions: {
    transactionsBase64: [
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDrPSNQxC49BOfYHZ0ZxnI92VBagTCOfsKLHzbWm2dD/mZJYJfv0+ZDQOE8wHfCqPZrECMfaQNmEy9Z1wP76itKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/1lRfJQDHkHqdn8kf2h0CTgX/p+FUF2PISJZjAw8VaUBAgIAAQwCAAAAIB2aAAAAAAA=',
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAECrPSNQxC49BOfYHZ0ZxnI92VBagTCOfsKLHzbWm2dD/kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP9ZUXyUAx5B6nZ/JH9odAk4F/6fhVBdjyEiWYwMPFWlAQECAAAMAgAAACAdmgAAAAAA',
    ],
    sampleKey: opaqueType<LocallyEncoded>(
      'AEdhfER+YHRgbkFDW3ZqV25eA1Z0XWFsYwUOXURTdlZHen9AQBl6W1NgQE4aBFloU1dUVlpTT0pwGVZQd2hnXkx8Yht9VUdjVUV4VHNPeQBDfFl/alYBQw=='
    ),
    results: [
      {
        signatureBase58:
          '48nvXwEf5B3YsiVxnLNN3u9D51vT6dyQ1omzFhmGed4B9Q4y8oDsF8VHjVhR6DNXv5Rzk3UmBB5YSZv2NJ3P2LNL',
        txSignedBase64:
          'AZzFNCHXcmWlXIfYKY7hRN7UlOouQ+7I3RwsNhcrx379Uo2x5iPOcAyPJevGgkFzcVOEVRplOb7XMzI9TpA2BQkBAAEDrPSNQxC49BOfYHZ0ZxnI92VBagTCOfsKLHzbWm2dD/mZJYJfv0+ZDQOE8wHfCqPZrECMfaQNmEy9Z1wP76itKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/1lRfJQDHkHqdn8kf2h0CTgX/p+FUF2PISJZjAw8VaUBAgIAAQwCAAAAIB2aAAAAAAA=',
      },
      {
        signatureBase58:
          'JFmX7jdmpXz8uiJGea2dMJHYPMyJmNH9C2cdmKRTujeKbDwiPUAGS3pcCHHaWUrYnPTYy45pY3yKprzCrBXf44P',
        txSignedBase64:
          'AQ7hNZBahqvGKpBbKZQZPSl1A/pKM6JRY4ev7kolpHMa2yM1C11jK3h72RupJQRc4x22+yOkSYnaeGCjVqX/bwABAAECrPSNQxC49BOfYHZ0ZxnI92VBagTCOfsKLHzbWm2dD/kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP9ZUXyUAx5B6nZ/JH9odAk4F/6fhVBdjyEiWYwMPFWlAQECAAAMAgAAACAdmgAAAAAA',
      },
    ],
  },
};

describe.only('Solana signing functions', () => {
  test('signMessage', () => {
    const sample = samples.signMessage;
    const keypair = fromSecretKeyToEd25519(decodeMasked(sample.sampleKey));
    const messageUint8 = ethers.getBytes(sample.messageHex);
    const result = solanaSignMessage(messageUint8, keypair);
    expect(uint8ArrayToBase64(result.signature)).toBe(
      sample.signatureSerialized
    );
  });

  test('signTransaction', () => {
    const sample = samples.signTransaction;
    const keypair = fromSecretKeyToEd25519(decodeMasked(sample.sampleKey));
    const transaction = solFromBase64(sample.txBase64);
    const result = solanaSignTransaction(transaction, keypair);

    expect(result.signature).toBe(sample.signatureBase58);
    expect(result.tx).toBe(sample.txSignedBase64);
  });

  test('signAllTransactions', () => {
    const sample = samples.signAllTransactions;
    const keypair = fromSecretKeyToEd25519(decodeMasked(sample.sampleKey));
    const transactions = sample.transactionsBase64.map((tx) =>
      solFromBase64(tx)
    );
    const results = solanaSignAllTransactions(transactions, keypair);

    expect(results[0].signature).toBe(sample.results[0].signatureBase58);
    expect(results[0].tx).toBe(sample.results[0].txSignedBase64);
    expect(results[1].signature).toBe(sample.results[1].signatureBase58);
    expect(results[1].tx).toBe(sample.results[1].txSignedBase64);
  });
});
