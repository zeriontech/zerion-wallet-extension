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
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import ShieldIcon from 'jsx:src/ui/assets/shield-filled.svg';
import WarningIcon from 'jsx:src/ui/assets/warning-triangle.svg';
import { SecurityStatusButton } from './SecurityStatusButton';
import type { SecurityButtonKind } from './SecurityStatusButton';

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

function sortWarnings(warnings?: InterpretResponse['warnings']) {
  if (!warnings) {
    return null;
  }
  return warnings.sort(warningComparator);
}

export function hasCriticalWarning(
  warnings?: InterpretResponse['warnings'] | null
) {
  if (!warnings) {
    return false;
  }
  const severity = sortWarnings(warnings)?.at(0)?.severity;
  return severity === 'Red' || severity === 'Orange';
}

type InterpretationMode = 'loading' | 'error' | 'success';

function InterpretationDescritionDialog({
  mode,
}: {
  mode: InterpretationMode;
}) {
  if (mode === 'loading') {
    return (
      <VStack
        gap={32}
        style={{
          padding: '16px 16px 24px',
          position: 'relative',
          background:
            'linear-gradient(111deg, var(--neutral-100) 0%, var(--neutral-200) 100%)',
        }}
      >
        <VStack gap={16} style={{ position: 'relative' }}>
          <UIText kind="headline/h3">
            Transaction simulation found no security risks
          </UIText>

          <UIText kind="body/regular">
            This contract is open source and audited
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
  if (mode === 'error') {
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
            We were unable to simulate the transaction or complete all security
            checks. Please proceed with caution.
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
          Our simulation found no security issues. However, it is always crucial
          to double-check and proceed with caution.
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

  const warnings = useMemo(
    () => sortWarnings(interpretation?.warnings),
    [interpretation]
  );
  const warningSeverity = warnings?.at(0)?.severity;

  const securityButtonKind: SecurityButtonKind =
    warningSeverity === 'Red' || warningSeverity === 'Orange'
      ? 'danger'
      : warningSeverity === 'Yellow'
      ? 'warning'
      : warningSeverity === 'Gray'
      ? 'unknown'
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
              : mode === 'error'
              ? () => errorDialogRef.current?.showModal()
              : mode === 'success' && !warningSeverity
              ? () => successDialogRef.current?.showModal()
              : undefined
          }
          title={
            warningSeverity === 'Red' ||
            warningSeverity === 'Orange' ||
            warningSeverity === 'Yellow'
              ? 'Risks Found'
              : warningSeverity === 'Gray'
              ? 'Pay Attention'
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
        <BottomSheetDialog
          ref={loadingDialogRef}
          height="fit-content"
          containerStyle={{ padding: 0, overflow: 'hidden' }}
        >
          <InterpretationDescritionDialog mode="loading" />
        </BottomSheetDialog>
      </PortalToRootNode>
      <PortalToRootNode>
        <BottomSheetDialog
          ref={errorDialogRef}
          height="fit-content"
          containerStyle={{ padding: 0, overflow: 'hidden' }}
        >
          <InterpretationDescritionDialog mode="error" />
        </BottomSheetDialog>
      </PortalToRootNode>
      <PortalToRootNode>
        <BottomSheetDialog
          ref={successDialogRef}
          height="fit-content"
          containerStyle={{ padding: 0, overflow: 'hidden' }}
        >
          <InterpretationDescritionDialog mode="success" />
        </BottomSheetDialog>
      </PortalToRootNode>
      <Content name="transaction-warning-section">
        {warnings?.length ? (
          <VStack gap={8}>
            {warnings.map((warning) => (
              <TransactionWarning
                key={warning.title}
                title={warning.title}
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
                    title={warning.description}
                  >
                    {warning.description}
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
            ))}
          </VStack>
        ) : mode === 'error' ? (
          <TransactionWarning message="We were unable to simulate the transaction or complete all security checks. Please proceed with caution. " />
        ) : null}
      </Content>
    </>
  );
}
