import { FirebaseRemoteConfig, RemoteConfigParameterValueType } from './types';

export const mockConfig: FirebaseRemoteConfig = {
  parameters: {
    extension_allow_create_wallet: {
      defaultValue: { value: 'true' },
      valueType: RemoteConfigParameterValueType.boolean,
    },
  },
  version: {
    versionNumber: '0.1.0',
    updateTime: '12345678',
  },
  parameterGroups: {},
};
