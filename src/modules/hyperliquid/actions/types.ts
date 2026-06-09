export type OrderTif = 'Alo' | 'Ioc' | 'Gtc';
export type OrderTpsl = 'tp' | 'sl';
export type OrderGrouping = 'na' | 'normalTpsl' | 'positionTpsl';

export type ExchangeOrderType =
  | { limit: { tif: OrderTif } }
  | {
      trigger: {
        isMarket: boolean;
        triggerPx: string;
        tpsl: OrderTpsl;
      };
    };

export interface ExchangePlaceOrderPayload {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t: ExchangeOrderType;
  c?: string;
}

export interface BuilderPayload {
  b: string;
  f: number;
}

export interface ExchangePlaceOrderAction {
  type: 'order';
  orders: ExchangePlaceOrderPayload[];
  grouping: OrderGrouping;
  builder?: BuilderPayload;
}

export interface ExchangeUpdateLeverageAction {
  type: 'updateLeverage';
  asset: number;
  isCross: boolean;
  leverage: number;
}

export interface ExchangeSetReferrerAction {
  type: 'setReferrer';
  code: string;
}

export interface ExchangeApproveBuilderFeeAction {
  type: 'approveBuilderFee';
  maxFeeRate: string;
  builder: string;
  hyperliquidChain: string;
  signatureChainId: string;
  nonce: number;
}

// Zerion only sends `unifiedAccount`; the union leaves room for a future
// switch into `portfolioMargin` without re-touching the builder.
export type SetAbstractionMode = 'unifiedAccount' | 'portfolioMargin';

export interface ExchangeSetAbstractionAction {
  type: 'userSetAbstraction';
  user: string;
  abstraction: SetAbstractionMode;
  hyperliquidChain: string;
  signatureChainId: string;
  nonce: number;
}

// `time` doubles as the action nonce (matches iOS ExchangeWithdrawAction).
export interface ExchangeWithdraw3Action {
  type: 'withdraw3';
  hyperliquidChain: string;
  signatureChainId: string;
  amount: string;
  time: number;
  destination: string;
}

export type L1Action =
  | ExchangePlaceOrderAction
  | ExchangeUpdateLeverageAction
  | ExchangeSetReferrerAction;

export type UserSignedAction =
  | ExchangeApproveBuilderFeeAction
  | ExchangeSetAbstractionAction
  | ExchangeWithdraw3Action;

export type ExchangeAction = L1Action | UserSignedAction;

export interface HyperliquidSignature {
  r: string;
  s: string;
  v: number;
}

export interface ExchangeRequestBody {
  action: ExchangeAction;
  nonce: number;
  signature: HyperliquidSignature;
  vaultAddress?: string;
  expiresAfter?: number;
}
