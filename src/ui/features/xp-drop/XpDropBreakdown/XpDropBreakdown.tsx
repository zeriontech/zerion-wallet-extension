import React from 'react';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { Frame } from 'src/ui/ui-kit/Frame';

export function XpDropBreakdown() {
  return (
    <PageColumn>
      <NavigationTitle title="XP Breakdown" />
      <PageTop />
      <Frame>XP Breakdown</Frame>
    </PageColumn>
  );
}
