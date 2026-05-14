export interface PerpFillLiquidation {
  liquidatedUser: string;
  markPx: string;
  method: string;
}

export interface PerpFill {
  hash: string;
  oid: number;
  tid: number;
  coin: string;
  px: string;
  sz: string;
  side: 'A' | 'B';
  dir: string;
  time: number;
  fee: string;
  feeToken: string;
  builderFee?: string;
  closedPnl: string;
  startPosition: string;
  crossed: boolean;
  liquidation?: PerpFillLiquidation;
}

export interface PerpUserFillsPayload {
  address: string;
}
