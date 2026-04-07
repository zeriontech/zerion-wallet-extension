import React, { useId } from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { FormFieldset } from './FormFieldset';
import type { HandleChangeFunction, SwapFormState2 } from './types';

export function OutputPosition({
  formState,
  onChange,
  position,
}: {
  formState: SwapFormState2;
  onChange: HandleChangeFunction;
  position: FungiblePosition | null;
}) {
  const inputId = useId();
  return (
    <FormFieldset
      inputId={inputId}
      startTitle={<UIText kind="small/regular">Receive</UIText>}
      endTitle={<div />}
      startContent={<div>Start Content</div>}
      endContent={<div>End Content</div>}
      startDescription={<UIText kind="small/regular">Start Description</UIText>}
      endDescription={<UIText kind="small/regular">End Description</UIText>}
    />
  );
}
