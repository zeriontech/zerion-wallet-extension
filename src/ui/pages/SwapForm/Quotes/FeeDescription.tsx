import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import ShieldIcon from 'jsx:src/ui/assets/shield.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { Frame } from 'src/ui/ui-kit/Frame';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import { DialogButtonValue } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import * as styles from './styles.module.css';
import type { FeeTier } from './FeeTier';

export function FeeDescription({
  userFeeTier,
  fee,
}: {
  userFeeTier: FeeTier;
  fee: number;
}) {
  const { data, isLoading } = useFirebaseConfig(['fee_comparison_config'], {
    enabled: userFeeTier === 'premium',
  });

  return (
    <>
      <VStack gap={16}>
        <HStack gap={8} alignItems="center">
          <ShieldIcon style={{ color: 'var(--positive-500)' }} />
          <UIText kind="headline/h3">Best Available Rate</UIText>
        </HStack>
        <VStack gap={24}>
          {userFeeTier === 'og' ? (
            <UIText kind="body/regular">
              We compare multiple sources and give you the best deal available.
            </UIText>
          ) : null}
          {userFeeTier === 'regular' ? (
            <UIText kind="body/regular">
              We compare multiple sources and give you the best deal available.
              <br />
              <br />
              Our platform fee ({formatPercent(fee, 'en')}%) is already included
              — keeping your swaps fast, safe, and secure.
            </UIText>
          ) : null}
          {userFeeTier === 'premium' ? (
            <VStack gap={16}>
              <UIText kind="body/regular">
                We compare multiple sources and give you the best deal
                available.
                <br />
                <br />
                Our platform fee is already included — keeping your swaps fast,
                safe, and secure.
              </UIText>
              <Frame style={{ padding: 10 }}>
                {isLoading ? (
                  <UIText kind="body/accent">Gathering data...</UIText>
                ) : (
                  <VStack gap={8}>
                    {data?.fee_comparison_config.map((item) => (
                      <HStack
                        key={item.title}
                        gap={8}
                        style={{ padding: 6 }}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <HStack gap={8} alignItems="center">
                          <img
                            src={item.imgSrc}
                            alt={item.title}
                            style={{ width: 20, height: 20 }}
                          />
                          <UIText kind="small/regular">{item.title}</UIText>
                        </HStack>
                        <UIText
                          kind="small/accent"
                          className={
                            item.title.includes('Zerion')
                              ? styles.gradientText
                              : null
                          }
                        >
                          {formatPercent(item.fee, 'en')}%
                        </UIText>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Frame>
            </VStack>
          ) : null}
          <form method="dialog" onSubmit={(event) => event.stopPropagation()}>
            <Button
              value={DialogButtonValue.cancel}
              kind="primary"
              style={{ width: '100%' }}
              size={44}
            >
              Great
            </Button>
          </form>
        </VStack>
      </VStack>
      <DialogCloseButton style={{ position: 'absolute', top: 8, right: 8 }} />
    </>
  );
}
