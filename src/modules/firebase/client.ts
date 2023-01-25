import {
  FirebaseRemoteConfig,
  RemoteConfigParameter,
  RemoteConfigParameterValueType,
} from './types';
import { mockConfig } from './mock';
import { FirebaseConfig, firebaseConfig } from './config';

/**
 * Defines a successful response (200 or 304).
 */
// interface FirebaseFetchResponse {
//   /**
//    * The HTTP status, which is useful for differentiating success responses with data from
//    * those without.
//    */
//   status: number;
//
//   /**
//    * Defines the ETag response header value.
//    * Only defined to 204 and 304 reponses.
//    */
//   eTag?: string;
//
//   /**
//    * Defines the map of parameters returned as "entries" in the fetch response body.
//    * Only defined for 200 responses.
//    */
//   config?: FirebaseRemoteConfig;
// }

export const defaultParameters: Record<string, RemoteConfigParameter> = {
  extension_allow_create_wallet: {
    defaultValue: { value: 'false' },
    valueType: RemoteConfigParameterValueType.boolean,
  },
};

export const defaultConfig = {
  version: {
    versionNumber: '0.1.0',
    updateTime: '12345678',
  },
  parameterGroups: {},
  parameters: defaultParameters,
};

export function fetchRemoteConfig(): Promise<FirebaseRemoteConfig> {
  return Promise.resolve(mockConfig);
}

export function decodeValue(parameter: RemoteConfigParameter) {
  const value = parameter.defaultValue.value;
  switch (parameter.valueType) {
    case RemoteConfigParameterValueType.json:
      return JSON.parse(value);
    case RemoteConfigParameterValueType.number:
      return Number(value);
    case RemoteConfigParameterValueType.boolean:
      return value.toLowerCase() === 'true';
    case RemoteConfigParameterValueType.unspecified:
    case RemoteConfigParameterValueType.string:
    default:
      return value;
  }
}
