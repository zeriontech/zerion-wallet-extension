import { solFromBase64 } from './create';
import { solanaTransactionToAddressAction } from './describeTransaction';

const samples = {
  sender: '8BXk6EEdRpp7gXUhHxLL3tbjcDGkPxJRJENjysu2tGF9',
  simpleSend:
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDarRgslFN7E63uFxHf0Ao8BfjowQR+6pglu47XWcXPFiZJYJfv0+ZDQOE8wHfCqPZrECMfaQNmEy9Z1wP76itKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeq3qgLNASWraEr/dfmvFK6mJ5FeoAp+qe3wJb3ECAskBAgIAAQwCAAAAIB2aAAAAAAA=',
  swapTransactionRaydium:
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQADEGq0YLJRTexOt7hcR39AKPAX46MEEfuqYJbuO11nFzxYHvgIC/BJS6kjBmqMp4mU5kAXCY6QrfTEHQqQdHFAzLsGm4hX/quBhPtof2NGGMA12sQ53BrrO1WYoPAAAAAAAdHqLp1xD+ipb3qtS2iYW3EXwaObsbG5UNxbusPYTCKkkLAytKPiZf2NTx52gusG+n9BV4O4rAjyhpmI9U8bcFcGoexb2CrZwDKp99Rmuixyiw7zaot3PtIZ1pZQ00cr1ret7KfnYAPDmPc3Yt3LvY0CzopFDFqiK/IGKLSgzZOWWhLnUPm1Ni+pXqBVpPVuoKwAW3LHLulHdNxYjRBAXLL6UFUArSRmToWcumz+f5HKP9T37258YHMD8OiVEB54DjeZjMvy0EWLYVy8xrGjZ8R0np/vcwZiLhsbWJEBILyalZypbPxH+mxBbhPy+ZEeILD7EKlcn64zOFY0L/Uo4E9ZaiDPpnlULaP2/qrkZc9oj44HaOt3LlI57lZA8IgFcBKMl9XTeCl3rVSwuEoP1fySXLV/4HVSR4KJUTKBoKY7DMKAy2vjGSxQODgBz0QwGA+eP4ZjIjrIAQaXENv31QdBV7BYDzHF/ORKYlgtvPnXjudZQ6CEo5OzUDaNIomTCAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAt0U3Fq2UY5tbEwaZ9BOmRY+ZuWqi/MkoKnqGS3ZZ/nwFDQYAAQIQERIJBUBCDwAAAAAADSkQExESAAEDFAQCBQYOBgYGBwgGBgYGBgYUAwUJCg4KCgoLDAoKCgoKChEAQEIPAAAAAAB4kAAAAAAAAA0GAAEAEBESAQYPAAkDQTGKAAAAAAAPAAUCgF4DAAEZjx9MOkUiY9QTss0X68vBoOWIc2TmJhoSqBeS6hZaPgAFAgcAAw4=',
};

describe('describeTransaction', () => {
  test('send should be parsed', () => {
    const tx = solFromBase64(samples.simpleSend);
    expect(tx).toBeDefined();
    const parsed = solanaTransactionToAddressAction(tx, samples.sender);

    expect(parsed.type.display_value).toBe('Send');
    expect(parsed.content?.transfers?.outgoing?.at(0)?.quantity).toBe(
      '10100000'
    );
    expect(parsed.content?.transfers?.outgoing?.at(0)?.recipient).toBe(
      'BJpYy4oW3XREUi9mQhPXzzqtf37azUbz1JPqMbU5qU23'
    );
    expect(parsed.address).toBe(samples.sender);
  });

  // TODO: Test Swap Transaction from sample.swapTransactionRaydium
});
