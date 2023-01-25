interface RemoteConfigVersion {
  versionNumber: string;
  updateTime: string;
}

interface RemoteConfigParameterValue {
  value: string;
}

export enum RemoteConfigParameterValueType {
  unspecified,
  string,
  boolean,
  number,
  json,
}

export interface RemoteConfigParameter {
  defaultValue: RemoteConfigParameterValue;
  valueType: RemoteConfigParameterValueType;
}

interface RemoteConfigParamterGroup {
  description: string;
  parameters: Record<string, RemoteConfigParameter>;
}

export interface FirebaseRemoteConfig {
  version: RemoteConfigVersion;
  parameters: Record<string, RemoteConfigParameter>;
  parameterGroups: Record<string, RemoteConfigParamterGroup>;
}
