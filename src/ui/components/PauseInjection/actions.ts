import { produce } from 'immer';
import dayjs from 'dayjs';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';

export const TESTING = process.env.NODE_ENV !== 'production';

export enum TurnOffDuration {
  oneHour,
  untilTomorrow,
  forever,
}

export interface SubmitData {
  origin: '<all_urls>' | string;
  duration: TurnOffDuration;
}

function calculateExpires(duration: TurnOffDuration) {
  if (duration === TurnOffDuration.oneHour) {
    const FORTY_SECONDS = 1000 * 40;
    const HOUR = 1000 * 60 * 60;
    return Date.now() + (TESTING ? FORTY_SECONDS : HOUR);
  } else if (duration === TurnOffDuration.untilTomorrow) {
    const now = dayjs();
    if (now.hour() < 3) {
      return now.hour(9).valueOf(); // 9AM same day
    } else {
      return now.add(1, 'day').hour(9).valueOf(); // 9AM next day
    }
  } else if (duration === TurnOffDuration.forever) {
    return null;
  }
  throw new Error('Unexpected duration enum');
}

export function createPreference(
  globalPreferences: GlobalPreferences,
  formData: SubmitData
): Pick<GlobalPreferences, 'providerInjection'> {
  return {
    providerInjection: {
      ...globalPreferences.providerInjection,
      [formData.origin]: {
        expires: calculateExpires(formData.duration),
      },
    },
  };
}

export function disablePreference(
  globalPreferences: GlobalPreferences,
  pattern: string | null
): Pick<GlobalPreferences, 'providerInjection'> {
  if (!globalPreferences.providerInjection || !pattern) {
    return {};
  }
  return {
    providerInjection: produce(globalPreferences.providerInjection, (draft) => {
      delete draft[pattern];
    }),
  };
}
