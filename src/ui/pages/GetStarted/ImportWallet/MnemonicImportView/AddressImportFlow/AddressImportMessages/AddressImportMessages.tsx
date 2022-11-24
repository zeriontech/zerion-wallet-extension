import { animated } from 'react-spring';
import { isTruthy } from 'is-truthy-ts';
import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckmarkCheckedIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletIcon } from 'src/ui/ui-kit/WalletIcon';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { BareWallet } from 'src/shared/types/BareWallet';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { DecorativeMessage } from 'src/ui/pages/GetStarted/components/DecorativeMessage';
import { WithConfetti } from 'src/ui/pages/GetStarted/components/DecorativeMessage/DecorativeMessage';
import { getError } from 'src/shared/errors/getError';
import { ErrorBoundary } from 'src/ui/components/ErrorBoundary';
import { FillView } from 'src/ui/components/FillView';
import { ViewError } from 'src/ui/components/ViewError';

export function OnMount({
  children,
  onMount,
}: React.PropsWithChildren<{ onMount: () => void }>) {
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;
  useEffect(() => {
    onMountRef.current();
  }, []);
  return children as JSX.Element;
}

function AddressImportMessagesView({ values }: { values: BareWallet[] }) {
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState(() => new Set<React.ReactNode>());
  const navigate = useNavigate();
  const addMessage = (message: React.ReactNode) =>
    setMessages((messages) => new Set(messages).add(message));

  const finalizeMutation = useMutation(
    async (mnemonics: NonNullable<BareWallet['mnemonic']>[]) => {
      await new Promise((r) => setTimeout(r, 1000));
      const data = await walletPort.request('uiImportSeedPhrase', mnemonics);
      await accountPublicRPCPort.request('saveUserAndWallet');
      if (data?.address) {
        await walletPort.request('setCurrentAddress', {
          address: data.address,
        });
      }
    },
    {
      useErrorBoundary: true,
      onSuccess() {
        navigate('/overview');
      },
    }
  );
  useEffect(() => {
    const ids: NodeJS.Timeout[] = [];
    const msg = (msg: React.ReactNode, delay: number) =>
      setTimeout(() => addMessage(msg), delay);
    ids.push(
      msg(
        <DecorativeMessage
          key={0}
          text={
            <UIText kind="subtitle/m_reg">
              ⏳ Checking your wallet history on the blockchain...
            </UIText>
          }
        />,
        100
      ),
      msg(
        <DecorativeMessage
          key={1}
          isConsecutive={true}
          text={
            <UIText kind="subtitle/m_reg">
              🔐 Encrypting your wallet with your password...
            </UIText>
          }
        />,
        1200
      ),
      msg(
        <DecorativeMessage
          key={2}
          isConsecutive={false}
          text={
            <UIText kind="headline/h3">
              All done!{' '}
              <span style={{ color: 'var(--primary)' }}>
                Your wallets have been imported 🚀
              </span>
            </UIText>
          }
        />,
        2400
      ),
      msg(
        <OnMount key={3} onMount={() => setReady(true)}>
          <WithConfetti>
            <DecorativeMessage
              isConsecutive={true}
              text={
                <VStack gap={8}>
                  <UIText kind="headline/h3">
                    <CheckmarkCheckedIcon
                      style={{
                        color: 'var(--positive-500)',
                        verticalAlign: 'middle',
                      }}
                    />{' '}
                    <span style={{ verticalAlign: 'middle' }}>Congrats!</span>
                  </UIText>
                  <UIText kind="small/regular">Welcome on board</UIText>
                  {values.map((wallet) => (
                    <Media
                      key={wallet.address}
                      image={
                        <WalletIcon
                          address={wallet.address}
                          active={false}
                          iconSize={32}
                        />
                      }
                      text={
                        <UIText kind="body/regular">
                          <WalletDisplayName wallet={wallet} padding={8} />
                        </UIText>
                      }
                      detailText={null}
                    />
                  ))}
                </VStack>
              }
            />
          </WithConfetti>
        </OnMount>,
        3200
      )
    );
    return () => {
      ids.forEach((id) => clearTimeout(id));
    };
  }, [values]);
  const { style, trigger } = useTransformTrigger({
    scale: 1.1,
    timing: 100,
  });
  useEffect(() => {
    if (ready) {
      trigger();
    }
  }, [ready, trigger]);
  const autoFocusRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (ready) {
      autoFocusRef.current?.focus();
    }
  }, [ready]);
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={8} style={{ paddingBottom: 24 }}>
        {messages}
      </VStack>

      <VStack gap={4} style={{ marginTop: 'auto', marginBottom: 16 }}>
        {finalizeMutation.isError ? (
          <UIText
            style={{ textAlign: 'center', wordBreak: 'break-all' }}
            kind="caption/reg"
            color="var(--negative-500)"
          >
            {getError(finalizeMutation.error).message}
          </UIText>
        ) : null}
        <Button
          as={animated.button}
          ref={autoFocusRef}
          disabled={!ready || finalizeMutation.isLoading}
          style={style}
          onClick={() => {
            const mnemonics = values
              .map((wallet) => wallet.mnemonic)
              .filter(isTruthy);
            finalizeMutation.mutate(mnemonics);
          }}
        >
          {finalizeMutation.isLoading ? 'Submitting' : 'Finish'}
        </Button>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

export function AddressImportMessages({ values }: { values: BareWallet[] }) {
  return (
    <ErrorBoundary
      renderError={(error) => {
        if (error?.code === 2312103) {
          return (
            <FillView>
              <ViewError
                title="Session Expired"
                error={new Error('You will need to enter your password again')}
              />
            </FillView>
          );
        } else {
          throw error;
        }
      }}
    >
      <AddressImportMessagesView values={values} />
    </ErrorBoundary>
  );
}
