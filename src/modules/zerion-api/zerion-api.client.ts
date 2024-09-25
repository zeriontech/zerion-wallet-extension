import { getAddressProviderHeader } from './requests/shared.client';
import type { ZerionApiContext } from './zerion-api-bare';
import { ZerionApiBare } from './zerion-api-bare';

const context: ZerionApiContext = {
  getAddressProviderHeader,
};

export const ZerionAPI = Object.assign(context, ZerionApiBare);
