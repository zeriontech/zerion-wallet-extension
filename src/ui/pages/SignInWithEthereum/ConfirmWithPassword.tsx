import React from 'react';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { VerifyUser } from 'src/ui/components/VerifyUser';

export function ConfirmWithPassword() {
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <NavigationTitle title="Enter password" />
        <FillView adjustForNavigationBar={true}>
          <VerifyUser
            style={{ alignItems: 'center' }}
            text="Verification is required in order to ignore the warning and proceed further"
            onSuccess={() => console.log('success')}
          />
        </FillView>
      </PageColumn>
    </Background>
  );
}
