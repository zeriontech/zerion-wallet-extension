import { isObj } from 'src/shared/isObj';
import type { Device, DeviceAccount } from 'src/shared/types/Device';

export interface LedgerAccountImport {
  accounts: DeviceAccount[];
  device: Device;
  provider: 'ledger';
}

export function verifyLedgerAccountImport(
  value: unknown
): asserts value is LedgerAccountImport {
  if (
    isObj(value) &&
    'accounts' in value &&
    Array.isArray(value.accounts) &&
    value.accounts.every(
      (item) =>
        isObj(item) &&
        typeof item.address === 'string' &&
        typeof item.derivationPath === 'string'
    ) &&
    'device' in value &&
    'provider' in value &&
    value.provider === 'ledger'
  ) {
    return;
  }
  throw Error('Type Error: not a LedgerDeviceImport');
}
