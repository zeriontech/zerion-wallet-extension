import BigNumber from 'bignumber.js';
import { isNumeric } from 'src/shared/isNumeric';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { Quote2 } from 'src/shared/types/Quote';
import { ratioToPriceImpact, type PriceImpact } from './price-impact';

type FungibleKey = { chainId: string; fungibleId: string };

export type QuotePriceEntry = {
  chainId: string;
  fungibleId: string;
  currency: string;
  price: number;
  receivedAt: number;
};

export type QuotePriceMemo = { input: QuotePriceEntry | null; output: QuotePriceEntry | null };

export const EMPTY_QUOTE_PRICE_MEMO: QuotePriceMemo = { input: null, output: null };

export function priceFromQuoteAmount(amount: Amount | null | undefined): number | null {
  if (amount?.value == null || !isNumeric(amount.quantity)) {
    return null;
  }
  const quantity = new BigNumber(amount.quantity);
  if (quantity.lte(0)) {
    return null;
  }
  return new BigNumber(amount.value).div(quantity).toNumber();
}

function nextEntry(
  prev: QuotePriceEntry | null,
  amount: Amount | null | undefined,
  key: FungibleKey,
  currency: string,
  now: number,
): QuotePriceEntry | null {
  const price = priceFromQuoteAmount(amount);
  if (price == null || (prev && now <= prev.receivedAt)) {
    return prev;
  }
  return { chainId: key.chainId, fungibleId: key.fungibleId, currency, price, receivedAt: now };
}

export function nextQuotePriceMemo(
  prev: QuotePriceMemo,
  args: {
    quote: Quote2;
    input: FungibleKey;
    output: FungibleKey;
    currency: string;
    now: number;
  },
): QuotePriceMemo {
  const { quote, input, output, currency, now } = args;
  return {
    input: nextEntry(prev.input, quote.inputAmount, input, currency, now),
    output: nextEntry(prev.output, quote.outputAmount, output, currency, now),
  };
}

export function selectEffectivePrice(
  entry: QuotePriceEntry | null,
  key: { chainId: string; fungibleId: string; currency: string },
  position: { price: number | null; updatedAt: number | null },
): number | null {
  if (
    entry &&
    entry.chainId === key.chainId &&
    entry.fungibleId === key.fungibleId &&
    entry.currency === key.currency &&
    (position.price == null || position.updatedAt == null || entry.receivedAt >= position.updatedAt)
  ) {
    return entry.price;
  }
  return position.price;
}

export function selectSwapFormFiat({
  quote,
  resolvedInputAmount,
  inputPrice,
  outputPrice,
}: {
  quote: Quote2 | null;
  resolvedInputAmount: string | null;
  inputPrice: number | null;
  outputPrice: number | null;
}): { payFiat: BigNumber | null; receiveFiat: BigNumber | null; priceImpact: PriceImpact | null } {
  const amountIsNumeric = resolvedInputAmount != null && isNumeric(resolvedInputAmount);
  const payFiat =
    amountIsNumeric && inputPrice != null
      ? new BigNumber(resolvedInputAmount).times(inputPrice)
      : null;
  const receiveFiat =
    quote && outputPrice != null
      ? new BigNumber(quote.outputAmount.quantity).times(outputPrice)
      : null;
  const priceImpact = amountIsNumeric
    ? ratioToPriceImpact(
        payFiat && receiveFiat && payFiat.isGreaterThan(0) && receiveFiat.isGreaterThan(0)
          ? receiveFiat.minus(payFiat).div(payFiat).toNumber()
          : null,
      )
    : null;
  return { payFiat, receiveFiat, priceImpact };
}
