import { useStore } from '@store-unit/react';
import React from 'react';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { hideBalancesStore } from 'src/ui/features/hide-balances/store';
import { Frame } from 'src/ui/ui-kit/Frame';
import { FrameListItemButton } from 'src/ui/ui-kit/FrameList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { HideBalance } from 'src/ui/components/HideBalance';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { Spacer } from 'src/ui/ui-kit/Spacer';

function TotalValue() {
  const { currency } = useCurrency();
  const { params, ready } = useAddressParams();
  const { data } = useWalletPortfolio(
    { addresses: [params.address], currency },
    { source: useHttpClientSource() },
    { enabled: ready, refetchInterval: 40000 }
  );
  const walletPortfolio = data?.data;
  if (walletPortfolio?.totalValue == null) {
    return null;
  }
  return (
    <HideBalance
      value={walletPortfolio.totalValue}
      kind="NeutralDecimals"
      locale="en"
      currency={currency}
    >
      <NeutralDecimals
        parts={formatCurrencyToParts(
          walletPortfolio.totalValue,
          'en',
          currency
        )}
      />
    </HideBalance>
  );
}

const sections = [
  {
    title: 'Default',
    mode: hideBalancesStore.MODE.default,
  },
  {
    title: 'Poor Mode',
    sections: [
      {
        title: 'Default Poor',
        mode: hideBalancesStore.MODE.poorMode1,
      },
      {
        title: 'x10 Poor',
        mode: hideBalancesStore.MODE.poorMode2,
      },
      {
        title: 'x100 Poor',
        mode: hideBalancesStore.MODE.poorMode3,
      },
    ],
  },
  {
    title: 'Blurred',
    mode: hideBalancesStore.MODE.blurred,
  },
];

function Row({
  text,
  checked,
  onClick,
  nested,
}: {
  text: string;
  checked: boolean;
  onClick: null | (() => void);
  nested: boolean;
}) {
  const content = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <UIText kind="body/accent">{text}</UIText>
      {checked ? (
        <CheckIcon
          style={{
            color: 'var(--primary)',
            width: 24,
            height: 24,
          }}
        />
      ) : null}
    </div>
  );
  if (onClick) {
    return (
      <FrameListItemButton
        style={{ paddingBlock: nested ? 8 : 12 }}
        onClick={onClick}
      >
        {content}
      </FrameListItemButton>
    );
  } else {
    return <div style={{ padding: 12 }}>{content}</div>;
  }
}

export function HideBalancesPage() {
  useBackgroundKind({ kind: 'white' });
  const { mode: currentMode } = useStore(hideBalancesStore);
  // const goBack = useGoBack();

  return (
    <PageColumn>
      <NavigationTitle title="Hide Balances" />
      <PageTop />

      <Frame>
        <VStack gap={0}>
          {sections.map((section) => {
            return (
              <VStack gap={0}>
                <Row
                  text={section.title}
                  checked={section.mode === currentMode}
                  nested={false}
                  onClick={
                    section.mode != null
                      ? () => hideBalancesStore.setMode(section.mode)
                      : null
                  }
                />
                {section.sections?.map((subSection) => (
                  <VStack gap={0} style={{ paddingInlineStart: '1.5em' }}>
                    <Row
                      text={subSection.title}
                      checked={subSection.mode === currentMode}
                      nested={true}
                      onClick={() => hideBalancesStore.setMode(subSection.mode)}
                    />
                  </VStack>
                ))}
              </VStack>
            );
          })}
        </VStack>
      </Frame>
      <Spacer height={20} />
      <HStack gap={8} justifyContent="space-between">
        <span>Example</span>
        <UIText kind="headline/h3">
          <TotalValue />
        </UIText>
      </HStack>
    </PageColumn>
  );
}
