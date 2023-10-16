import React from 'react';
import type { SiweMessage } from 'src/modules/ethereum/message-signing/SIWE';
import {
  SiweValidationError,
  SiweValidationWarning,
} from 'src/modules/ethereum/message-signing/SIWE';
import { NavigationBar } from 'src/ui/components/NavigationBar';
import { PageTop } from 'src/ui/components/PageTop';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

function getErrors(siwe: SiweMessage) {
  const errors = [] as { message: string; kind: 'error' | 'warning' }[];

  if (siwe.hasError(SiweValidationError.missingDomain)) {
    errors.push({ message: 'Missing domain', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.missingAddress)) {
    errors.push({ message: 'Missing address', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.missingURI)) {
    errors.push({ message: 'Missing "URI"', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.missingVersion)) {
    errors.push({ message: 'Missing "Version"', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.invalidVersion)) {
    errors.push({ message: '"Version" should be equal "1"', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.missingNonce)) {
    errors.push({ message: 'Missing "Nonce"', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.missingChainId)) {
    errors.push({ message: 'Missing "Chain ID"', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.missingIssuedAt)) {
    errors.push({ message: 'Missing "Issued At"', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.expiredMessage)) {
    errors.push({ message: '"Expiration Time" is in the past', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.invalidNotBefore)) {
    errors.push({ message: '"Not before" is in the future', kind: 'error' });
  }
  if (siwe.hasError(SiweValidationError.invalidTimeFormat)) {
    errors.push({
      message: 'Datetime fields are not ISO-8601 compliant',
      kind: 'error',
    });
  }
  if (siwe.hasWarning(SiweValidationWarning.invalidAddress)) {
    errors.push({
      message: 'Address does not conform to EIP-55',
      kind: 'warning',
    });
  }
  if (siwe.hasWarning(SiweValidationWarning.domainMismatch)) {
    errors.push({
      message: 'Provided domain does not match the application domain',
      kind: 'warning',
    });
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
        <VStack gap={4}>
          {errors.map((error, index) => (
            <HStack key={index} gap={8} alignItems="center">
              <UIText kind="body/regular">•</UIText>
              <UIText kind="body/regular">{error.message}</UIText>
              <WarningIcon
                kind={error.kind === 'error' ? 'negative' : 'notice'}
                size={20}
              />
            </HStack>
          ))}
        </VStack>
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
