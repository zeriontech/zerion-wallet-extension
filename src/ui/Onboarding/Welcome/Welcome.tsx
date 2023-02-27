import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { resolveDomain } from 'src/modules/name-service';
import { isEthereumAddress } from 'src/ui/shared/isEthereumAddress';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

class UnsupportedAddressError extends Error {}

function MainForm({
  onSuccess,
  onReject,
}: {
  onReject(): void;
  onSuccess?(address: string): void;
}) {
  const { mutate: checkAddress, isLoading } = useMutation(
    async (addressOrDomain: string) => {
      const address = isEthereumAddress(addressOrDomain)
        ? addressOrDomain
        : await resolveDomain(addressOrDomain);
      console.log(address);
      if (!address) {
        throw new UnsupportedAddressError();
      }
      return address;
    },
    {
      onError: onReject,
      onSuccess,
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
      <VStack gap={0} style={{ alignContent: 'center', maxWidth: 516 }}>
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
        <Spacer height={40} />
        <Button kind="primary" size={44} disabled={isLoading}>
          Check Eligibility
        </Button>
      </VStack>
    </form>
  );
}

function EligibleFAQ() {
  return <div />;
}

export function Welcome() {
  const [showFAQ, setShowFAQ] = useState(false);

  return (
    <VStack gap={40}>
      <MainForm onReject={() => setShowFAQ(true)} />
      {showFAQ ? <EligibleFAQ /> : null}
    </VStack>
  );
}
