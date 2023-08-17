import React from 'react';
import {
  FishingDefenceServiceFailWarning,
  useFishingDefenceServiceFail,
} from 'src/ui/components/FishingDefence/FishingDefenceFailWarning';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ZStack } from 'src/ui/ui-kit/ZStack';

export function SignMessageWarning({ origin }: { origin: string }) {
  const isDefenceDerviceFail = useFishingDefenceServiceFail(origin);

  const hasWarning = isDefenceDerviceFail;

  return (
    <>
      <ZStack hideLowerElements={true}>
        {isDefenceDerviceFail ? <FishingDefenceServiceFailWarning /> : null}
      </ZStack>
      {hasWarning ? <Spacer height={16} /> : null}
    </>
  );
}
