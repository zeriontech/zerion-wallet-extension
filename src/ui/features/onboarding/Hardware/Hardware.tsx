import React, { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { RenderArea } from 'react-area';
import {
  FrameLayout,
  HardwareWalletConnectionStart,
} from 'src/ui/pages/HardwareWalletConnection/HardwareWalletConnection';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { LedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { Stack } from 'src/ui/ui-kit/Stack';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import { assertPasswordStep } from '../Password/passwordSearchParams';
import { Password } from '../Password';
import * as styles from '../shared/helperStyles.module.css';
import { useOnboardingSession } from '../shared/useOnboardingSession';
import { PageLayout } from '../shared/PageLayout';
import { ViewParam, assertViewParam } from './hardwareSearchParams';

export function Hardware() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { isNarrowView } = useWindowSizeStore();
  const [params, setSearchParams] = useSearchParams();
  const [ledgerParams, setLedgerParams] = useState<LedgerAccountImport | null>(
    null
  );
  const view = params.get('view') || 'hardware';
  const step = params.get('step') || 'create';
  assertViewParam(view);
  assertPasswordStep(step);

  const { mutate: createUserAndWallet, isLoading } = useMutation({
    mutationFn: async ({
      password,
      ledgerParams,
    }: {
      password: string | null;
      ledgerParams: LedgerAccountImport;
    }) => {
      await new Promise((r) => setTimeout(r, 1000));
      if (password) {
        await accountPublicRPCPort.request('createUser', {
          password,
        });
      }
      const data = await walletPort.request(
        'uiImportHardwareWallet',
        ledgerParams
      );
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: data.address });
    },
    onSuccess: () => {
      zeroizeAfterSubmission();
      navigate('/onboarding/success');
    },
    onError: (e) => {
      if (isSessionExpiredError(e)) {
        navigate('/onboarding/session-expired', { replace: true });
      }
    },
    useErrorBoundary: true,
  });

  const handleImport = useCallback(
    (params: LedgerAccountImport) => {
      setLedgerParams(params);
      setSearchParams(`view=${ViewParam.password}`);
    },
    [setSearchParams]
  );

  const handlePasswordSubmit = useCallback(
    (password: string | null) => {
      if (!ledgerParams) {
        throw new Error('Ledger configuration is missing');
      }
      createUserAndWallet({ password, ledgerParams });
    },
    [ledgerParams, createUserAndWallet]
  );

  const { sessionDataIsLoading } = useOnboardingSession('session-expired');

  if (sessionDataIsLoading) {
    return null;
  }

  return view === ViewParam.hardware ? (
    <PageLayout hardwareImportStyle={true}>
      <FrameLayout>
        <HardwareWalletConnectionStart onImport={handleImport} />
      </FrameLayout>
    </PageLayout>
  ) : (
    <PageLayout>
      <VStack gap={isNarrowView ? 16 : 56}>
        <div className={styles.container}>
          {isLoading ? (
            <div className={styles.loadingOverlay}>
              <UIText kind="headline/hero" className={styles.loadingTitle}>
                Importing Ledger
              </UIText>
            </div>
          ) : null}
          <UnstyledButton
            onClick={goBack}
            aria-label="Go Back"
            className={styles.backButton}
          >
            <ArrowLeftIcon style={{ width: 20, height: 20 }} />
          </UnstyledButton>
          <Stack
            gap={isNarrowView ? 0 : 60}
            direction={isNarrowView ? 'vertical' : 'horizontal'}
            style={{
              gridTemplateColumns: isNarrowView ? undefined : '380px auto',
              justifyContent: 'center',
            }}
          >
            <Password
              title="Finally, create your password"
              step={step}
              onSubmit={handlePasswordSubmit}
            />
            {isNarrowView ? null : <RenderArea name="onboarding-faq" />}
          </Stack>
        </div>
        {isNarrowView ? (
          <div className={styles.faqContainer}>
            <RenderArea name="onboarding-faq" />
          </div>
        ) : null}
        <PrivacyFooter />
      </VStack>
    </PageLayout>
  );
}
