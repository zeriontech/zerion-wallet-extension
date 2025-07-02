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
  component: (
    <VStack gap={12}>
      <ErrorMessage
        error={
          new Error(
            'Error: Simulation failed. Message: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit.. Logs: []. Catch the `SendTransactionError` and call `getLogs()` on it for full details.'
          )
        }
      />
      <ErrorMessage
        error={
          new Error(
            'Error: nonce has already been used (transaction="0x02f9065381fa819084018d4b088478c2df088306cf9e94d7f1dd5d49206349cae8b585fcb0ce3d96f1696f80b905e483d13e0100000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000024e242068150e2800000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000004a00000000000000000000000000000000000000000000000000000000000000520000000000000000000000000b3654dc3d10ea7645f8319668e8f54d2574fbdc8000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000042b9df65b219b3dd36ff330a4dd8f327a6ada990000000000000000000000000c629bf86f02ef13e8f1f5f75ade8a8165587998f000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000b3654dc3d10ea7645f8319668e8f54d2574fbdc8000000000000000000000000d0c22a5435f4e8e5770c1fafb5374015fc12f7cd000000000000000000000000d0c22a5435f4e8e5770c1fafb5374015fc12f7cd00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000000000000000e483bd37f90001b3654dc3d10ea7645f8319668e8f54d2574fbdc8000008016345785d8a00000802541a25e7d73520028f5c00013ad1e95e1bb50370774fd9d07fd7aa317d0bb11e00000001d7f1dd5d49206349cae8b585fcb0ce3d96f1696f00000000040202040008010202036ac5247ac98e1d98535c2c01096c3b4d1bdaa44c0001000000000000000006e2020300000001030114000601000201ff000000000000005965e53aa80a0bcf1cd6dbdd72e6a9b2aa047410b3654dc3d10ea7645f8319668e8f54d2574fbdc8049d68029688eabf473097a2fc38ef61633a3c7a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000068650683000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000417455606b57d2cba9a54ad083bbea0aa8a4fe91c46760a214e6bc30ca27c40c2137f887447bc0084db145fb7dee51f23cf1bb934d1fa8772fe85804f63b1e042c1b00000000000000000000000000000000000000000000000000000000000000c080a0ca4411766acbcf8decae9154d7b777022fdf58c86f5afd910611016fdc506b23a0385dad82da9989e10e6ce68ec11d43f9f2c7b3760cdcc74d513b0b4a7b5c1193", info={ "error": { "code": -32000, "message": "nonce too low" } }, code=NONCE_EXPIRED, version=6.14.0)'
          )
        }
      />
      <ErrorMessage
        error={
          new Error(
            'Error: server response 404 (request={ }, response={ }, error=null, info={ "requestUrl": "https://rpc.zerion.io/v1/fantom-fake-url", "responseBody": "{"jsonrpc":"2.0","id":1,"error":{"code":-32032,"message":"Chain is not supported."}}\n", "responseStatus": "404 " }, code=SERVER_ERROR, version=6.14.0)'
          )
        }
      />
      <ErrorMessage
        error={getError({
          message:
            'server response 404  (request={  }, response={  }, error=null, info={ "requestUrl": "https://rpc.zerion.io/v1/ethereum-fake-url", "responseBody": "{\\"jsonrpc\\":\\"2.0\\",\\"id\\":1,\\"error\\":{\\"code\\":-32032,\\"message\\":\\"Chain is not supported.\\"}}\\n", "responseStatus": "404 " }, code=SERVER_ERROR, version=6.14.0)',
          name: 'Error',
          code: 'SERVER_ERROR',
        })}
      />
    </VStack>
  ),
});
