import ky from 'ky';
import { platform } from 'src/shared/analytics/platform';
import { version } from 'src/shared/packageVersion';
import {
  BACKEND_ENV,
  ZERION_API_URL,
  ZERION_TESTNET_API_URL,
} from 'src/env/config';
import { invariant } from 'src/shared/invariant';

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

function createHeaders(options: Options) {
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
    return new URL(endpoint, base);
  }
};

function addBackendEnvToURL(url: string | URL) {
  if (!BACKEND_ENV) {
    return url;
  }
  const urlObj = new URL(url);
  urlObj.searchParams.set('backend_env', BACKEND_ENV);
  return urlObj.toString();
}

export class ZerionHttpClient {
  static get<T>(options: GetOptions & Options) {
    const url = resolveUrl(options);
    return ky
      .get(addBackendEnvToURL(url), { headers: createHeaders(options) })
      .json<T>();
  }

  static post<T>(options: PostOptions & Options) {
    const url = resolveUrl(options);
    const { body } = options;
    return ky
      .post(addBackendEnvToURL(url), { body, headers: createHeaders(options) })
      .json<T>();
  }
}
