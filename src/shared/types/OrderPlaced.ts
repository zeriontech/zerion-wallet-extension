import type { TransactionContextParams } from './SignatureContextParams';

export type OrderPlaced = {
  orderId: string;
  quoteId: string;
  address: string;
};

export type OrderPlacedReport = OrderPlaced & {
  context: TransactionContextParams;
};
