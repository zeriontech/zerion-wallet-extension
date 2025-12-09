import dayjs from 'dayjs';

export function getAddressActionsCursor(date: string) {
  return btoa(JSON.stringify([dayjs(date).add(1, 'day').format()]));
}
