import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router';
import { resolveDomain } from 'src/modules/name-service';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import { isEmail } from 'src/shared/isEmail';
import {
  checkWhitelistStatus,
  getWaitlistStatus,
} from '../checkWhitelistStatus';
import { SidePanel } from '../Import/SidePanel';
import { useSizeStore } from '../useSizeStore';
import { Stack } from '../Stack';
import {
  NotAllowedError,
  UnsupportedAddressError,
  WaitlistCheckError,
} from '../errors';
import walletIconSrc from '../assets/wallet2.png';
import * as styles from './styles.module.css';

type FormErrorType =
  | 'unsupported-address'
  | 'waitlist-not-found'
  | 'no-access'
  | 'unknown';

const ERRORS_DESCRIPTIOINS: Record<FormErrorType, string> = {
  'unsupported-address':
    'Sorry! We can’t parse your address. Please, check if it is correct',
  'no-access':
    'Sorry! You’re not eligible yet. But you have two options to get involved.',
  'waitlist-not-found':
    'Sorry! We can’t find you in the waitlist. Please, join it via link below.',
  unknown: 'Something went wrong. Please, try again.',
};

function MainForm({
  onSuccess,
  onError,
}: {
  onSuccess(params: { address: string }): void;
  onError?(e: WaitlistCheckError | UnsupportedAddressError): void;
}) {
  const [error, setError] = useState<FormErrorType | null>(null);
  const { isNarrowView } = useSizeStore();

  const { mutate: checkAddress, isLoading } = useMutation(
    async (addressOrDomain: string) => {
      setError(null);

      if (isEmail(addressOrDomain)) {
        try {
          const { status, address } = await getWaitlistStatus(addressOrDomain);
          return { address, status };
        } catch {
          throw new WaitlistCheckError();
        }
      }

      const address = isEthereumAddress(addressOrDomain)
        ? addressOrDomain
        : await resolveDomain(addressOrDomain);
      if (!address) {
        throw new UnsupportedAddressError();
      }
      const { status } = await checkWhitelistStatus(address);
      return { address, status };
    },
    {
      onSuccess,
      onError: (e: Error) => {
        setError(
          e instanceof NotAllowedError
            ? 'no-access'
            : e instanceof UnsupportedAddressError
            ? 'unsupported-address'
            : e instanceof WaitlistCheckError
            ? 'waitlist-not-found'
            : 'unknown'
        );
        onError?.(e);
      },
    }
  );

  return (
    <form
      className={styles.container}
      onSubmit={(event) => {
        event.preventDefault();
        const address = (
          new FormData(event.currentTarget).get('addressOrDomain') as string
        ).trim();
        checkAddress(address);
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 516,
        }}
      >
        <UIText kind={isNarrowView ? 'headline/h2' : 'headline/h1'}>
          Zerion Extension Mode:
          <br />
          Activated
        </UIText>
        <Spacer height={24} />
        <UIText kind="body/accent" style={{ opacity: 0.8 }}>
          We are slowly opening up access. See if you’re on the list.
        </UIText>
        <Spacer height={24} />
        <input
          name="addressOrDomain"
          className={styles.input}
          placeholder="Enter your address or domain"
          required={true}
          autoComplete="off"
          autoFocus={true}
        />
        <Spacer height={isNarrowView ? 4 : 22} />
        <UIText
          kind={isNarrowView ? 'caption/regular' : 'small/regular'}
          color="var(--notice-500)"
          style={{
            maxHeight: error ? 20 : 0,
            transition: 'max-height 300ms',
            textAlign: isNarrowView ? 'left' : undefined,
          }}
        >
          {error ? ERRORS_DESCRIPTIOINS[error] : null}
        </UIText>
        <Spacer height={22} />
        <Button
          kind="primary"
          size={44}
          disabled={isLoading}
          style={{ width: isNarrowView ? '100%' : undefined }}
        >
          {isLoading ? 'Checking' : 'Check Eligibility'}
        </Button>
      </div>
    </form>
  );
}

function FAQButton({
  text,
  onClick,
  disabled,
}: {
  text: string;
  onClick(): void;
  disabled?: boolean;
}) {
  return (
    <UnstyledButton onClick={onClick} disabled={disabled}>
      <HStack
        gap={24}
        justifyContent="space-between"
        alignItems="center"
        className={styles.faqButton}
      >
        <UIText kind="headline/h3" color="var(--always-white)">
          {text}
        </UIText>
        <div className={styles.arrow}>
          <ArrowRightIcon
            style={{ width: 20, height: 20, color: 'var(--always-white)' }}
          />
        </div>
      </HStack>
    </UnstyledButton>
  );
}

function EligibleFAQ({ show }: { show: boolean }) {
  const { isNarrowView } = useSizeStore();
  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  return (
    <>
      <SidePanel show={showJoinPanel} onDismiss={() => setShowJoinPanel(false)}>
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img
              src={walletIconSrc}
              style={{ width: 20, height: 20, borderRadius: 10 }}
            />
          </div>
          <VStack gap={8}>
            <UIText kind="body/accent">How to join the waitlist?</UIText>
            <UIText kind="body/regular">
              One way to get access to our extension is to join our waitlist.
              We’ll be onboarding users in the coming weeks, and you’ll get an
              email when your spot is open.
            </UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <SidePanel
        show={showInvitePanel}
        onDismiss={() => setShowInvitePanel(false)}
      >
        <VStack gap={20}>
          <div className={styles.faqIcon}>
            <img
              src={walletIconSrc}
              style={{ width: 20, height: 20, borderRadius: 10 }}
            />
          </div>
          <VStack gap={8}>
            <UIText kind="body/accent">How to get your place?</UIText>
            <UIText kind="body/regular">
              We’re partnering with many leading communities in web3 to open up
              places in our closed beta for the extension. We’re also dropping
              access to limited numbers of people via our social channels.
              (Especially Lens). Watch this space to grab your spot!
            </UIText>
          </VStack>
        </VStack>
      </SidePanel>
      <VStack
        gap={20}
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
          width: '100%',
        }}
      >
        <UIText kind="headline/h2">How can I become eligible?</UIText>
        <Stack
          gap={16}
          direction={isNarrowView ? 'vertical' : 'horizontal'}
          style={{ gridTemplateColumns: isNarrowView ? undefined : '1fr 1fr' }}
        >
          <FAQButton
            text="Join the waitlist"
            disabled={!show}
            onClick={() => setShowJoinPanel(true)}
          />
          <FAQButton
            text="Earn an invite"
            disabled={!show}
            onClick={() => setShowInvitePanel(true)}
          />
        </Stack>
      </VStack>
    </>
  );
}

export function Welcome() {
  const [showFAQ, setShowFAQ] = useState(false);
  const navigate = useNavigate();

  return (
    <VStack gap={40}>
      <MainForm
        onSuccess={({ address }) => navigate(`/onboarding/welcome/${address}`)}
        onError={() => setShowFAQ(true)}
      />
      <EligibleFAQ show={showFAQ} />
    </VStack>
  );
}
