import React from 'react';
import type { SiweMessage } from 'src/modules/ethereum/message-signing/SIWE';
import {
  SiweValidationError,
  SiweValidationWarning,
} from 'src/modules/ethereum/message-signing/SIWE';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { ValidationMessage } from '../ValidationMessage';

interface SiweValidationErrorMessage {
  kind: 'danger' | 'warning';
  title: string;
  text: string;
}

const errorMessages: Record<string, SiweValidationErrorMessage> = {
  notParsed: {
    kind: 'danger',
    title: 'Invalid Signing Data',
    text: 'The signing data looks like a SIWE (EIP-4361) but has invalid structure',
  },
  addressMismatch: {
    kind: 'danger',
    title: 'Address Mismatch',
    text: 'The address in the signing data doesn’t match the address associated with your wallet',
  },
  dataVerificationFailed: {
    kind: 'danger',
    title: 'Data Verification Failed',
    text: 'The data received from the dapp contains errors and didn’t pass verification',
  },
};

const warningMessages: Record<string, SiweValidationErrorMessage> = {
  invalidAddress: {
    kind: 'warning',
    title: 'Invalid Address Format',
    text: 'Address does not conform to EIP-55',
  },
  domainMismatch: {
    kind: 'warning',
    title: 'Domain Mismatch',
    text: 'The application asks to sign data from a different domain than the DApp. Double-check the request before signing.',
  },
  dataVerificationWarning: {
    kind: 'warning',
    title: 'Data Verification Warning',
    text: 'The data received from the dapp didn’t pass verification',
  },
};

export function SiweError({
  siwe,
  onReadMore,
}: {
  siwe: SiweMessage | null;
  onReadMore: () => void;
}) {
  if (siwe === null) {
    return <ValidationMessage {...errorMessages.notParsed} />;
  }
  if (siwe.hasError(SiweValidationError.addressMismatch)) {
    return <ValidationMessage {...errorMessages.addressMismatch} />;
  }
  if (!siwe.isValid()) {
    return (
      <ValidationMessage
        actions={
          <TextAnchor
            style={{
              color: 'var(--primary)',
              cursor: 'pointer',
            }}
            onClick={onReadMore}
          >
            <UIText kind="small/accent">Read more</UIText>
          </TextAnchor>
        }
        {...errorMessages.dataVerificationFailed}
      />
    );
  }
  if (siwe.hasWarning(SiweValidationWarning.domainMismatch)) {
    return <ValidationMessage {...warningMessages.domainMismatch} />;
  }
  if (siwe.hasWarning(SiweValidationWarning.invalidAddress)) {
    return <ValidationMessage {...warningMessages.invalidAddress} />;
  }
  if (siwe.isWarning()) {
    return (
      <ValidationMessage
        actions={
          <TextAnchor
            style={{
              color: 'var(--primary)',
              cursor: 'pointer',
            }}
            onClick={onReadMore}
          >
            <UIText kind="small/accent">Read more</UIText>
          </TextAnchor>
        }
        {...warningMessages.dataVerificationWarning}
      />
    );
  }
  return null;
}
