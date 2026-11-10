import type { AfterResponseHook } from 'ky';
import { openTurnstileWidgetIfNeeded } from 'src/ui/features/turnstile/helpers';
import { getAddressProviderHeader } from './requests/shared.client';
import type { ZerionApiContext } from './zerion-api-bare';
import { ZerionApiBare } from './zerion-api-bare';

const afterResponse: AfterResponseHook = ({ response }) => {
  openTurnstileWidgetIfNeeded(response);
};

const context: ZerionApiContext = {
  getAddressProviderHeader,
  getKyOptions: () => ({
    hooks: {
      afterResponse: [afterResponse],
    },
  }),
};

export const ZerionAPI = Object.assign(context, ZerionApiBare);
