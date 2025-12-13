import React, { useRef } from 'react';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { registerPreviewPermanent } from 'src/ui-lab/previews/registerPreview';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PortalToRootNode } from 'src/ui/components/PortalToRootNode';
import { getError } from 'get-error';
import type { ParsedError } from 'src/shared/errors/parse-error/parseError';
import { parseError } from 'src/shared/errors/parse-error/parseError';
import { samples } from 'src/shared/errors/parse-error/samples';
import type { LedgerError } from '@zeriontech/hardware-wallet-connection';
import { TroubleshootingDialog } from 'src/ui/hardware-wallet/TroubleshootingDialog';
import { Frame } from 'src/ui/ui-kit/Frame';
import { useCopyToClipboard } from '../useCopyToClipboard';
import * as styles from './ErrorMessage.module.css';

function ErrorDetails({
  error,
  hardwareError,
}: {
  error: ParsedError;
  hardwareError: LedgerError | null;
}) {
  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: (hardwareError && hardwareError.toString()) || error.message,
  });
  return (
    <>
      <UIText
        kind="small/regular"
        style={{
          color: 'var(--negative-500)',
          overflowWrap: 'break-word',
          maxHeight: '50vh',
          overflowY: 'auto',
        }}
      >
        {error.message}
      </UIText>
      {hardwareError && (
        <Frame style={{ borderColor: 'var(--notice-500)' }}>
          <VStack gap={8} style={{ padding: '12px 12px 16px' }}>
            <UIText kind="small/regular" color="var(--neutral-700)">
              Hardware Wallet Issue
            </UIText>
            <div style={{ display: 'flex' }}>
              <TroubleshootingDialog error={hardwareError} />
            </div>
          </VStack>
        </Frame>
      )}
      <HStack gap={12} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button kind="regular" value="cancel" onClick={handleCopy}>
          {isSuccess ? (
            <HStack
              gap={8}
              alignItems="center"
              style={{ width: 'max-content', marginInline: 'auto' }}
            >
              <CheckIcon
                style={{
                  display: 'block',
                  width: 20,
                  height: 20,
                  color: 'var(--positive-500)',
                }}
              />
              <span>Copied</span>
            </HStack>
          ) : (
            <span>Copy</span>
          )}
        </Button>
        <Button
          as={UnstyledAnchor}
          href="https://help.zerion.io/en/"
          target="_blank"
          rel="noopener noreferrer"
          kind="primary"
          style={{ paddingInline: 16 }}
        >
          Get Help
        </Button>
      </HStack>
    </>
  );
}

export function ErrorMessage({
  error,
  hardwareError,
}: {
  error: Error;
  hardwareError: LedgerError | null;
}) {
  const parsed = parseError(error);
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
  if (error.message === 'DeniedByUser') {
    return null;
  }
  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className={styles.errorButton}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <UIText
          kind="small/accent"
          style={{
            textAlign: 'start',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {parsed.display || parsed.message}
        </UIText>
        <ArrowDownIcon
          style={{
            flexShrink: 0,
            width: 24,
            height: 24,
            display: 'block',
          }}
        />
      </button>

      <PortalToRootNode>
        <BottomSheetDialog
          ref={dialogRef}
          style={{ height: 'min-content' }}
          renderWhenOpen={() => (
            <VStack gap={16}>
              <DialogTitle
                title={<UIText kind="headline/h3">Error Details</UIText>}
                alignTitle="start"
              />
              <ErrorDetails error={parsed} hardwareError={hardwareError} />
            </VStack>
          )}
        />
      </PortalToRootNode>
    </>
  );
}

registerPreviewPermanent({
  name: 'ErrorMessage',
  component: () => (
    <VStack gap={12}>
      {samples.map((sample, index) => (
        <ErrorMessage
          key={index}
          error={getError(sample.value)}
          hardwareError={null}
        />
      ))}
    </VStack>
  ),
});
