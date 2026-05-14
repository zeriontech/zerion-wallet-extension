import type {
  BuilderPayload,
  ExchangeOrderType,
  ExchangePlaceOrderAction,
  ExchangePlaceOrderPayload,
  OrderGrouping,
} from './types';

export function buildIocLimitOrderType(): ExchangeOrderType {
  return { limit: { tif: 'Ioc' } };
}

export function buildTriggerOrderType(args: {
  triggerPx: string;
  isMarket: boolean;
  tpsl: 'tp' | 'sl';
}): ExchangeOrderType {
  return {
    trigger: {
      isMarket: args.isMarket,
      triggerPx: args.triggerPx,
      tpsl: args.tpsl,
    },
  };
}

export function buildOrderAction({
  orders,
  grouping,
  builder,
}: {
  orders: ExchangePlaceOrderPayload[];
  grouping: OrderGrouping;
  builder?: BuilderPayload;
}): ExchangePlaceOrderAction {
  const action: ExchangePlaceOrderAction = {
    type: 'order',
    orders,
    grouping,
  };
  if (builder) {
    action.builder = builder;
  }
  return action;
}
