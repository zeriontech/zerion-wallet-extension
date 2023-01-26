import {
  FirebaseRemoteConfig,
  RemoteConfigParameter,
  RemoteConfigParameterValueType,
} from './types';
import { FirebaseConfig, firebaseConfig } from './config';

interface FetchRequest {
  sdk_version: string;
  app_instance_id: string;
  app_instance_id_token: string;
  app_id: string;
  language_code: string;
}

function getInstallationId(config: FirebaseConfig): Promise<string> {
  return Promise.resolve('fake-instance-id');
}

function getInstallationToken(config: FirebaseConfig): Promise<string> {
  return Promise.resolve('fake-instance-token');
}

export async function fetchRemoteConfig(): Promise<FirebaseRemoteConfig | null> {
  const baseURL = 'https://firebaseremoteconfig.googleapis.com';
  const namespace = 'firebase';
  const url = `${baseURL}/v1/projects/${firebaseConfig.projectId}/namespaces/${namespace}:fetch?key=${firebaseConfig.apiKey}`;
  const headers = {
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip',
    'If-None-Match': '*',
  };

  const instanceId = await getInstallationId(firebaseConfig);
  const instanceToken = await getInstallationToken(firebaseConfig);

  const request: FetchRequest = {
    sdk_version: '7.20.0',
    app_instance_id: instanceId,
    app_instance_id_token: instanceToken,
    app_id: firebaseConfig.appId,
    language_code: 'en-US',
  };
  const options = {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  };

  const response = await fetch(url, options);
  if (response.status === 200) {
    const body = await response.json();
    return body['entries'] as FirebaseRemoteConfig;
  }
  return null;
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
