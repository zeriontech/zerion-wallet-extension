/**
 * Small local date helper covering the dayjs API this app uses. Keeps local
 * time semantics and the dayjs output formats without pulling in dayjs.
 */
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export type DateUnit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'isoWeek'
  | 'month'
  | 'quarter'
  | 'year';

export type ManipulateType = DateUnit;
export type OpUnitType = DateUnit;
export type QUnitType = DateUnit;

function pad(value: number, length = 2) {
  return String(value).padStart(length, '0');
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function addMonths(date: Date, amount: number) {
  const day = date.getDate();
  const result = new Date(date);
  result.setDate(1);
  result.setMonth(result.getMonth() + amount);
  result.setDate(Math.min(day, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

function startOf(date: Date, unit: DateUnit) {
  const result = new Date(date);
  switch (unit) {
    case 'year':
      result.setMonth(0, 1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'month':
      result.setDate(1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'week':
      result.setDate(result.getDate() - result.getDay());
      result.setHours(0, 0, 0, 0);
      break;
    case 'day':
      result.setHours(0, 0, 0, 0);
      break;
    case 'hour':
      result.setMinutes(0, 0, 0);
      break;
    case 'minute':
      result.setSeconds(0, 0);
      break;
    case 'second':
      result.setMilliseconds(0);
      break;
    default:
      break;
  }
  return result;
}

function endOf(date: Date, unit: DateUnit) {
  const result = new Date(date);
  switch (unit) {
    case 'year':
      result.setMonth(11, 31);
      result.setHours(23, 59, 59, 999);
      break;
    case 'month':
      result.setMonth(result.getMonth() + 1, 0);
      result.setHours(23, 59, 59, 999);
      break;
    case 'week':
      result.setDate(result.getDate() + (6 - result.getDay()));
      result.setHours(23, 59, 59, 999);
      break;
    case 'day':
      result.setHours(23, 59, 59, 999);
      break;
    case 'hour':
      result.setMinutes(59, 59, 999);
      break;
    case 'minute':
      result.setSeconds(59, 999);
      break;
    case 'second':
      result.setMilliseconds(999);
      break;
    default:
      break;
  }
  return result;
}

function add(date: Date, amount: number, unit: DateUnit) {
  const result = new Date(date);
  switch (unit) {
    case 'millisecond':
      result.setTime(result.getTime() + amount);
      break;
    case 'second':
      result.setTime(result.getTime() + amount * 1000);
      break;
    case 'minute':
      result.setTime(result.getTime() + amount * 60000);
      break;
    case 'hour':
      result.setTime(result.getTime() + amount * 3600000);
      break;
    case 'day':
      result.setDate(result.getDate() + amount);
      break;
    case 'week':
    case 'isoWeek':
      result.setDate(result.getDate() + amount * 7);
      break;
    case 'month':
      return addMonths(date, amount);
    case 'year':
      return addMonths(date, amount * 12);
    default:
      result.setMilliseconds(result.getMilliseconds() + amount);
      break;
  }
  return result;
}

function monthDiff(a: Date, b: Date): number {
  if (a.getDate() < b.getDate()) return -monthDiff(b, a);
  const whole = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  const anchor = addMonths(a, whole);
  const c = b.getTime() - anchor.getTime() < 0;
  const anchor2 = addMonths(a, whole + (c ? -1 : 1));
  return +(
    -(
      whole +
      (b.getTime() - anchor.getTime()) /
        (c ? anchor.getTime() - anchor2.getTime() : anchor2.getTime() - anchor.getTime())
    ) || 0
  );
}

function diff(max: Date, min: Date, unit: DateUnit, float = false): number {
  let value: number;
  switch (unit) {
    case 'year':
      value = monthDiff(max, min) / 12;
      break;
    case 'month':
      value = monthDiff(max, min);
      break;
    case 'quarter':
      value = monthDiff(max, min) / 3;
      break;
    case 'week':
    case 'isoWeek': {
      const zoneDelta = (max.getTimezoneOffset() - min.getTimezoneOffset()) * 60000;
      value = (max.getTime() - min.getTime() - zoneDelta) / 604800000;
      break;
    }
    case 'day': {
      const zoneDelta = (max.getTimezoneOffset() - min.getTimezoneOffset()) * 60000;
      value = (max.getTime() - min.getTime() - zoneDelta) / 86400000;
      break;
    }
    case 'hour':
      value = (max.getTime() - min.getTime()) / 3600000;
      break;
    case 'minute':
      value = (max.getTime() - min.getTime()) / 60000;
      break;
    case 'second':
      value = (max.getTime() - min.getTime()) / 1000;
      break;
    default:
      value = max.getTime() - min.getTime();
  }
  const result = float ? value : Math.trunc(value);
  return Object.is(result, -0) ? 0 : result;
}

function parse(value?: string | number | Date | null): Date {
  if (value == null) return new Date();
  if (value instanceof Date) return new Date(value);
  if (typeof value === 'number') return new Date(value);
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const yearOnly = /^(\d{4})$/.exec(value);
  if (yearOnly) {
    return new Date(Number(yearOnly[1]), 0, 1);
  }
  return new Date(value);
}

function format(date: Date, pattern = 'YYYY-MM-DDTHH:mm:ssZ') {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = date.getHours();
  const hour12 = hours % 12 || 12;
  const replacements: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MMMM: MONTHS_LONG[date.getMonth()],
    MMM: MONTHS_SHORT[date.getMonth()],
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(hours),
    hh: pad(hour12),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    SSS: pad(date.getMilliseconds(), 3),
    D: String(date.getDate()),
    H: String(hours),
    h: String(hour12),
    m: String(date.getMinutes()),
    s: String(date.getSeconds()),
    a: hours < 12 ? 'am' : 'pm',
    Z: `${sign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`,
  };
  let result = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === '[') {
      const end = pattern.indexOf(']', i);
      if (end !== -1) {
        result += pattern.slice(i + 1, end);
        i = end;
        continue;
      }
    }
    const rest = pattern.slice(i);
    const token = [
      'YYYY',
      'MMMM',
      'MMM',
      'SSS',
      'DD',
      'HH',
      'hh',
      'mm',
      'ss',
      'MM',
      'D',
      'H',
      'h',
      'm',
      's',
      'a',
      'Z',
    ].find((item) => rest.startsWith(item));
    if (token) {
      result += replacements[token];
      i += token.length - 1;
    } else {
      result += char;
    }
  }
  return result;
}

function relativeTime(timestamp: number, withoutSuffix: boolean, now = Date.now()) {
  const thresholds: Array<{ l: string; r?: number; d?: DateUnit }> = [
    { l: 's', r: 44, d: 'second' },
    { l: 'm', r: 89 },
    { l: 'mm', r: 44, d: 'minute' },
    { l: 'h', r: 89 },
    { l: 'hh', r: 21, d: 'hour' },
    { l: 'd', r: 35 },
    { l: 'dd', r: 25, d: 'day' },
    { l: 'M', r: 45 },
    { l: 'MM', r: 10, d: 'month' },
    { l: 'y', r: 17 },
    { l: 'yy', d: 'year' },
  ];
  const strings: Record<string, string> = {
    s: 'a few seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  };
  let value = 0;
  let isFuture = false;
  let phrase = strings.s;
  for (let i = 0; i < thresholds.length; i += 1) {
    const threshold = thresholds[i];
    if (threshold.d) {
      const current = new Date(now);
      const target = new Date(timestamp);
      value = diff(target, current, threshold.d, true);
    }
    const rounded = Math.round(Math.abs(value));
    if (threshold.r == null || rounded <= threshold.r) {
      const next = rounded <= 1 && i > 0 ? thresholds[i - 1] : threshold;
      phrase = strings[next.l].replace('%d', String(rounded));
      isFuture = value > 0;
      break;
    }
  }
  if (withoutSuffix) return phrase;
  return isFuture ? `in ${phrase}` : `${phrase} ago`;
}

class LocalDate {
  private date: Date;

  constructor(value?: string | number | Date | null, _formatPattern?: string) {
    this.date = parse(value);
  }

  format(pattern?: string) {
    return Number.isNaN(this.date.getTime()) ? 'Invalid Date' : format(this.date, pattern);
  }

  add(amount: number, unit: ManipulateType) {
    return new LocalDate(add(this.date, amount, unit));
  }

  startOf(unit: OpUnitType) {
    return new LocalDate(startOf(this.date, unit));
  }

  endOf(unit: OpUnitType) {
    return new LocalDate(endOf(this.date, unit));
  }

  diff(other: LocalDate, unit: QUnitType, float = false) {
    return diff(this.date, other.date, unit, float);
  }

  isBefore(other: LocalDate, unit?: OpUnitType) {
    return (
      (unit ? this.startOf(unit).valueOf() : this.valueOf()) <
      (unit ? other.startOf(unit).valueOf() : other.valueOf())
    );
  }

  isAfter(other: LocalDate, unit?: OpUnitType) {
    return (
      (unit ? this.startOf(unit).valueOf() : this.valueOf()) >
      (unit ? other.startOf(unit).valueOf() : other.valueOf())
    );
  }

  hour(): number;
  hour(value: number): LocalDate;
  hour(value?: number) {
    if (value == null) return this.date.getHours();
    const result = new Date(this.date);
    result.setHours(value);
    return new LocalDate(result);
  }

  fromNow(withoutSuffix = false) {
    return relativeTime(this.date.getTime(), withoutSuffix);
  }

  valueOf() {
    return this.date.getTime();
  }

  isValid() {
    return !Number.isNaN(this.date.getTime());
  }
}

export default function dayjs(value?: string | number | Date | null, formatPattern?: string) {
  return new LocalDate(value, formatPattern);
}
