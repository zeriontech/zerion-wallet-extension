import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';

export interface CurrencyConfig {
  name: string;
  code: string;
  symbol: string;
  modifyParts?: (parts: Intl.NumberFormatPart[]) => Intl.NumberFormatPart[];
}

const noDecimalsConfig = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
const sixFractionalDigitsConfig = { maximumFractionDigits: 6 };
const fourFractionalDigitsConfig = { maximumFractionDigits: 4 };

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
  },
  eth: {
    name: 'Ether',
    code: 'eth',
    symbol: 'Ξ',
    modifyParts: setCustomSymbol('Ξ'),
  },
  btc: {
    name: 'Bitcoin',
    code: 'btc',
    symbol: '₿',
    modifyParts: setCustomSymbol('₿'),
  },
  eur: {
    name: 'Euro',
    code: 'eur',
    symbol: '€',
  },
  gbp: {
    name: 'British Pound',
    code: 'gbp',
    symbol: '£',
  },
  cny: {
    name: 'Chinese Yuan',
    code: 'cny',
    symbol: '¥',
  },
  rub: {
    name: 'Russian Ruble',
    code: 'rub',
    symbol: '₽',
    modifyParts: setCustomSymbol('₽'),
  },
  krw: {
    name: 'South Korean Won',
    code: 'krw',
    symbol: '₩',
  },
  aud: {
    name: 'Australian Dollar',
    code: 'aud',
    symbol: '$',
  },
  inr: {
    name: 'Indian Rupee',
    code: 'inr',
    symbol: '₹',
  },
  jpy: {
    name: 'Japanese Yen',
    code: 'jpy',
    symbol: '¥',
  },
  try: {
    name: 'Turkish Lira',
    code: 'try',
    symbol: '₺',
    modifyParts: setCustomSymbol('₺'),
  },
  cad: {
    name: 'Canadian Dollar',
    code: 'cad',
    symbol: '$',
  },
  nzd: {
    name: 'New Zealand Dollar',
    code: 'nzd',
    symbol: '$',
  },
  zar: {
    name: 'South African Rand',
    code: 'zar',
    symbol: 'R',
    modifyParts: setCustomSymbol('R'),
  },
};

export const FORMATTER_CONFIG: Record<
  string,
  (value: BigNumber.Value) => Partial<Intl.NumberFormatOptions>
> = {
  eth: memoize((value) => {
    return {
      ...(new BigNumber(value).isLessThan(1)
        ? sixFractionalDigitsConfig
        : fourFractionalDigitsConfig),
    };
  }),
  btc: memoize((value) => {
    return new BigNumber(value).isLessThan(1)
      ? sixFractionalDigitsConfig
      : fourFractionalDigitsConfig;
  }),
  krw: () => noDecimalsConfig,
};
