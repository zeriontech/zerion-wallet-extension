import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckDouble from 'jsx:src/ui/assets/check_double.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { Composition, WalletMedia } from 'src/ui/components/WalletMedia';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';

function pluralize(n: number) {
  return n > 1 ? 'wallets' : 'wallet';
}

export function ImportSuccess() {
  const [params] = useSearchParams();
  const addresses = params.getAll('address');
  const next = params.get('next');
  invariant(next, '"Next" param is required');
  invariant(
    addresses && addresses.length > 0,
    'address parameters are missing'
  );
  return (
    <PageColumn paddingInline={24}>
      <NavigationTitle
        urlBar="none"
        title={null}
        documentTitle="Import Success"
      />
      <PageTop />
      <VStack gap={24}>
        <CheckDouble
          style={{ width: 52, height: 52, color: 'var(--positive-500)' }}
        />
        <UIText kind="headline/hero">Connected Successfully!</UIText>
        <UIText kind="headline/h3">
          You've successfully added {addresses.length}{' '}
          {pluralize(addresses.length)}
        </UIText>
        <VStack
          gap={8}
          style={{
            ['--surface-background-color' as string]: 'var(--neutral-100)',
          }}
        >
          {addresses.map((address) => (
            <Surface padding={8}>
              <WalletMedia
                activeIndicator={false}
                key={address}
                wallet={{
                  address,
                  name: null,
                }}
                iconSize={32}
                composition={Composition.nameAndPortfolio}
              />
            </Surface>
          ))}
        </VStack>
        <Button kind="primary" as={UnstyledLink} to={next}>
          Done
        </Button>
      </VStack>
    </PageColumn>
  );
}
