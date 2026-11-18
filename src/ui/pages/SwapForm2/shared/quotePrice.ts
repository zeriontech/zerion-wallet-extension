import BigNumber from 'bignumber.js';
import { isNumeric } from 'src/shared/isNumeric';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { Quote2 } from 'src/shared/types/Quote';
import {
  calculatePriceImpactFromPrices,
  fiatRatio,
  ratioToPriceImpact,
  type PriceImpact,
} from './price-impact';

export const QUOTE_PRICE_TTL_MS = 40_000;

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
  now: number,
  fallback: number | null,
): number | null {
  if (
    entry &&
    entry.chainId === key.chainId &&
    entry.fungibleId === key.fungibleId &&
    entry.currency === key.currency &&
    now - entry.receivedAt < QUOTE_PRICE_TTL_MS
  ) {
    return entry.price;
  }
  return fallback;
}

export function selectSwapFormFiat({
  quote,
  resolvedInputAmount,
  inputPrice,
  outputPrice,
  inputPositionPrice,
  outputPositionPrice,
}: {
  quote: Quote2 | null;
  resolvedInputAmount: string | null;
  inputPrice: number | null;
  outputPrice: number | null;
  inputPositionPrice: number | null;
  outputPositionPrice: number | null;
}): { payFiat: BigNumber | null; receiveFiat: BigNumber | null; priceImpact: PriceImpact | null } {
  const quoteInputValue = quote?.inputAmount?.value ?? null;
  const quoteOutputValue = quote?.outputAmount.value ?? null;

  const receiveFiat =
    quoteOutputValue != null
      ? new BigNumber(quoteOutputValue)
      : quote && outputPrice != null
        ? new BigNumber(quote.outputAmount.quantity).times(outputPrice)
        : null;

  const inputQuantityMatches =
    quote?.inputAmount != null &&
    resolvedInputAmount != null &&
    isNumeric(resolvedInputAmount) &&
    new BigNumber(quote.inputAmount.quantity).eq(resolvedInputAmount);

  const payFiat =
    quoteInputValue != null && inputQuantityMatches
      ? new BigNumber(quoteInputValue)
      : inputPrice != null
        ? new BigNumber(resolvedInputAmount || 0).times(inputPrice)
        : null;

  const priceImpact =
    resolvedInputAmount == null || !isNumeric(resolvedInputAmount)
      ? null
      : quoteInputValue != null && quoteOutputValue != null
        ? ratioToPriceImpact(
            fiatRatio(new BigNumber(quoteInputValue), new BigNumber(quoteOutputValue)),
          )
        : calculatePriceImpactFromPrices({
            inputValue: resolvedInputAmount,
            outputValue: quote?.outputAmount.quantity ?? null,
            inputPrice: inputPositionPrice,
            outputPrice: outputPositionPrice,
          });

  return { payFiat, receiveFiat, priceImpact };
}
