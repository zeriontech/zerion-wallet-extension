import type {
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
  SignerContainer,
} from 'src/background/Wallet/model/WalletContainer';
import type {
  DeviceAccountContainer,
  ReadonlyAccountContainer,
} from 'src/background/Wallet/model/accounts/types';
import type { WalletContainer } from 'src/background/Wallet/model/types';
import { SeedType } from '../SeedType';
import type { BareWallet } from './BareWallet';
import type { DeviceAccount } from './Device';

export function isSignerContainer(
  container: WalletContainer
): container is SignerContainer {
  return 'seedType' in container;
}

export function isMnemonicContainer(
  container: WalletContainer
): container is MnemonicWalletContainer {
  return (
    isSignerContainer(container) && container.seedType === SeedType.mnemonic
  );
}

export function isPrivateKeyContainer(
  container: WalletContainer
): container is PrivateKeyWalletContainer {
  return (
    isSignerContainer(container) && container.seedType === SeedType.privateKey
  );
}

export function isHardwareContainer(
  container: WalletContainer
): container is DeviceAccountContainer {
  return 'device' in container;
}

export function isReadonlyContainer(
  container: WalletContainer
): container is ReadonlyAccountContainer {
  return 'provider' in container && container.provider == null;
}

export function isBareWallet(
  wallet: WalletContainer['wallets'][number]
): wallet is BareWallet {
  return 'privateKey' in wallet;
}

export function isDeviceAccount(
  wallet: WalletContainer['wallets'][number]
): wallet is DeviceAccount {
  return 'derivationPath' in wallet;
}

// function assertType<K, T extends K>(
//   value: K,
//   check: (value: K) => value is T
// ): asserts value is T {
//   if (!check(value)) {
//     throw new Error('Type Error');
//   }
// }
// function createAsserter<K, T extends K>(check: (value: K) => value is T) {
//   return function (value: K): asserts value is T {
//     return assertType(value, check);
//   };
// }

// export const assertWalletContainer = createAsserter(isWalletContainer);
export function assertSignerContainer(
  container: WalletContainer
): asserts container is SignerContainer {
  if (!isSignerContainer(container)) {
    throw new Error('Not a WalletContainer');
  }
}
