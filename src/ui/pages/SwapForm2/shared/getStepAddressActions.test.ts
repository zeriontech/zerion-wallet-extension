import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import {
  createFallbackApprove,
  createFallbackBridge,
  interpretedBridgeWithApprove,
  usdc,
} from 'src/modules/ethereum/transactions/addressAction/approveBridge.fixtures';
import { getStepAddressActions } from './getStepAddressActions';

const combinations = [true, false].flatMap((hasApprove) =>
  [true, false].flatMap((hasInterpretation) =>
    (['send', 'order'] as const).map((swapStep) => ({ hasApprove, hasInterpretation, swapStep })),
  ),
);

test('the batch interpretation carries an approve act', () => {
  expect(interpretedBridgeWithApprove.acts?.map((act) => act.type.value)).toContain('approve');
});

test.each(combinations)(
  'approve $hasApprove, interpretation $hasInterpretation, $swapStep step',
  ({ hasApprove, hasInterpretation, swapStep }) => {
    const interpretationAction: AnyAddressAction | null = hasInterpretation
      ? interpretedBridgeWithApprove
      : null;
    const fallbackApproveAction: AnyAddressAction | null = hasApprove
      ? createFallbackApprove()
      : null;
    const fallbackSwapAction: AnyAddressAction = createFallbackBridge({
      onChain: swapStep === 'send',
    });

    const { approve, swap } = getStepAddressActions<AnyAddressAction>({
      interpretationAction,
      fallbackApproveAction,
      fallbackSwapAction,
    });

    expect(approve).toEqual(fallbackApproveAction);
    if (interpretationAction) {
      expect(approve).not.toBe(interpretationAction);
    }
    if (hasApprove) {
      expect(approve?.type.value).toBe('approve');
      expect(approve?.content?.approvals?.[0].fungible).toBe(usdc);
    } else {
      expect(approve).toBeNull();
    }
    expect(swap).toBe(interpretationAction ?? fallbackSwapAction);
  },
);
