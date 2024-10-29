import React from 'react';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { Frame } from 'src/ui/ui-kit/Frame';

export function XpDropClaim() {
  return (
    <PageColumn>
      <NavigationTitle title="Claim Your XP" backTo="/overview" />
      <PageTop />
      <Frame>Claim Your XP</Frame>
    </PageColumn>
  );
}
