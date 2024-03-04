import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Content } from 'react-area';
import type {
  InterpretResponse,
  WarningSeverity,
} from 'src/modules/ethereum/transactions/types';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import ShieldIcon from 'jsx:src/ui/assets/shield.svg';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { TransactionWarning } from 'src/ui/pages/SendTransaction/TransactionWarnings/TransactionWarning';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { DelayedRender } from '../DelayedRender';

const WarningSeverityPriority: Record<WarningSeverity, number> = {
  Gray: 0,
  Yellow: 1,
  Orange: 2,
  Red: 3,
};

function warningComparator(
  a: InterpretResponse['warnings'][0],
  b: InterpretResponse['warnings'][0]
) {
  // We have fallback value here in case backend introduces new severity value
  return (
    (WarningSeverityPriority[b.severity] || 0) -
    (WarningSeverityPriority[a.severity] || 0)
  );
}

function getMostSevereWarning(warnings?: InterpretResponse['warnings']) {
  if (!warnings) {
    return null;
  }
  return warnings.sort(warningComparator)[0];
}

export function hasCriticalWarning(
  warnings?: InterpretResponse['warnings'] | null
) {
  if (!warnings) {
    return false;
  }
  const severity = getMostSevereWarning(warnings)?.severity;
  return severity === 'Red' || severity === 'Orange';
}

function LoadingText({ children }: React.PropsWithChildren) {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | number>(0);
  useEffect(() => {
    intervalRef.current = setInterval(
      () => setTick((current) => (current + 1) % 4),
      500
    );
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);
  return (
    <span>
      {children}
      {Array.from({ length: 3 }, (_, i) => (
        <span
          key={`${tick}-${i}`}
          style={{ color: i < tick ? 'undefined' : 'transparent' }}
        >
          .
        </span>
      ))}
    </span>
  );
}

type InterpretationMode = 'loading' | 'error' | 'success';
const MODE_TO_TITLE: Record<InterpretationMode, string> = {
  loading: 'Transaction Analysis',
  error: 'Transaction Analysis Failed',
  success: 'Transaction Verified',
};
const MODE_TO_DESCRIPTION: Record<InterpretationMode, string> = {
  loading:
    'We simulate your transaction behavior to preview the exact outcome, identify risks, and protect your funds before signing and executing onchain.',
  error:
    'We were unable to simulate the transaction or complete all security checks. Please proceed with caution.',
  success:
    'Our transaction simulation found no security issues. However, it is always crucial to double-check and proceed with caution.',
};

function InterpretationDescritionDialog({
  mode,
}: {
  mode: InterpretationMode;
}) {
  return (
    <>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />
      <VStack gap={16}>
        <UIText kind="headline/h3">{MODE_TO_TITLE[mode]}</UIText>
        <UIText kind="small/regular">{MODE_TO_DESCRIPTION[mode]}</UIText>
        <UIText kind="small/regular">
          Security checks are powered by Blockaid.
        </UIText>
        <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
          <Button style={{ width: '100%' }} value={DialogButtonValue.cancel}>
            Close
          </Button>
        </form>
      </VStack>
    </>
  );
}

export function InterpretationState({
  interpretQuery,
  interpretation,
}: {
  interpretation: InterpretResponse | null | undefined;
  interpretQuery: {
    isInitialLoading: boolean;
    isError: boolean;
  };
}) {
  const loadingDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const errorDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const successDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const warningDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const mode: InterpretationMode = interpretQuery.isInitialLoading
    ? 'loading'
    : interpretQuery.isError
    ? 'error'
    : 'success';

  const mostSevereWarning = useMemo(
    () => getMostSevereWarning(interpretation?.warnings),
    [interpretation]
  );
  const warningSeverity = mostSevereWarning?.severity;

  const showShowMoreButton = Boolean(
    (interpretation?.warnings.length || 0) > 1 || mostSevereWarning?.details
  );

  return (
    <>
      {warningSeverity === 'Red' ||
      warningSeverity === 'Orange' ||
      warningSeverity === 'Yellow' ? (
        <Button
          kind={warningSeverity === 'Yellow' ? 'warning' : 'danger'}
          size={36}
          type="button"
          disabled={!showShowMoreButton}
          style={{
            ['--button-disabled-background' as string]:
              warningSeverity === 'Yellow'
                ? 'var(--notice-100)'
                : 'var(--negative-100)',
          }}
          onClick={() => {
            if (showShowMoreButton) {
              warningDialogRef.current?.showModal();
            }
          }}
        >
          <HStack gap={4} alignItems="center" justifyContent="center">
            <ValidationErrorIcon
              style={{
                color:
                  warningSeverity === 'Yellow'
                    ? 'var(--notice-500)'
                    : 'var(--negative-500)',
                width: 20,
                height: 20,
              }}
            />
            {warningSeverity === 'Yellow' ? 'Unverified' : 'Risk'}
          </HStack>
        </Button>
      ) : mode === 'loading' ? (
        <VStack gap={0}>
          <Button
            kind="regular"
            size={36}
            type="button"
            style={{ position: 'relative' }}
            onClick={() => loadingDialogRef.current?.showModal()}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <CircleSpinner />
              <LoadingText>Simulating</LoadingText>
            </HStack>
            <ZStack
              hideLowerElements={true}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              <DelayedRender delay={11000}>
                <span style={{ color: 'var(--black)' }}>
                  (Going to give up soon...)
                </span>
              </DelayedRender>
              <DelayedRender delay={6000}>
                <span style={{ color: 'var(--black)' }}>
                  (Request is taking longer than usual...)
                </span>
              </DelayedRender>
            </ZStack>
          </Button>
          <DelayedRender delay={6000}>
            <Spacer height={20} />
          </DelayedRender>
        </VStack>
      ) : mode === 'error' ? (
        <Button
          kind="warning"
          size={36}
          type="button"
          onClick={() => errorDialogRef.current?.showModal()}
        >
          <HStack gap={4} alignItems="center" justifyContent="center">
            <ValidationErrorIcon
              style={{ color: 'var(--notice-500)', width: 20, height: 20 }}
            />
            <span>Unverified</span>
          </HStack>
        </Button>
      ) : warningSeverity ? (
        <Button
          kind="regular"
          size={36}
          type="button"
          disabled={!showShowMoreButton}
          onClick={() => {
            if (showShowMoreButton) {
              warningDialogRef.current?.showModal();
            }
          }}
        >
          <HStack gap={4} alignItems="center" justifyContent="center">
            <ValidationErrorIcon
              style={{ color: 'var(--notice-500)', width: 20, height: 20 }}
            />
            <span>Unverified</span>
          </HStack>
        </Button>
      ) : mode === 'success' ? (
        <Button
          kind="regular"
          size={36}
          type="button"
          onClick={() => successDialogRef.current?.showModal()}
        >
          <HStack gap={4} alignItems="center" justifyContent="center">
            <ShieldIcon
              style={{ color: 'var(--positive-500)', width: 20, height: 20 }}
            />
            <span>Verified</span>
          </HStack>
        </Button>
      ) : null}
      <BottomSheetDialog ref={loadingDialogRef} height="fit-content">
        <InterpretationDescritionDialog mode="loading" />
      </BottomSheetDialog>
      <BottomSheetDialog ref={errorDialogRef} height="fit-content">
        <InterpretationDescritionDialog mode="error" />
      </BottomSheetDialog>
      <BottomSheetDialog ref={successDialogRef} height="fit-content">
        <InterpretationDescritionDialog mode="success" />
      </BottomSheetDialog>
      <BottomSheetDialog
        height="fit-content"
        ref={warningDialogRef}
        renderWhenOpen={() => (
          <>
            <DialogCloseButton
              style={{ position: 'absolute', top: 8, right: 8 }}
            />
            <VStack gap={16}>
              <UIText kind="headline/h3">Verification Details</UIText>
              {interpretation?.warnings
                .sort(warningComparator)
                .map((warning, index) => (
                  <VStack gap={0} key={index}>
                    <UIText kind="body/accent">{warning.title}</UIText>
                    <UIText kind="body/regular">{warning.details}</UIText>
                  </VStack>
                ))}
              <form
                method="dialog"
                onSubmit={(event) => event.stopPropagation()}
              >
                <Button
                  style={{ width: '100%' }}
                  value={DialogButtonValue.cancel}
                  aria-label="Close"
                >
                  Close
                </Button>
              </form>
            </VStack>
          </>
        )}
      />
      <Content name="transaction-warning-section">
        {mostSevereWarning ? (
          <TransactionWarning
            title={mostSevereWarning.title}
            message={
              <div
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
                title={mostSevereWarning.description}
              >
                {mostSevereWarning.description}
              </div>
            }
            kind={
              warningSeverity === 'Red' || warningSeverity === 'Orange'
                ? 'danger'
                : warningSeverity === 'Yellow'
                ? 'warning'
                : 'info'
            }
            footer={
              showShowMoreButton ? (
                <Button
                  onClick={() => warningDialogRef.current?.showModal()}
                  kind="text-primary"
                  style={{
                    ['--button-text' as string]: 'var(--primary)',
                    ['--button-text-hover' as string]: 'var(--primary-600)',
                  }}
                >
                  Read more
                </Button>
              ) : null
            }
          />
        ) : mode === 'error' ? (
          <TransactionWarning
            message="We were unable to simulate the transaction or complete all security checks. Please proceed with caution. "
            kind="warning"
            style={{ paddingInline: 15 }}
          />
        ) : null}
      </Content>
    </>
  );
}
