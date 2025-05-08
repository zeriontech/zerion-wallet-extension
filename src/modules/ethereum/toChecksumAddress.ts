import { ethers } from 'ethers';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';

export function toChecksumAddress(address: string) {
  return isEthereumAddress(address) ? ethers.getAddress(address) : address;
}

export function hasChecksumError(address: string) {
  try {
    // this throws for incorrect mixed-case addresses
    // but resolves for lowercase, checksummed and uppercased addresses
    toChecksumAddress(address);
    return false;
  } catch (e) {
    return true;
  }
}
