import React from 'react';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function DataVerificationFailed() {
  const errors = ['Chain ID', 'Version', 'Nonce', 'Issued At'];

  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title="Data Verification Failed" />
        <VStack gap={8}>
          <UIText kind="body/regular">
            According to{' '}
            <TextAnchor
              href="https://eips.ethereum.org/EIPS/eip-4361"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary-500)' }}
            >
              ERC-4361 standards
            </TextAnchor>{' '}
            Zerion found an issue with the data received from the dapp:
          </UIText>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <div>
            <UIText kind="body/regular" inline={true}>
              Try to repeat the request and review the signing data by clicking{' '}
              <strong style={{ fontWeight: 500 }}>'Advanced View'</strong> to
              ensure that the parameters are correct. If the issue persists,
              seek further assistance from DApp's support.
            </UIText>
          </div>
        </VStack>
      </PageColumn>
    </Background>
  );
}
