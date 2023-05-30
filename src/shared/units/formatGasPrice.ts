import { baseToCommon, commonToBase } from './convert';
import { roundTokenValue } from './formatTokenValue';

export const GWEI_DECIMALS = 9;

export const weiToGwei = (value: string | number): number =>
  baseToCommon(value, GWEI_DECIMALS).toNumber();

export const gweiToWei = (value: string | number): number =>
  commonToBase(value, GWEI_DECIMALS).toNumber();

export const formatGasPrice = (value: string | number) =>
  `${roundTokenValue(weiToGwei(value))} GWEI`;
