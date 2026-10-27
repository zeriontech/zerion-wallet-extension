import { HTTPError } from 'ky';
import {
  responseToTransactionGetSendError,
  shouldRetryTransactionGetSend,
  toTransactionGetSendError,
  TransactionGetSendError,
} from './transactionGetSendError';

const NOT_TRANSFERABLE_BODY =
  '{"meta":null,"data":null,"errors":[{"title":"Unable to send","detail":"This token can\'t be transferred"}]}';

function response(status: number, body: string) {
  return new Response(body, { status });
}

describe('responseToTransactionGetSendError', () => {
  it('reads the 422 not-transferable body', async () => {
    const error = await responseToTransactionGetSendError(
      response(422, NOT_TRANSFERABLE_BODY)
    );
    expect(error).toBeInstanceOf(TransactionGetSendError);
    expect(error.status).toBe(422);
    expect(error.details?.title).toBe('Unable to send');
    expect(error.details?.detail).toBe("This token can't be transferred");
  });

  it('reads the 400 and 404 ZPI bodies', async () => {
    const badRequest = await responseToTransactionGetSendError(
      response(
        400,
        '{"meta":null,"data":null,"errors":[{"title":"Bad request","detail":"Invalid parameter"}]}'
      )
    );
    expect(badRequest.status).toBe(400);
    expect(badRequest.details?.title).toBe('Bad request');
    expect(badRequest.details?.detail).toBe('Invalid parameter');

    const notFound = await responseToTransactionGetSendError(
      response(
        404,
        '{"meta":null,"data":null,"errors":[{"title":"Resource not found","detail":"Not found"}]}'
      )
    );
    expect(notFound.status).toBe(404);
    expect(notFound.details?.title).toBe('Resource not found');
    expect(notFound.details?.detail).toBe('Not found');
  });

  it.each([
    [
      'an HTML challenge page',
      '<!DOCTYPE html><html><body>Just a moment...</body></html>',
    ],
    ['an empty object', '{}'],
    ['an empty errors array', '{"errors":[]}'],
  ])('yields null details for %s', async (_, body) => {
    const error = await responseToTransactionGetSendError(response(403, body));
    expect(error.status).toBe(403);
    expect(error.details).toBeNull();
  });
});

describe('shouldRetryTransactionGetSend', () => {
  it.each([400, 404, 422, 429, 499])('never retries %i', (status) => {
    expect(
      shouldRetryTransactionGetSend(
        0,
        new TransactionGetSendError(status, null)
      )
    ).toBe(false);
  });

  it.each([
    ['500', new TransactionGetSendError(500, null)],
    ['503', new TransactionGetSendError(503, null)],
    ['a plain Error', new Error('network')],
  ])('retries %s exactly once', (_, error) => {
    expect(shouldRetryTransactionGetSend(0, error)).toBe(true);
    expect(shouldRetryTransactionGetSend(1, error)).toBe(false);
  });
});

describe('toTransactionGetSendError', () => {
  it('converts a ky HTTPError and passes other errors through', async () => {
    const request = new Request(
      'https://zpi.zerion.io/transaction/get-send/v1'
    );
    const httpError = new HTTPError(
      response(422, NOT_TRANSFERABLE_BODY),
      request,
      {} as ConstructorParameters<typeof HTTPError>[2]
    );
    const converted = await toTransactionGetSendError(httpError);
    expect(converted).toBeInstanceOf(TransactionGetSendError);
    expect((converted as TransactionGetSendError).details?.detail).toBe(
      "This token can't be transferred"
    );

    const plain = new Error('network');
    expect(await toTransactionGetSendError(plain)).toBe(plain);
  });
});
