import React, { useMemo, useRef } from 'react';
import { Content } from 'react-area';
import type {
  InterpretResponse,
  WarningSeverity,
} from 'src/modules/ethereum/transactions/types';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { PortalToRootNode } from 'src/ui/components/PortalToRootNode';
import { TransactionWarning } from 'src/ui/pages/SendTransaction/TransactionWarnings/TransactionWarning';
import { Button } from 'src/ui/ui-kit/Button';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import type { SecurityButtonKind } from './SecurityStatusButton';
import { SecurityStatusButton } from './SecurityStatusButton';

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

export function InterpretationSecurityCheck({
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

  const securityButtonKind: SecurityButtonKind =
    warningSeverity === 'Red'
      ? 'danger'
      : warningSeverity === 'Orange' || warningSeverity === 'Yellow'
      ? 'warning'
      : mode === 'loading'
      ? 'loading'
      : mode === 'success'
      ? 'ok'
      : 'unknown';

  return (
    <>
      <div style={{ position: 'relative' }}>
        <SecurityStatusButton
          kind={securityButtonKind}
          size="small"
          onClick={
            mode === 'loading'
              ? () => loadingDialogRef.current?.showModal()
              : mode === 'success'
              ? () => successDialogRef.current?.showModal()
              : undefined
          }
          title={
            warningSeverity
              ? 'Risks Found'
              : mode === 'loading'
              ? 'Simulating...'
              : mode === 'success'
              ? 'No Risks Found'
              : 'Unverified'
          }
        />
        {mode === 'loading' ? (
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
        ) : null}
      </div>

      <PortalToRootNode>
        <BottomSheetDialog ref={loadingDialogRef} height="fit-content">
          <InterpretationDescritionDialog mode="loading" />
        </BottomSheetDialog>
      </PortalToRootNode>
      <PortalToRootNode>
        <BottomSheetDialog ref={errorDialogRef} height="fit-content">
          <InterpretationDescritionDialog mode="error" />
        </BottomSheetDialog>
      </PortalToRootNode>
      <PortalToRootNode>
        <BottomSheetDialog ref={successDialogRef} height="fit-content">
          <InterpretationDescritionDialog mode="success" />
        </BottomSheetDialog>
      </PortalToRootNode>
      {/* <PortalToRootNode>
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
      </PortalToRootNode> */}
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
