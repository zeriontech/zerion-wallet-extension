import React from 'react';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import { BackButton } from '../BackButton';

export function NavigationBackButton() {
  const goBack = useGoBack();
  return <BackButton onClick={goBack} />;
}
