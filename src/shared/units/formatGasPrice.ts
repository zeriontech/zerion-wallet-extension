import { baseToCommon, commonToBase } from './convert';
import { roundTokenValue } from './formatTokenValue';

export const GWEI_DECIMALS = 9;

export const getShortGasPrice = (value: string | number): string =>
  roundTokenValue(Math.floor(baseToCommon(value, GWEI_DECIMALS).toNumber()));

export const getLongGasPrice = (value: string | number): number =>
  commonToBase(value, GWEI_DECIMALS).toNumber();

export const formatGasPrice = (value: string | number) =>
  `${getShortGasPrice(value)} GWEI`;
