import { ethers } from 'ethers';

export function toUtf8String(value: ethers.BytesLike) {
  try {
    return ethers.toUtf8String(value);
  } catch (e) {
    if (typeof value === 'string') {
      return value;
    } else {
      throw e;
    }
  }
}
