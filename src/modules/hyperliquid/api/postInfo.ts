import { HYPERLIQUID_INFO_URL } from '../constants';

export async function postInfo<T>(body: object): Promise<T | null> {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}
