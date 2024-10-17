import browser from 'webextension-polyfill';
import { getError } from '../errors/getError';
import type { SidepanelMessageRequest } from './types';

/**
 * Sidepanel can be opened in one browser window and not in the other
 */
export async function isSidepanelOpen({
  windowId,
}: {
  windowId: number | null;
}) {
  try {
    const response = await browser.runtime.sendMessage({
      payload: { method: 'is-sidepanel-open', params: { windowId } },
    } satisfies SidepanelMessageRequest);
    return response.sidepanelStatus === 'open';
  } catch (error) {
    return false;
  }
}

export async function closeSidepanel({
  windowId,
}: {
  windowId: number | null;
}) {
  try {
    return await browser.runtime.sendMessage({
      payload: { method: 'close-sidepanel', params: { windowId } },
    } satisfies SidepanelMessageRequest);
  } catch (error) {
    if (getError(error).message.includes('Receiving end does not exist')) {
      // it's ok, it might've not been open at all
      return;
    } else {
      throw error;
    }
  }
}
