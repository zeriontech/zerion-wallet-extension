import { ethers } from 'ethers';

export function toUtf8String(value: string) {
  try {
    return ethers.utils.toUtf8String(value);
  } catch (e) {
    return value;
  }
}
