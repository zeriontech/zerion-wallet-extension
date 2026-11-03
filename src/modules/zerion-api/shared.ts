import ky, { type Options as KyOptions } from 'ky';
import { platform } from 'src/shared/analytics/platform';
import { version } from 'src/shared/packageVersion';
import { ZERION_API_URL, ZERION_TESTNET_API_URL } from 'src/env/config';
import { invariant } from 'src/shared/invariant';
import { createUrl } from 'src/shared/createUrl';

export type NetworksSource = 'mainnet' | 'testnet';

export interface BackendSourceParams {
  source: NetworksSource;
}

type UrlInput =
  | ({ endpoint: string } & Partial<BackendSourceParams>)
  | { url: string | URL };

type GetOptions = UrlInput;
type PostOptions = UrlInput & { body: BodyInit };

export type Options = {
  headers?: Record<string, string | undefined>;
};

export type ClientOptions = Options & BackendSourceParams;

export const CLIENT_DEFAULTS: ClientOptions = { source: 'mainnet' };

export function createHeaders(options: Options) {
  return {
    'X-Request-Id': crypto.randomUUID(),
    'Zerion-Client-Type': platform,
    'Zerion-Client-Version': version,
    'Content-Type': 'application/json',
    ...options.headers,
  };
}

const resolveUrl = (input: UrlInput): string | URL => {
  if ('url' in input) {
    invariant(input.url, 'url param must be a string');
    return input.url;
  } else {
    const { endpoint, source = 'mainnet' } = input;
    invariant(endpoint, 'endpoint param must be a string');
    const base = source === 'testnet' ? ZERION_TESTNET_API_URL : ZERION_API_URL;
    invariant(
      base,
      `One of API URLs not found in env: ${ZERION_TESTNET_API_URL}, ${ZERION_API_URL}`
    );
    return createUrl({ base, pathname: endpoint });
  }
};

export class ZerionHttpClient {
  static get<T>(options: GetOptions & Options, kyOptions: KyOptions) {
    const url = resolveUrl(options);
    return ky
      .get(url, {
        headers: createHeaders(options),
        credentials: 'include',
        ...kyOptions,
      })
      .json<T>();
  }

  static post<T>(options: PostOptions & Options, kyOptions: KyOptions) {
    const url = resolveUrl(options);
    const { body } = options;
    return ky
      .post(url, {
        body,
        headers: createHeaders(options),
        credentials: 'include',
        ...kyOptions,
      })
      .json<T>();
  }
}
