import { animated, useSpring } from '@react-spring/web';
import React, { useRef } from 'react';
import type { DappSecurityStatus } from 'src/modules/phishing-defence/phishing-defence-service';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckmarkIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import ShieldIcon from 'jsx:src/ui/assets/shield-filled.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import * as styles from './styles.module.css';

const SECURITY_COLORS: Record<
  DappSecurityStatus,
  { primary: string; secondary: string }
> = {
  error: {
    primary: 'var(--neutral-600)',
    secondary: 'var(--neutral-100)',
  },
  loading: {
    primary: 'var(--neutral-600)',
    secondary: 'var(--neutral-100)',
  },
  unknown: {
    primary: 'var(--neutral-600)',
    secondary: 'var(--neutral-100)',
  },
  phishing: {
    primary: 'var(--negative-500)',
    secondary: 'var(--negative-200)',
  },
  ok: {
    primary: 'var(--positive-500)',
    secondary: 'var(--positive-100)',
  },
};

const SECURITY_STATUS_TO_TITLE: Record<DappSecurityStatus, string> = {
  error: 'Security Checks Unavailliable',
  loading: '',
  unknown: 'Security Checks Unavailliable',
  phishing: 'Risks Found',
  ok: 'No Risks Found',
};

function SecurityCheckIcon({ status }: { status: DappSecurityStatus }) {
  if (status === 'loading') {
    return (
      <div
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className={styles.loadingShield}>
          <div />
        </div>
      </div>
    );
  }
  if (status === 'ok') {
    return (
      <div
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldIcon style={{ color: 'var(--positive-500)' }} />
      </div>
    );
  }
}

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

  const style = useSpring({
    from: { transform: 'scale(1)' },
    to: { transform: isLoading ? 'scale(0.8)' : 'scale(1)' },
    config: {
      duration: isLoading ? 5000 : undefined,
      tension: isLoading ? 100 : 200,
      friction: isLoading ? 50 : 10,
    },
  });

  return (
    <>
      <DelayedRender delay={100}>
        {isLoading ? null : (
          <div className={styles.backgroundGradientContainer}>
            <div className={styles.backgroundGradient} />
          </div>
        )}
      </DelayedRender>
      <BottomSheetDialog
        ref={dialogRef}
        height="fit-content"
        containerStyle={{ padding: 0, overflow: 'hidden' }}
      >
        <SecurityCheckDialogContent />
      </BottomSheetDialog>
      <animated.div style={style}>
        <UnstyledButton
          style={{ width: '100%' }}
          disabled={isLoading}
          onClick={() => dialogRef.current?.showModal()}
        >
          <HStack
            gap={16}
            justifyContent="space-between"
            alignItems="center"
            style={{
              backgroundColor: SECURITY_COLORS[status].secondary,
              padding: '8px 12px',
              borderRadius: 100,
            }}
          >
            <HStack gap={12} alignItems="center">
              <SecurityCheckIcon status={status} />
              <UIText
                kind="body/accent"
                color={SECURITY_COLORS[status].primary}
                style={{ textAlign: 'start' }}
              >
                {SECURITY_STATUS_TO_TITLE[status]}
              </UIText>
            </HStack>
            {isLoading ? null : (
              <ArrowDownIcon
                style={{
                  width: 24,
                  height: 24,
                  color: SECURITY_COLORS[status].primary,
                }}
              />
            )}
          </HStack>
        </UnstyledButton>
      </animated.div>
    </>
  );
}
