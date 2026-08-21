/**
 * `CURRENCIES` mixes fiat with crypto denominations (the user can price their
 * whole portfolio in ETH). Surfaces that only accept real money — the deposit
 * form's "Pay with" selector, for one — need to tell them apart.
 */
export type CurrencyType = 'fiat' | 'crypto';

export interface CurrencyConfig {
  name: string;
  code: string;
  symbol: string;
  type: CurrencyType;
  modifyParts?: (parts: Intl.NumberFormatPart[]) => Intl.NumberFormatPart[];
  options:
    | (Intl.NumberFormatOptions & { default?: never; lessThanOnde?: never })
    | {
        default: null | Intl.NumberFormatOptions;
        lessThanOne: null | Intl.NumberFormatOptions;
      }
    | null;
}

function resolveCurrencyOptions(
  value: number,
  config: CurrencyConfig | null
): Intl.NumberFormatOptions | null {
  if (config) {
    if (config.options && 'lessThanOne' in config.options) {
      const absValue = Math.abs(value);
      if (config.options.lessThanOne && absValue < 1) {
        return config.options.lessThanOne;
      }
      return config.options.default;
    }
    return config.options;
  }
  return null;
}

export function resolveOptions(
  value: number,
  config: CurrencyConfig | null,
  runtimeOptions: Intl.NumberFormatOptions | null
): Intl.NumberFormatOptions | null {
  const currencyOptions = resolveCurrencyOptions(value, config);
  return runtimeOptions
    ? { ...currencyOptions, ...runtimeOptions }
    : currencyOptions;
}

const setCustomSymbol = (symbol: string) => (parts: Intl.NumberFormatPart[]) =>
  parts
    .filter((part) => part.type !== 'literal')
    .map((part) =>
      part.type === 'currency' ? { ...part, value: symbol } : part
    );

export const CURRENCIES: Record<string, CurrencyConfig> = {
  usd: {
    name: 'US Dollar',
    code: 'usd',
    type: 'fiat',
    symbol: '$',
    options: null,
  },
  eth: {
    name: 'Ether',
    code: 'eth',
    type: 'crypto',
    symbol: 'Ξ',
    modifyParts: setCustomSymbol('Ξ'),
    options: {
      default: { maximumFractionDigits: 4 },
      lessThanOne: { maximumFractionDigits: 6 },
    },
  },
  btc: {
    name: 'Bitcoin',
    code: 'btc',
    type: 'crypto',
    symbol: '₿',
    modifyParts: setCustomSymbol('₿'),
    options: {
      default: { maximumFractionDigits: 4 },
      lessThanOne: { maximumFractionDigits: 6 },
    },
  },
  eur: {
    name: 'Euro',
    code: 'eur',
    type: 'fiat',
    symbol: '€',
    options: null,
  },
  gbp: {
    name: 'British Pound',
    code: 'gbp',
    type: 'fiat',
    symbol: '£',
    options: null,
  },
  cny: {
    name: 'Chinese Yuan',
    code: 'cny',
    type: 'fiat',
    symbol: '¥',
    options: null,
  },
  rub: {
    name: 'Russian Ruble',
    code: 'rub',
    type: 'fiat',
    symbol: '₽',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  krw: {
    name: 'South Korean Won',
    code: 'krw',
    type: 'fiat',
    symbol: '₩',
    options: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
  },
  aud: {
    name: 'Australian Dollar',
    code: 'aud',
    type: 'fiat',
    symbol: '$',
    options: null,
  },
  inr: {
    name: 'Indian Rupee',
    code: 'inr',
    type: 'fiat',
    symbol: '₹',
    options: null,
  },
  jpy: {
    name: 'Japanese Yen',
    code: 'jpy',
    type: 'fiat',
    symbol: '¥',
    options: null,
  },
  try: {
    name: 'Turkish Lira',
    code: 'try',
    type: 'fiat',
    symbol: '₺',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  cad: {
    name: 'Canadian Dollar',
    code: 'cad',
    type: 'fiat',
    symbol: '$',
    options: null,
  },
  nzd: {
    name: 'New Zealand Dollar',
    code: 'nzd',
    type: 'fiat',
    symbol: '$',
    options: null,
  },
  zar: {
    name: 'South African Rand',
    code: 'zar',
    type: 'fiat',
    symbol: 'R',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  idr: {
    name: 'Indonesian Rupiah',
    code: 'idr',
    type: 'fiat',
    symbol: 'Rp',
    options: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol',
    },
  },
  brl: {
    name: 'Brazilian Real',
    code: 'brl',
    type: 'fiat',
    symbol: 'R$',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  thb: {
    name: 'Thai Baht',
    code: 'thb',
    type: 'fiat',
    symbol: '฿',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  php: {
    name: 'Philippine Peso',
    code: 'php',
    type: 'fiat',
    symbol: '₱',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  ngn: {
    name: 'Nigerian Naira',
    code: 'ngn',
    type: 'fiat',
    symbol: '₦',
    options: {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol',
    },
  },
  chf: {
    name: 'Swiss Franc',
    code: 'chf',
    type: 'fiat',
    symbol: '₣',
    options: { currencyDisplay: 'narrowSymbol' },
  },
};

/**
 * The subset of {@link CURRENCIES} a user can actually spend. Ordered as
 * declared, with `usd` first.
 */
export const FIAT_CURRENCIES: CurrencyConfig[] = Object.values(
  CURRENCIES
).filter((config) => config.type === 'fiat');

/**
 * Falls back to `usd` when the user's display currency is a crypto
 * denomination, which cannot be spent on an on-ramp.
 */
export function toFiatCurrencyCode(currency: string): string {
  return CURRENCIES[currency]?.type === 'fiat' ? currency : 'usd';
}
