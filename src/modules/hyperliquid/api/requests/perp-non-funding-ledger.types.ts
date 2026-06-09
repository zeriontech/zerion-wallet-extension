export type NonFundingLedgerUpdateType =
  | 'deposit'
  | 'internalTransfer'
  | 'send'
  | 'withdraw';

export interface NonFundingLedgerDelta {
  type: NonFundingLedgerUpdateType;
  usdc?: string;
  user?: string;
  destination?: string;
  fee?: string;
  nonce?: number;
  sourceDex?: string;
  destinationDex?: string;
  token?: string;
  amount?: string;
  usdcValue?: string;
  nativeTokenFee?: string;
  feeToken?: string;
}

export interface NonFundingLedgerUpdate {
  time: number;
  hash: string;
  delta: NonFundingLedgerDelta;
}

export interface NonFundingLedgerPayload {
  address: string;
  startTime?: number;
}
