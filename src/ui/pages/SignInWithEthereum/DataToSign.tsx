import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';

export function DataToSign() {
  const [params] = useSearchParams();
  const message = params.get('message');

  invariant(message, 'message get-parameter is required');

  return (
    <Background>
      <PageColumn>
        <PageTop />
        <NavigationTitle title={null} />
        <PageHeading>Data to Sign</PageHeading>
        <Surface
          padding={16}
          style={{ border: '1px solid var(--neutral-300)' }}
        >
          <UIText kind="small/regular" style={{ whiteSpace: 'pre-wrap' }}>
            {message}
          </UIText>
        </Surface>
      </PageColumn>
    </Background>
  );
}
