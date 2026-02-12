export interface CurrencyConfig {
  name: string;
  code: string;
  symbol: string;
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
    symbol: '$',
    options: null,
  },
  eth: {
    name: 'Ether',
    code: 'eth',
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
    symbol: '€',
    options: null,
  },
  gbp: {
    name: 'British Pound',
    code: 'gbp',
    symbol: '£',
    options: null,
  },
  cny: {
    name: 'Chinese Yuan',
    code: 'cny',
    symbol: '¥',
    options: null,
  },
  rub: {
    name: 'Russian Ruble',
    code: 'rub',
    symbol: '₽',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  krw: {
    name: 'South Korean Won',
    code: 'krw',
    symbol: '₩',
    options: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
  },
  aud: {
    name: 'Australian Dollar',
    code: 'aud',
    symbol: '$',
    options: null,
  },
  inr: {
    name: 'Indian Rupee',
    code: 'inr',
    symbol: '₹',
    options: null,
  },
  jpy: {
    name: 'Japanese Yen',
    code: 'jpy',
    symbol: '¥',
    options: null,
  },
  try: {
    name: 'Turkish Lira',
    code: 'try',
    symbol: '₺',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  cad: {
    name: 'Canadian Dollar',
    code: 'cad',
    symbol: '$',
    options: null,
  },
  nzd: {
    name: 'New Zealand Dollar',
    code: 'nzd',
    symbol: '$',
    options: null,
  },
  zar: {
    name: 'South African Rand',
    code: 'zar',
    symbol: 'R',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  idr: {
    name: 'Indonesian Rupiah',
    code: 'idr',
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
    symbol: 'R$',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  thb: {
    name: 'Thai Baht',
    code: 'thb',
    symbol: '฿',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  php: {
    name: 'Philippine Peso',
    code: 'php',
    symbol: '₱',
    options: { currencyDisplay: 'narrowSymbol' },
  },
  ngn: {
    name: 'Nigerian Naira',
    code: 'ngn',
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
    symbol: '₣',
    options: { currencyDisplay: 'narrowSymbol' },
  },
};
