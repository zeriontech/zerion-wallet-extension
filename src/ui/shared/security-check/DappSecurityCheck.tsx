import React, { useRef } from 'react';
import type { DappSecurityStatus } from 'src/modules/phishing-defence/phishing-defence-service';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckmarkIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import ShieldIcon from 'jsx:src/ui/assets/shield-filled.svg';
import {
  SecurityStatusButton,
  type SecurityButtonKind,
} from './SecurityStatusButton';

const SECURITY_STATUS_TO_TITLE: Record<DappSecurityStatus, string> = {
  error: 'Security Checks Unavailliable',
  loading: '',
  unknown: 'Security Checks Unavailliable',
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

function SecurityCheckDialogContent() {
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
          top: -32,
          right: -24,
          width: 160,
          height: 160,
          opacity: 0.1,
          color: 'var(--positive-400)',
        }}
      />
      <VStack gap={16} style={{ position: 'relative' }}>
        <UIText kind="headline/h3">
          Transaction simulation found no security risks
        </UIText>
        <HStack gap={12} alignItems="center">
          <CheckmarkIcon
            style={{
              color: 'var(--positive-500)',
              ['--check-color' as string]: 'var(--positive-100)',
            }}
          />
          <UIText kind="body/regular">
            This contract is open source and audited
          </UIText>
        </HStack>
        <HStack gap={12} alignItems="center">
          <CheckmarkIcon
            style={{
              color: 'var(--positive-500)',
              ['--check-color' as string]: 'var(--positive-100)',
            }}
          />
          <UIText kind="body/regular">The website is verified</UIText>
        </HStack>
        <HStack gap={12} alignItems="center">
          <CheckmarkIcon
            style={{
              color: 'var(--positive-500)',
              ['--check-color' as string]: 'var(--positive-100)',
            }}
          />
          <UIText kind="body/regular">Tokens involved are not honeypots</UIText>
        </HStack>
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

export function SecurityCheck({
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
      <BottomSheetDialog
        ref={dialogRef}
        height="fit-content"
        containerStyle={{ padding: 0, overflow: 'hidden' }}
      >
        <SecurityCheckDialogContent />
      </BottomSheetDialog>
      <SecurityStatusButton
        kind={SECURITY_STATUS_BUTTON_KIND[status]}
        title={SECURITY_STATUS_TO_TITLE[status]}
        onClick={isLoading ? undefined : () => dialogRef.current?.showModal()}
        size="big"
      />
    </>
  );
}
