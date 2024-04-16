import BigNumber from 'bignumber.js';
import memoize from 'memoize-one';

interface ResolvedNumberFormatOptions {
  numberingSystem: string;
  style: string;
  currency?: string;
  currencyDisplay?: string;
  minimumIntegerDigits: number;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
  useGrouping: boolean;
}

export enum CurrencyType {
  Fiat,
  Crypto,
}

export interface CurrencyConfig {
  name: string;
  code: string;
  symbol: string;
  customSymbol?: string; // TODO: deprecate this
  locale: string;
  almostZero?: string;
  type: CurrencyType;
  getIsAlmostZero?: (value: BigNumber.Value) => boolean;
  getFormatterConfig?: (
    value: BigNumber.Value
  ) => Partial<ResolvedNumberFormatOptions>;
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
    almostZero: '~$0.00',
    locale: 'en-US',
    type: CurrencyType.Fiat,
  },
  eth: {
    name: 'Ether',
    code: 'eth',
    symbol: 'Ξ',
    customSymbol: 'Ξ',
    locale: 'en-US',
    modifyParts: setCustomSymbol('Ξ'),
    getFormatterConfig: memoize((value) => {
      return {
        currencyDisplay: 'symbol',
        ...(new BigNumber(value).isLessThan(1)
          ? sixFractionalDigitsConfig
          : fourFractionalDigitsConfig),
      };
    }),
    almostZero: '~Ξ0.00',
    getIsAlmostZero: (value) => {
      value = new BigNumber(value);
      const abs = new BigNumber(value).abs();
      return !(abs.gte(0.00001) || value.eq(0));
    },
    type: CurrencyType.Crypto,
  },
  btc: {
    name: 'Bitcoin',
    code: 'btc',
    symbol: '₿',
    customSymbol: '₿',
    modifyParts: setCustomSymbol('₿'),
    almostZero: 'BTC ~0.00',
    locale: 'en-US',
    getIsAlmostZero: (value) => {
      value = new BigNumber(value);
      const abs = new BigNumber(value).abs();
      return !abs.isZero() && abs.isLessThan(0.000001);
    },
    getFormatterConfig: memoize((value) => {
      return new BigNumber(value).isLessThan(1)
        ? sixFractionalDigitsConfig
        : fourFractionalDigitsConfig;
    }),
    type: CurrencyType.Crypto,
  },
  eur: {
    name: 'Euro',
    code: 'eur',
    symbol: '€',
    almostZero: '~0,00 €',
    locale: 'de-DE',
    type: CurrencyType.Fiat,
  },
  gbp: {
    name: 'British Pound',
    code: 'gbp',
    symbol: '£',
    almostZero: '~£0.00',
    locale: 'en-GB',
    type: CurrencyType.Fiat,
  },
  cny: {
    name: 'Chinese Yuan',
    code: 'cny',
    symbol: '¥',
    almostZero: '~¥ 0.00',
    locale: 'zh-cn',
    type: CurrencyType.Fiat,
  },
  rub: {
    name: 'Russian Ruble',
    code: 'rub',
    symbol: '₽',
    almostZero: '~0,00 ₽',
    locale: 'ru',
    type: CurrencyType.Fiat,
    modifyParts: setCustomSymbol('₽'),
  },
  krw: {
    name: 'South Korean Won',
    code: 'krw',
    symbol: '₩',
    almostZero: '~₩0',
    locale: 'ko',
    getIsAlmostZero: (value) => {
      value = new BigNumber(value);
      const abs = new BigNumber(value).abs();
      return !abs.isZero() && abs.isLessThan(0.5);
    },
    getFormatterConfig: () => noDecimalsConfig,
    type: CurrencyType.Fiat,
  },
  aud: {
    name: 'Australian Dollar',
    code: 'aud',
    symbol: 'A$',
    almostZero: '~A$0.00',
    locale: 'en-US',
    type: CurrencyType.Fiat,
  },
  inr: {
    name: 'Indian Rupee',
    code: 'inr',
    symbol: '₹',
    almostZero: '~₹0.00',
    locale: 'en-US',
    type: CurrencyType.Fiat,
  },
  jpy: {
    name: 'Japanese Yen',
    code: 'jpy',
    symbol: '¥',
    almostZero: '~JP¥0',
    locale: 'en-US',
    type: CurrencyType.Fiat,
  },
  try: {
    name: 'Turkish Lira',
    code: 'try',
    symbol: '₺',
    almostZero: 'TRY ~0.00',
    locale: 'tr-TR',
    type: CurrencyType.Fiat,
    modifyParts: setCustomSymbol('₺'),
  },
  cad: {
    name: 'Canadian Dollar',
    code: 'cad',
    symbol: 'CA$',
    almostZero: '~CA$0.00',
    locale: 'en-US',
    type: CurrencyType.Fiat,
  },
  nzd: {
    name: 'New Zealand Dollar',
    code: 'nzd',
    symbol: 'NZ$',
    almostZero: '~NZ$0.00',
    locale: 'en-US',
    type: CurrencyType.Fiat,
  },
  zar: {
    name: 'South African Rand',
    code: 'zar',
    symbol: 'R',
    almostZero: 'ZAR ~0.00',
    locale: 'en-US',
    type: CurrencyType.Fiat,
    modifyParts: setCustomSymbol('R'),
  },
};
