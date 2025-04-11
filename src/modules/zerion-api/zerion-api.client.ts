import { openTurnstileWidgetIfNeeded } from 'src/ui/features/turnstile/helpers';
import { getAddressProviderHeader } from './requests/shared.client';
import type { ZerionApiContext } from './zerion-api-bare';
import { ZerionApiBare } from './zerion-api-bare';

const context: ZerionApiContext = {
  getAddressProviderHeader,
  getKyOptions: () => ({
    hooks: {
      afterResponse: [
        (_, __, response) => {
          openTurnstileWidgetIfNeeded(response);
        },
      ],
    },
  }),
};

export const ZerionAPI = Object.assign(context, ZerionApiBare);
