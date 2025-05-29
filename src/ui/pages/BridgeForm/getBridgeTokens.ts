import ky, { HTTPError } from 'ky';
import type { Chain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import { DEFI_SDK_TRANSACTIONS_API_URL } from 'src/env/config';
import { createUrl } from 'src/shared/createUrl';

type Direction = 'input' | 'output' | 'both';

interface Params {
  inputChain: Chain | null;
  outputChain: Chain | null;
  direction: Direction;
}

interface Response {
  assets: string[];
}

interface ParsedHttpError {
  body: string;
  detail?: {
    loc: string[];
    msg: string;
    type: string;
  }[];
}

class TransactionsApiError extends HTTPError {
  static interpretError(parsedError: ParsedHttpError) {
    if (parsedError.detail && parsedError.detail.length > 0) {
      const [{ msg }] = parsedError.detail;
      return msg;
    }
    return parsedError.body;
  }

  constructor(name: string, parsedError: ParsedHttpError, error: HTTPError) {
    super(error.response, error.request, error.options);
    this.name = name;
    this.message = TransactionsApiError.interpretError(parsedError);
  }
}

export async function getBridgeTokens({
  inputChain,
  outputChain,
  direction,
}: Params) {
  invariant(inputChain, 'inputChain should exist');
  invariant(outputChain, 'outputChain should exist');

  const searchParams = new URLSearchParams({
    input_chain: inputChain.toString(),
    output_chain: outputChain.toString(),
    direction,
  });

  const url = createUrl({
    base: DEFI_SDK_TRANSACTIONS_API_URL,
    pathname: '/swap/tokens',
    searchParams,
  }).toString();

  try {
    const response = await ky
      .get(url, { timeout: 30000, retry: 0 })
      .json<Response>();
    return response.assets;
  } catch (error) {
    if (error instanceof HTTPError) {
      const parsedError: ParsedHttpError = await error.response.json();
      throw new TransactionsApiError('Bridge tokens', parsedError, error);
    }
    throw error;
  }
}
