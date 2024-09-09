import ky from 'ky';
import { platform } from 'src/shared/analytics/platform';
import { version } from 'src/shared/packageVersion';
import { ZERION_API_URL, ZERION_TESTNET_API_URL } from 'src/env/config';

export type NetworksSource = 'mainnet' | 'testnet';

export interface BackendSourceParams {
  source: NetworksSource;
}

function createZpiHeaders() {
  return {
    'X-Request-Id': crypto.randomUUID(),
    'Zerion-Client-Type': platform,
    'Zerion-Client-Version': version,
    'Content-Type': 'application/json',
  };
}

type UrlInput =
  | ({ endpoint: string } & Partial<BackendSourceParams>)
  | { url: string | URL };

const resolveUrl = (input: UrlInput): string | URL => {
  if ('endpoint' in input) {
    const { endpoint, source = 'mainnet' } = input;
    const base = source === 'testnet' ? ZERION_TESTNET_API_URL : ZERION_API_URL;
    return new URL(endpoint, base);
  } else {
    return input.url;
  }
};

export class ZerionHttpClient {
  static get<T>(params: UrlInput) {
    const url = resolveUrl(params);
    return ky.get(url, { headers: createZpiHeaders() }).json<T>();
  }

  static post<T>({ body, ...input }: UrlInput & { body: BodyInit }) {
    const url = resolveUrl(input);
    return ky.post(url, { body, headers: createZpiHeaders() }).json<T>();
  }
}
