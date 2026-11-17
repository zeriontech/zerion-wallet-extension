import { makeError } from 'ethers';
import { SendTransactionError } from '@solana/web3.js';
import { describe, expect, test } from 'vite-plus/test';
import {
  classifyEvmBroadcastError,
  classifySignError,
  classifySolanaBroadcastError,
  redactAddresses,
} from './transactionFailure';

/** The shapes below mirror the iOS `ErrorAnalyticsTests` of the same names. */

describe('EVM broadcast failures', () => {
  test('carry the kind and the node message', () => {
    const error = makeError('could not coalesce error', 'UNKNOWN_ERROR', {
      error: { code: -32000, message: 'nonce too low: next nonce 10, tx nonce 9' },
      payload: {},
    });

    expect(classifyEvmBroadcastError(error)).toEqual({
      code: 'broadcast.nonce_too_low',
      nodeMessage: 'nonce too low: next nonce 10, tx nonce 9',
    });
  });

  test('carry the code, the stage and the message', () => {
    const error = makeError('could not coalesce error', 'UNKNOWN_ERROR', {
      error: { code: -32000, message: 'already known' },
      payload: {},
    });

    expect(classifyEvmBroadcastError(error)).toEqual({
      code: 'broadcast.already_known',
      nodeMessage: 'already known',
    });
  });

  test('forward the node error that ethers keeps under info', () => {
    const error = makeError(
      'insufficient funds for intrinsic transaction cost',
      'INSUFFICIENT_FUNDS',
      {
        transaction: {},
        info: { error: { code: -32603, message: 'request failed' }, payload: {} },
      },
    );

    expect(classifyEvmBroadcastError(error)).toEqual({
      code: 'broadcast.server_error',
      nodeMessage: 'request failed',
    });
  });

  test('keep the broadcast code when no node error is reachable', () => {
    expect(classifyEvmBroadcastError(new Error('fetch failed'))).toEqual({
      code: 'broadcast.transport',
      nodeMessage: null,
    });
  });

  test('find a node error nested one level deeper, as older ethers and dapps send it', () => {
    const nodeError = Object.assign(new Error('already known'), { code: -32000 });
    expect(classifyEvmBroadcastError({ error: { error: nodeError } })).toEqual({
      code: 'broadcast.already_known',
      nodeMessage: 'already known',
    });
  });

  test('read a node error from a JSON string body', () => {
    const error = {
      body: JSON.stringify({ code: -32000, message: 'replacement transaction underpriced' }),
    };
    expect(classifyEvmBroadcastError(error)).toEqual({
      code: 'broadcast.underpriced',
      nodeMessage: 'replacement transaction underpriced',
    });
  });

  test('map insufficient funds', () => {
    const error = makeError('could not coalesce error', 'UNKNOWN_ERROR', {
      error: { code: -32000, message: 'insufficient funds for gas * price + value' },
      payload: {},
    });
    expect(classifyEvmBroadcastError(error).code).toBe('broadcast.insufficient_funds');
  });

  test('map underpriced', () => {
    const error = { error: { code: -32000, message: 'transaction underpriced' } };
    expect(classifyEvmBroadcastError(error).code).toBe('broadcast.underpriced');
  });

  test('a node error matching no rule is a rejection', () => {
    const error = { error: { code: -32000, message: 'execution reverted: nope' } };
    expect(classifyEvmBroadcastError(error)).toEqual({
      code: 'broadcast.rejected',
      nodeMessage: 'execution reverted: nope',
    });
  });

  test.each(['internal error', 'upstream forwarding failure', 'gateway timeout'])(
    'a "%s" node message is a server error',
    (message) => {
      expect(classifyEvmBroadcastError({ error: { code: -32000, message } }).code).toBe(
        'broadcast.server_error',
      );
    },
  );

  test('a POST url in the message is a server error', () => {
    const message = 'Post "https://rpc.example": dial tcp: connection refused';
    expect(classifyEvmBroadcastError({ error: { code: -32000, message } }).code).toBe(
      'broadcast.server_error',
    );
  });
});

describe('Solana broadcast failures', () => {
  test('a non-web3 error is a generic broadcast failure', () => {
    expect(classifySolanaBroadcastError(new Error('execution reverted'))).toEqual({
      code: 'broadcast.failed',
      nodeMessage: null,
    });
  });

  test('a SendTransactionError keeps the node message', () => {
    const error = new SendTransactionError({
      action: 'send',
      signature: 'signature',
      transactionMessage: 'Transaction simulation failed: Blockhash not found',
      logs: [],
    });

    expect(classifySolanaBroadcastError(error)).toEqual({
      code: 'web3.send_failed',
      nodeMessage: 'Transaction simulation failed: Blockhash not found',
    });
  });
});

describe('signing failures', () => {
  test('a user rejection is reported separately', () => {
    expect(classifySignError(new Error('User rejected the request.'))).toEqual({
      code: 'sign.user_rejected',
      nodeMessage: null,
    });
  });

  test('other signing failures are generic', () => {
    expect(classifySignError(new Error('Could not resolve signature'))).toEqual({
      code: 'sign.failed',
      nodeMessage: null,
    });
  });
});

describe('redactAddresses', () => {
  test('redacts addresses and hashes', () => {
    expect(
      redactAddresses(
        'insufficient funds for gas * price + value: address 0x52908400098527886E0F7030069857D2E4169EE7 have 0 want 1',
      ),
    ).toBe('insufficient funds for gas * price + value: address 0x… have 0 want 1');
  });

  test('keeps short hex values', () => {
    expect(redactAddresses('intrinsic gas too low: have 0x5208, want 0x5300')).toBe(
      'intrinsic gas too low: have 0x5208, want 0x5300',
    );
  });

  test('drops on-chain identifiers from a description', () => {
    const txHash = '0x33469b22e9f636356c4160a87eb19df52b7412e8eac32a4a55ffe88ea8350788';
    expect(redactAddresses(`already known ${txHash}`)).toBe('already known 0x…');
  });

  test('redacts Tron and Solana identifiers', () => {
    expect(
      redactAddresses('account [410123456789abcdef0123456789abcdef01234567] does not exist'),
    ).toBe('account […] does not exist');
    expect(
      redactAddresses(
        'Validate TransferContract error, no OwnerAccount TAbcdEfghJkmnPqrsTuvwXyzAbcdEfghJk',
      ),
    ).toBe('Validate TransferContract error, no OwnerAccount …');
    expect(
      redactAddresses(
        'dup transaction abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      ),
    ).toBe('dup transaction …');
  });

  test('redacts a 44-character Solana address inside a message', () => {
    expect(
      redactAddresses('recipient So11111111111111111111111111111111111111112 is invalid'),
    ).toBe('recipient … is invalid');
  });
});
