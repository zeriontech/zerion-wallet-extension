// Port of iOS PerpetualOrderUtils.calculateIsolatedLiquidationPrice.
// `floatSide` is the direction of the new trade (1.0 long, -1.0 short).
// `userSz` is unsigned (always positive). `positionSzi` is signed.
// `updatedPosition` is the final signed position size after the trade
// (computed by the caller).

export interface LiquidationLeverageInput {
  value: number;
  rawUsd?: number | null;
}

export function calculateIsolatedLiquidationPrice({
  mid,
  floatSide,
  leverage,
  positionSzi,
  userSz,
  totalNtlPos,
  updatedPosition,
  maxLeverage,
}: {
  mid: number;
  floatSide: number;
  leverage: LiquidationLeverageInput;
  positionSzi: number;
  userSz: number;
  totalNtlPos: number;
  updatedPosition: number;
  maxLeverage: number;
}): number | null {
  let userSzi = floatSide * userSz;
  let rawUsd = leverage.rawUsd ?? 0;
  let pos = positionSzi;

  // BLOCK 1: offsetting (reducing/closing).
  const isTradeLong = userSzi > 0;
  const isPosLong = pos > 0;
  const isOffsetting = isTradeLong !== isPosLong;
  if (pos !== 0 && isOffsetting) {
    const decreaseSz = Math.min(Math.abs(userSzi), Math.abs(pos));
    const decreaseSzi = userSzi < 0 ? -decreaseSz : decreaseSz;
    const originalPosAbs = Math.abs(pos);
    const ntli = mid * pos;
    const adjustment = (rawUsd + ntli) * (decreaseSz / originalPosAbs);
    rawUsd -= adjustment;
    userSzi -= decreaseSzi;
    pos += decreaseSzi;
    rawUsd -= mid * decreaseSzi;
  }

  // BLOCK 2: increasing (opening/adding).
  const isIncreasingPos = userSzi > 0 === pos > 0;
  if (pos === 0 || isIncreasingPos) {
    const ntl = Math.abs(mid * userSzi);
    const margin = ntl / leverage.value;
    rawUsd += margin;
    pos += userSzi;
    rawUsd -= mid * userSzi;
  }

  if (pos === 0) {
    rawUsd = 0;
  }

  const ntliFinal = updatedPosition * mid;
  const accountValue = ntliFinal + rawUsd;
  const updatedPosSideFloat = updatedPosition > 0 ? 1.0 : -1.0;
  const maintenanceLeverage = maxLeverage * 2.0;
  const correction = 1 - floatSide / maintenanceLeverage;

  if (correction === 0 || updatedPosition === 0) return null;

  const liq =
    mid -
    (updatedPosSideFloat * (accountValue - totalNtlPos / maintenanceLeverage)) /
      Math.abs(updatedPosition) /
      correction;

  if (liq <= 0 || liq > 1e15) return null;
  return liq;
}
