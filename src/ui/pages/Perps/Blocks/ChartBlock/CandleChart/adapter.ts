import { _adapters, type TimeUnit } from 'chart.js';
import dayjs, { type DateUnit } from 'src/shared/date';

const FORMATS = {
  datetime: 'MMM D, YYYY, h:mm:ss a',
  millisecond: 'h:mm:ss.SSS a',
  second: 'h:mm:ss a',
  minute: 'h:mm a',
  hour: 'HH:mm',
  day: 'MMM D',
  week: 'MMM D',
  month: 'MMM YYYY',
  quarter: '[Q]Q - YYYY',
  year: 'YYYY',
} satisfies Record<TimeUnit | 'datetime', string>;

_adapters._date.override({
  formats: () => FORMATS,
  parse: (value, format) => {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string') {
      const parsed = format ? dayjs(value, format) : dayjs(value);
      return parsed.isValid() ? parsed.valueOf() : null;
    }
    return null;
  },
  format: (timestamp, format) => dayjs(timestamp).format(format),
  add: (timestamp, amount, unit) =>
    dayjs(timestamp)
      .add(amount, unit as DateUnit)
      .valueOf(),
  diff: (max, min, unit) => dayjs(max).diff(dayjs(min), unit as DateUnit),
  startOf: (timestamp, unit) => {
    if (unit === 'isoWeek') {
      return dayjs(timestamp).startOf('week').valueOf();
    }
    return dayjs(timestamp)
      .startOf(unit as DateUnit)
      .valueOf();
  },
  endOf: (timestamp, unit) =>
    dayjs(timestamp)
      .endOf(unit as DateUnit)
      .valueOf(),
});
