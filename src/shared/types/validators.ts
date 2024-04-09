import type {
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
  SignerContainer,
} from 'src/background/Wallet/model/WalletContainer';
import type {
  AccountContainer,
  DeviceAccountContainer,
  ExternallyOwnedAccount,
  ReadonlyAccountContainer,
} from 'src/background/Wallet/model/AccountContainer';
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

export function isAccountContainer(
  container: WalletContainer
): container is AccountContainer {
  // NOTE: Should we exclude signer containers?
  return 'provider' in container && !isSignerContainer(container);
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

export function isReadonlyAccount(
  wallet: WalletContainer['wallets'][number]
): wallet is ExternallyOwnedAccount {
  // NOTE: Can we perform a more definitive check?
  return !isBareWallet(wallet) && !isDeviceAccount(wallet);
}

export function assertSignerContainer(
  container: WalletContainer
): asserts container is SignerContainer {
  if (!isSignerContainer(container)) {
    throw new Error('Not a WalletContainer');
  }
}

export enum ContainerType {
  // These values also define order priority when getting a group by address
  mnemonic,
  privateKey,
  hardware,
  readonly,
}

function throwErr(error: Error): never {
  throw error;
}

export function getContainerType(container: WalletContainer): ContainerType {
  return isMnemonicContainer(container)
    ? ContainerType.mnemonic
    : isPrivateKeyContainer(container)
    ? ContainerType.privateKey
    : isHardwareContainer(container)
    ? ContainerType.hardware
    : isReadonlyContainer(container)
    ? ContainerType.readonly
    : throwErr(new Error('Unexpected Container type'));
}
