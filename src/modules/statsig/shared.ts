import ky from 'ky';
import { STATSIG_API_KEY } from 'src/env/config';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { Loglevel, logTable, logToConsole } from 'src/shared/logger';
import { onIdle } from 'src/shared/onIdle';

export async function statsigTrack(
  eventName: string,
  eventParams?: Record<string, unknown>
) {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }
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
              user: { userID: user.id },
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
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return ky
    .post('https://api.statsig.com/v1/get_config', {
      headers: {
        'statsig-api-key': STATSIG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: { userID: user.id }, configName: name }),
    })
    .json<{ name: string; group: string; group_name: string | null }>();
}
