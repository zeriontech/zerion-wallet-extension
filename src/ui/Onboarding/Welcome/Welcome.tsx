import React, { useCallback, useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router';
import { resolveDomain } from 'src/modules/name-service';
import { isEthereumAddress } from 'src/ui/shared/isEthereumAddress';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import { validateEmail } from 'src/ui/shared/validateEmail';
import {
  checkWhitelistStatus,
  getWaitlistStatus,
} from '../checkWhitelistStatus';
import { SidePanel } from '../Import/SidePanel';
import { useSizeStore } from '../useSizeStore';
import { Stack } from '../Stack';
import { UnsupportedAddressError, WaitlistCheckError } from '../errors';
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
  onCheck,
  onError,
}: {
  onCheck(params: { address: string; status: boolean }): void;
  onError?(e: WaitlistCheckError | UnsupportedAddressError): void;
}) {
  const [error, setError] = useState<FormErrorType | null>(null);
  const { isNarrowView } = useSizeStore();

  const { mutate: checkAddress, isLoading } = useMutation(
    async (addressOrDomain: string) => {
      setError(null);

      if (validateEmail(addressOrDomain)) {
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
      try {
        const { status } = await checkWhitelistStatus(address);
        return { address, status };
      } catch {
        throw new WaitlistCheckError();
      }
    },
    {
      onSuccess: ({ address, status }) => {
        if (!status) {
          setError('no-access');
        }
        onCheck({ address, status });
      },
      onError: (e: Error) => {
        setError(
          e instanceof UnsupportedAddressError
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
        const address = new FormData(event.currentTarget).get(
          'addressOrDomain'
        ) as string;
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
        <VStack gap={0}>
          <UIText kind="body/accent">Here will be instruction</UIText>
        </VStack>
      </SidePanel>
      <SidePanel
        show={showInvitePanel}
        onDismiss={() => setShowInvitePanel(false)}
      >
        <VStack gap={0}>
          <UIText kind="body/accent">Here will be instruction</UIText>
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
  const [address, setAddress] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCheck = useCallback(
    ({ address, status }: { address: string; status: boolean }) => {
      if (!status) {
        setShowFAQ(true);
      } else {
        setAddress(address);
      }
    },
    []
  );

  useEffect(() => {
    if (address) {
      navigate(`/onboarding/welcome/${address}`);
    }
  }, [address, navigate]);

  return (
    <VStack gap={40}>
      <MainForm onCheck={handleCheck} onError={() => setShowFAQ(true)} />
      <EligibleFAQ show={showFAQ} />
    </VStack>
  );
}
