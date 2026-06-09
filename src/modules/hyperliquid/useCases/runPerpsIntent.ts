import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { walletPort } from 'src/ui/shared/channels';
import {
  runIntent,
  type PerpsIntent,
  type RunIntentContext,
} from './runIntent';

/**
 * UI-side entry point: wires the orchestrator to `walletPort.signTypedData_v4`
 * for silent master-key signing. Forms call this directly rather than re-doing
 * the channel plumbing each time.
 */
export async function runPerpsIntent({
  intent,
  context,
}: {
  intent: PerpsIntent;
  context: RunIntentContext;
}): Promise<void> {
  return runIntent({
    intent,
    context,
    deps: {
      signTypedData: (typedData: TypedData) =>
        walletPort.request('signTypedData_v4', {
          typedData,
          typedDataContext: {
            initiator: INTERNAL_ORIGIN,
            clientScope: 'Perps',
          },
        }),
    },
  });
}
