import { ethers } from 'ethers';

export function toChecksumAddress(address: string) {
  return address.startsWith('0x') ? ethers.getAddress(address) : address;
}

export function hasChecksumError(address: string) {
  try {
    // this throws for incorrect mixed-case/uppercase addresses
    // but resolves for lowercase and checksummed addresses
    toChecksumAddress(address);
    return false;
  } catch (e) {
    return true;
  }
}
