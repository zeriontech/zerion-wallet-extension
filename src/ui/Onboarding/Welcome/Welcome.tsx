import React, { useCallback, useState } from 'react';
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
// import { checkWhitelistStatus } from '../checkWhitelistStatus';
import * as styles from './styles.module.css';

class UnsupportedAddressError extends Error {}
class WaitlistCheckError extends Error {}

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

  const { mutate: checkAddress, isLoading } = useMutation(
    async (addressOrDomain: string) => {
      setError(null);
      const address = isEthereumAddress(addressOrDomain)
        ? addressOrDomain
        : await resolveDomain(addressOrDomain);
      if (!address) {
        throw new UnsupportedAddressError();
      }
      try {
        // const status = await checkWhitelistStatus(address);
        return { address, status: true };
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
        <UIText kind="headline/h1">
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
        <Spacer height={22} />
        <UIText
          kind="small/regular"
          color="var(--notice-500)"
          style={{
            maxHeight: error ? 20 : 0,
            transition: 'max-height 300ms',
          }}
        >
          {error ? ERRORS_DESCRIPTIOINS[error] : null}
        </UIText>
        <Spacer height={22} />
        <Button kind="primary" size={44} disabled={isLoading}>
          {isLoading ? 'Checking' : 'Check Eligibility'}
        </Button>
      </div>
    </form>
  );
}

function FAQButton({ text, onClick }: { text: string; onClick(): void }) {
  return (
    <UnstyledButton onClick={onClick}>
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
  return (
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
      <HStack gap={16} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <FAQButton text="Join the waitlist" onClick={() => null} />
        <FAQButton text="Earn an invite" onClick={() => null} />
      </HStack>
    </VStack>
  );
}

export function Welcome() {
  const [showFAQ, setShowFAQ] = useState(false);
  const navigate = useNavigate();

  const handleCheck = useCallback(
    ({ address, status }: { address: string; status: boolean }) => {
      if (!status) {
        setShowFAQ(true);
      } else {
        navigate(`/welcome/${address}`);
      }
    },
    [navigate]
  );

  return (
    <VStack gap={40}>
      <MainForm onCheck={handleCheck} onError={() => setShowFAQ(true)} />
      <EligibleFAQ show={showFAQ} />
    </VStack>
  );
}
