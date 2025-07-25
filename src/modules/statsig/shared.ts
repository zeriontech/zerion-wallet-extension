import ky from 'ky';
import { STATSIG_API_KEY } from 'src/env/config';
import { getAnalyticsId } from 'src/shared/analytics/analyticsId';
import { Loglevel, logTable, logToConsole } from 'src/shared/logger';
import { onIdle } from 'src/shared/onIdle';

export async function statsigTrack(
  eventName: string,
  eventParams?: Record<string, unknown>
) {
  const userId = await getAnalyticsId();
  logToConsole(Loglevel.info, 'group', `Statsig track: ${eventName}`);
  logTable(Loglevel.info, eventParams, ['index']);
  logToConsole(Loglevel.info, 'groupEnd');
  if (process.env.NODE_ENV !== 'development') {
    onIdle(() => {
      ky.post('https://events.statsigapi.net/v1/log_event', {
        headers: {
          'statsig-api-key': STATSIG_API_KEY,
          'Content-Type': 'application/json',
          'STATSIG-CLIENT-TIME': '<local_time>',
        },
        body: JSON.stringify({
          events: [
            {
              user: { userID: userId },
              time: Date.now(),
              eventName,
              metadata: eventParams,
            },
          ],
        }),
      });
    });
  }
}

export async function getStatsigExperiment(name: string) {
  const userId = await getAnalyticsId();
  return ky
    .post('https://api.statsig.com/v1/get_config', {
      headers: {
        'statsig-api-key': STATSIG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: { userID: userId }, configName: name }),
    })
    .json<{ name: string; group: string; group_name: string | null }>();
}

export async function getStatsigFeatureGate(name: string) {
  const userId = await getAnalyticsId();
  return ky
    .post('https://api.statsig.com/v1/check_gate', {
      headers: {
        'statsig-api-key': STATSIG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: { userID: userId }, gateName: name }),
    })
    .json<{ name: string; value: boolean }>();
}
