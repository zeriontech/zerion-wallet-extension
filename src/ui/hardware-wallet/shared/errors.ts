import {
  deniedByUser,
  isConnectError,
  interpretError,
} from '@zeriontech/hardware-wallet-connection';

export function normalizeDeviceError(error: Error) {
  if (deniedByUser(error)) {
    return new Error('DeniedByUser');
  } else if (isConnectError(error)) {
    return new Error('ConnectError');
  } else {
    const message = interpretError(error);
    return Object.assign(new Error(message), error);
  }
}
