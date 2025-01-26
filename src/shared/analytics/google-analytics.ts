import browser from 'webextension-polyfill';
import * as browserStorage from 'src/background/webapis/storage';
import {
  GOOGLE_ANALYTICS_API_SECRET,
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
} from 'src/env/config';
import { Loglevel, logTable, logToConsole } from '../logger';
import { onIdle } from './analytics';

type GoogleAnalyticsEvent =
  | 'page_view'
  | 'signed_message'
  | 'signed_transaction';

export const SESSION_ID_KEY = 'GOOGLE_ANALYTICS_V4_SESSION_ID';
const CLIENT_ID_KEY = 'GOOGLE_ANALYTICS_V4_CLIENT_ID';
const ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100;

const DEBUG_MODE = true;

function readClientid() {
  return browserStorage.get<string>(CLIENT_ID_KEY);
}

async function getClientId() {
  let clientId = await readClientid();
  if (!clientId) {
    // Generate a unique client ID for Google Analytics V4. The client ID should
    // stay the same, as long as the extension is installed on a user’s browser.
    // The actual value is not relevant.
    clientId = crypto.randomUUID();
    await browserStorage.set(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

export async function resetGoogleAnalyticsSessionId() {
  const sessionId = crypto.randomUUID() as string;
  await chrome.storage.session.set({
    [SESSION_ID_KEY]: sessionId,
  });
  return sessionId;
}

async function getSessionId() {
  // A sessionId represents a period of continuous user interaction with the extension.
  // Tracking it is necessary for Google Analytics V4.
  const result = await browser.storage.session.get(SESSION_ID_KEY);
  let sessionId = result?.[SESSION_ID_KEY] as string | undefined;
  if (!sessionId) {
    sessionId = await resetGoogleAnalyticsSessionId();
  }
  return sessionId;
}

export async function sendToGoogleAnalytics(
  event: GoogleAnalyticsEvent,
  params: Record<string, unknown>
) {
  // Both session_id and engagement_time_msec are recommended parameters when using
  // the Google Analytics Measurement Protocol as they are required
  // for user activity to display in standard reports like Realtime.
  // See: https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4?hl=en
  const clientId = await getClientId();
  const sessionId = await getSessionId();

  const baseParams = {
    session_id: sessionId,
    engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
  };

  const eventPayload = {
    name: event,
    params: {
      ...baseParams,
      ...params,
    },
  };

  logToConsole(Loglevel.info, 'group', `Google Analytics: ${event}`);
  logTable(Loglevel.info, eventPayload);
  logToConsole(Loglevel.info, 'groupEnd');

  const debugParam = DEBUG_MODE ? '&debug_mode=1' : '';

  onIdle(() => {
    fetch(
      `${ENDPOINT}?measurement_id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}&api_secret=${GOOGLE_ANALYTICS_API_SECRET}${debugParam}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          events: [eventPayload],
        }),
      }
    );
  });
}
