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
import { useCopyToClipboard } from '../useCopyToClipboard';
import type { ParsedError } from './parseError';
import { parseError } from './parseError';
import { samples } from './samples';

function ErrorDetails({ error }: { error: ParsedError }) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: error.message });
  return (
    <>
      <div
        style={{
          color: 'var(--negative-500)',
          overflowWrap: 'break-word',
          maxHeight: '50vh',
          overflowY: 'auto',
        }}
      >
        {error.message}
      </div>
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
          kind="primary"
          style={{ paddingInline: 16 }}
        >
          Contact Support
        </Button>
      </HStack>
    </>
  );
}

export function ErrorMessage({ error }: { error: Error }) {
  const parsed = parseError(error);
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
  if (error.message === 'DeniedByUser') {
    return null;
  }
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '2px solid var(--negative-300)',
          padding: 8,
          borderRadius: 16,
          color: 'var(--negative-500)',
        }}
      >
        <UIText
          kind="body/regular"
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
        <Button
          kind="ghost"
          type="button"
          style={{ padding: 0, height: 'auto', color: 'var(--negative-500)' }}
          onClick={() => dialogRef.current?.showModal()}
          title="See full error message"
        >
          <ArrowDownIcon
            style={{
              width: 24,
              height: 24,
              display: 'block',
            }}
          />
        </Button>
      </div>

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
              <ErrorDetails error={parsed} />
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
        <ErrorMessage key={index} error={getError(sample.value)} />
      ))}
    </VStack>
  ),
});
