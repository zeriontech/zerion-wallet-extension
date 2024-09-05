import { isObj } from '../isObj';

interface IsOpenRequest {
  method: 'is-sidepanel-open';
  params: { windowId: number | null };
}

interface CloseSidepanelRequest {
  method: 'close-sidepanel';
  params: { windowId: number | null };
}

export type SidepanelMessageRequest = {
  payload: IsOpenRequest | CloseSidepanelRequest;
};

export function isSidepanelMessageRequest(
  x: unknown
): x is SidepanelMessageRequest {
  return isObj(x) && isObj(x.payload) && 'method' in x.payload;
}
