import React from 'react';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { UIText } from 'src/ui/ui-kit/UIText';

export function DepositForm() {
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title="Buy Crypto" backTo="/deposit" />
        <UIText kind="body/regular" color="var(--neutral-500)">
          Deposit form
        </UIText>
      </PageColumn>
    </Background>
  );
}
