import { createDomainHook } from 'defi-sdk';

const namespace = 'address';
const scope = 'activity';

export const useAddressActivity = createDomainHook<
  { addresses: string[] },
  Record<string, { address: string; active: boolean }>,
  typeof namespace,
  typeof scope
>({
  namespace,
  scope,
});
