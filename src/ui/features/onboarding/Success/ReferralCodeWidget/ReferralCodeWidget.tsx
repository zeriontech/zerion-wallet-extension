import React, { useState } from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import GiftIcon from 'jsx:src/ui/assets/gift.svg';
import ClearSolidIcon from 'jsx:src/ui/assets/clear-solid.svg';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { collectData } from 'src/ui/shared/form-data';
import { useMutation } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { Input } from 'src/ui/ui-kit/Input';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import type { ReferrerData } from 'src/modules/zerion-api/requests/check-referral';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as styles from './styles.module.css';

function EnterReferralCodeButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <Spacer height={70} />
      <VStack gap={8} style={{ justifyContent: 'center' }}>
        <Button
          kind="regular"
          style={{
            padding: '10px 16px',
            ['--button-background' as string]: 'var(--always-white)',
            ['--button-background-hover' as string]: '#f0f0f2',
          }}
          onClick={onClick}
        >
          <HStack gap={8}>
            <GiftIcon />
            <UIText kind="body/accent" className={styles.gradientText}>
              Enter Referral Code
            </UIText>
          </HStack>
        </Button>
        <UIText
          kind="small/regular"
          color="var(--always-white)"
          style={{ opacity: 0.5 }}
        >
          if you have one
        </UIText>
      </VStack>
    </>
  );
}

function ReferralCodeForm({
  onSuccess,
}: {
  onSuccess: (pendingReferrer: ReferrerData) => void;
}) {
  const [referralCode, setReferralCode] = useState('');

  const { mutate: applyReferralCode, ...applyReferralCodeMutation } =
    useMutation({
      mutationFn: ({
        referralCode: rawReferralCode,
      }: {
        referralCode: string;
      }) => {
        return walletPort.request('uiApplyReferralCodeToAllWallets', {
          referralCode: rawReferralCode.trim(),
        });
      },
      onSuccess,
    });

  return (
    <>
      <Spacer height={28} />
      <VStack gap={16} className={styles.referralCodeForm}>
        <UIText
          kind="body/accent"
          color="var(--always-white)"
          style={{ textAlign: 'left' }}
        >
          Referral Code
        </UIText>
        <form
          onSubmit={(event) => {
            event.preventDefault();

            const form = event.currentTarget;
            if (!form.checkValidity()) {
              return;
            }
            const formData = collectData(form, {});
            const referralCode = formData.referralCode as string;

            applyReferralCode({ referralCode });
          }}
        >
          <VStack gap={4}>
            <HStack gap={8} alignItems="center">
              <ZStack>
                <Input
                  className={styles.referralCodeInput}
                  name="referralCode"
                  autoFocus={true}
                  boxHeight={40}
                  placeholder="Enter code"
                  required={true}
                  value={referralCode}
                  onChange={(event) => setReferralCode(event.target.value)}
                  disabled={applyReferralCodeMutation.isLoading}
                />
                {referralCode.length > 0 ? (
                  <UnstyledButton
                    type="button"
                    title="clear"
                    style={{
                      cursor: 'pointer',
                      alignSelf: 'center',
                      justifySelf: 'end',
                      width: 20,
                      height: 20,
                      marginRight: 12,
                    }}
                    onClick={() => setReferralCode('')}
                  >
                    <ClearSolidIcon
                      style={{
                        width: 20,
                        height: 20,
                        color: 'var(--neutral-500)',
                      }}
                    />
                  </UnstyledButton>
                ) : null}
              </ZStack>
              <Button
                kind="regular"
                style={{
                  padding: 8,
                  height: 40,
                  borderRadius: 8,
                  ['--button-background' as string]: 'var(--always-white)',
                  ['--button-background-hover' as string]: '#f0f0f2',
                }}
                disabled={applyReferralCodeMutation.isLoading}
              >
                <CheckIcon
                  style={{
                    color: 'var(--primary)',
                    width: 24,
                    height: 24,
                  }}
                />
              </Button>
            </HStack>
            {applyReferralCodeMutation.isError ? (
              <UIText
                kind="caption/regular"
                color="var(--negative-500)"
                style={{ textAlign: 'left' }}
              >
                Invalid Referral Code
              </UIText>
            ) : null}
          </VStack>
        </form>
      </VStack>
    </>
  );
}

export function ReferralCodeWidget({
  onSuccess,
}: {
  onSuccess: (pendingReferrer: ReferrerData) => void;
}) {
  const [formRevealed, setFormRevealed] = useState(false);

  return formRevealed ? (
    <ReferralCodeForm onSuccess={onSuccess} />
  ) : (
    <EnterReferralCodeButton onClick={() => setFormRevealed(true)} />
  );
}
