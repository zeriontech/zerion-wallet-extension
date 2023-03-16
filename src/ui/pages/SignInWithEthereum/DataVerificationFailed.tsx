import React from 'react';
import {
  SiweMessage,
  SiweValidationError,
} from 'src/modules/ethereum/message-signing/SIWE';
import { PageTop } from 'src/ui/components/PageTop';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { NavigationBar } from './NavigationBar';

function getErrors(siwe: SiweMessage) {
  const errors = [];

  if (siwe.hasError(SiweValidationError.missingDomain)) {
    errors.push('Missing domain');
  }
  if (siwe.hasError(SiweValidationError.missingAddress)) {
    errors.push('Missing address');
  }
  if (siwe.hasError(SiweValidationError.invalidAddress)) {
    errors.push('Address does not conform to EIP-55');
  }
  if (siwe.hasError(SiweValidationError.missingURI)) {
    errors.push('Missing "URI"');
  }
  if (siwe.hasError(SiweValidationError.missionVersion)) {
    errors.push('Missing "Version"');
  }
  if (siwe.hasError(SiweValidationError.invalidVersion)) {
    errors.push('"Version" should be equal "1"');
  }
  if (siwe.hasError(SiweValidationError.missingNonce)) {
    errors.push('Missing "Nonce"');
  }
  if (siwe.hasError(SiweValidationError.missingChainId)) {
    errors.push('Missing "Chain ID"');
  }
  if (siwe.hasError(SiweValidationError.missingIssuedAt)) {
    errors.push('Missing "Issued At"');
  }
  if (siwe.hasError(SiweValidationError.expiredMessage)) {
    errors.push('"Expiration Time" is in the past');
  }
  if (siwe.hasError(SiweValidationError.invalidNotBefore)) {
    errors.push('"Not before" is in the future');
  }
  if (siwe.hasError(SiweValidationError.invalidTimeFormat)) {
    errors.push('One or more datetime fields are not complient to ISO-8601');
  }

  return errors;
}

export function DataVerificationFailed({ siwe }: { siwe: SiweMessage }) {
  const errors = getErrors(siwe);

  return (
    <>
      <NavigationBar title="Data Verification Failed" />
      <PageTop />
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
        <ul style={{ color: 'var(--negative-500)' }}>
          {errors.map((error, index) => (
            <li key={index}>
              <HStack
                gap={8}
                alignItems="center"
                style={{ color: 'var(--negative-500)' }}
              >
                <WarningIcon
                  kind="negative"
                  style={{ width: 16, height: 16 }}
                />
                <UIText kind="body/regular">{error}</UIText>
              </HStack>
            </li>
          ))}
        </ul>
        <div>
          <UIText kind="body/regular" inline={true}>
            Try to repeat the request and review the signing data by clicking{' '}
            <strong style={{ fontWeight: 500 }}>'Advanced View'</strong> to
            ensure that the parameters are correct. If the issue persists, seek
            further assistance from DApp's support.
          </UIText>
        </div>
      </VStack>
    </>
  );
}
