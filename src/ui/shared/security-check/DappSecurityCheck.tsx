import React, { useRef } from 'react';
import type { DappSecurityStatus } from 'src/modules/phishing-defence/phishing-defence-service';
import { Button } from 'src/ui/ui-kit/Button';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ShieldIcon from 'jsx:src/ui/assets/shield-filled.svg';
import WarningIcon from 'jsx:src/ui/assets/warning-triangle.svg';
import { TransactionWarning } from 'src/ui/pages/SendTransaction/TransactionWarnings/TransactionWarning';
import {
  SecurityStatusButton,
  type SecurityButtonKind,
} from './SecurityStatusButton';

const SECURITY_STATUS_TO_TITLE: Record<DappSecurityStatus, string> = {
  error: 'Unverified',
  loading: '',
  unknown: 'Unverified',
  phishing: 'Risks Found',
  ok: 'No Risks Found',
};

const SECURITY_STATUS_BUTTON_KIND: Record<
  DappSecurityStatus,
  SecurityButtonKind
> = {
  error: 'unknown',
  loading: 'loading',
  unknown: 'unknown',
  phishing: 'danger',
  ok: 'ok',
};

function SecurityCheckDialogContent({ status }: { status: 'ok' | 'error' }) {
  if (status === 'error') {
    return (
      <VStack
        gap={32}
        style={{
          padding: '16px 16px 24px',
          position: 'relative',
          background:
            'linear-gradient(111deg, var(--primary-100) 0%, var(--primary-200) 100%)',
        }}
      >
        <WarningIcon
          style={{
            position: 'absolute',
            top: -50,
            right: -70,
            width: 200,
            height: 200,
            opacity: 0.1,
            color: 'var(--primary-400)',
          }}
        />
        <VStack gap={16} style={{ position: 'relative' }}>
          <UIText kind="headline/h3">Unverified</UIText>
          <UIText kind="body/regular">
            We couldn’t verify this website or complete security checks. Be
            careful and connect only if you trust the source.Security checks are
            powered by Blockaid.
          </UIText>
          <UIText kind="body/regular">
            Security checks are powered by Blockaid.
          </UIText>
        </VStack>
        <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
          <Button
            value={DialogButtonValue.cancel}
            kind="primary"
            style={{ width: '100%' }}
          >
            Close
          </Button>
        </form>
      </VStack>
    );
  }

  return (
    <VStack
      gap={32}
      style={{
        padding: '16px 16px 24px',
        position: 'relative',
        background:
          'linear-gradient(111deg, var(--positive-100) 0%, var(--positive-200) 100%)',
      }}
    >
      <ShieldIcon
        style={{
          position: 'absolute',
          top: -100,
          right: -90,
          width: 300,
          height: 300,
          opacity: 0.1,
          color: 'var(--positive-400)',
        }}
      />
      <VStack gap={16} style={{ position: 'relative' }}>
        <UIText kind="headline/h3">No Risks Found</UIText>
        <UIText kind="body/regular">
          We scanned this website and found no malicious code or phishing
          attempts. It appears safe to connect. Always stay cautious and
          double-check before proceeding.
        </UIText>
        <UIText kind="body/regular">
          Security checks are powered by Blockaid.
        </UIText>
      </VStack>
      <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
        <Button
          value={DialogButtonValue.cancel}
          kind="primary"
          style={{ width: '100%' }}
        >
          Close
        </Button>
      </form>
    </VStack>
  );
}

export function DappSecurityCheck({
  status: rawStatus,
  isLoading: statusIsLoading,
}: {
  status?: DappSecurityStatus;
  isLoading?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const isLoading = statusIsLoading || rawStatus === 'loading';
  const status = isLoading ? 'loading' : rawStatus || 'unknown';

  return (
    <>
      {status === 'ok' || status === 'error' ? (
        <BottomSheetDialog
          ref={dialogRef}
          height="fit-content"
          containerStyle={{ padding: 0, overflow: 'hidden' }}
        >
          <SecurityCheckDialogContent status={status} />
        </BottomSheetDialog>
      ) : null}
      <VStack gap={8}>
        <SecurityStatusButton
          kind={SECURITY_STATUS_BUTTON_KIND[status]}
          title={SECURITY_STATUS_TO_TITLE[status]}
          onClick={
            status === 'ok' || status === 'error'
              ? () => dialogRef.current?.showModal()
              : undefined
          }
          size="big"
        />
        {status === 'phishing' ? (
          <TransactionWarning
            title="Potential risks:"
            kind="danger"
            message={
              <ul style={{ marginBlock: 0, paddingInline: '1em' }}>
                <li>
                  <UIText kind="body/regular">Theft of recovery phrase</UIText>
                </li>
                <li>
                  <UIText kind="body/regular">Phishing attacks</UIText>
                </li>
                <li>
                  <UIText kind="body/regular">Fake tokens or scams</UIText>
                </li>
              </ul>
            }
          />
        ) : null}
      </VStack>
    </>
  );
}
