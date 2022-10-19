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

export function AddressImportMessages({ values }: { values: BareWallet[] }) {
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState(() => new Set<React.ReactNode>());
  const navigate = useNavigate();
  const addMessage = (message: React.ReactNode) =>
    setMessages((messages) => new Set(messages).add(message));

  const importMutation = useMutation(
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
        <OnMount onMount={() => setReady(true)}>
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
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={8} style={{ paddingBottom: 24 }}>
        {messages}
      </VStack>

      <Button
        as={animated.button}
        disabled={!ready || importMutation.isLoading}
        style={{ ...style, marginTop: 'auto', marginBottom: 16 }}
        onClick={() => {
          const mnemonics = values
            .map((wallet) => wallet.mnemonic)
            .filter(isTruthy);
          importMutation.mutate(mnemonics);
        }}
      >
        {importMutation.isLoading ? 'Submitting' : 'Finish'}
      </Button>
      <PageBottom />
    </PageColumn>
  );
}
