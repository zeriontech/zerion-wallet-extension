import { getActiveTabUrl } from './getActiveTabUrl';

export async function getActiveTabOrigin() {
  const url = await getActiveTabUrl();
  return url?.origin;
}
