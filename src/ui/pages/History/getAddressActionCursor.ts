import dayjs from 'src/shared/date';

export function getAddressActionsCursor(date: string) {
  return btoa(JSON.stringify([dayjs(date).startOf('day').add(1, 'day').format()]));
}
