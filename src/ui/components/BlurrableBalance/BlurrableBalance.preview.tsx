import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { registerPreviewPermanent } from 'src/ui-lab/previews/registerPreview';
import { BlurrableBalance } from './BlurrableBalance';

registerPreviewPermanent({
  name: 'BlurrableBalance',
  component: () => (
    <VStack gap={48}>
      <VStack gap={24}>
        <UIText kind="headline/h2">Headline Sizes</UIText>
        <VStack gap={16}>
          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              headline/hero:
            </UIText>
            <BlurrableBalance kind="headline/hero">
              <UIText kind="headline/hero">$123,456.78</UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              headline/h1:
            </UIText>
            <BlurrableBalance kind="headline/h1">
              <UIText kind="headline/h1">$12,345.67</UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              headline/h2:
            </UIText>
            <BlurrableBalance kind="headline/h2">
              <UIText kind="headline/h2">$1,234.56</UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              headline/h3:
            </UIText>
            <BlurrableBalance kind="headline/h3">
              <UIText kind="headline/h3">$123.45</UIText>
            </BlurrableBalance>
          </HStack>
        </VStack>
      </VStack>

      <VStack gap={24}>
        <UIText kind="headline/h2">Body & Small Sizes</UIText>
        <VStack gap={16}>
          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              body/accent:
            </UIText>
            <BlurrableBalance kind="body/accent">
              <UIText kind="body/accent">$1,234.56</UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              body/regular:
            </UIText>
            <BlurrableBalance kind="body/regular">
              <UIText kind="body/regular">$1,234.56</UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              small/accent:
            </UIText>
            <BlurrableBalance kind="small/accent">
              <UIText kind="small/accent">$123.45</UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              small/regular:
            </UIText>
            <BlurrableBalance kind="small/regular">
              <UIText kind="small/regular">$123.45</UIText>
            </BlurrableBalance>
          </HStack>
        </VStack>
      </VStack>

      <VStack gap={24}>
        <UIText kind="headline/h2">Caption Sizes</UIText>
        <VStack gap={16}>
          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              caption/accent:
            </UIText>
            <BlurrableBalance kind="caption/accent">
              <UIText kind="caption/accent">$12.34</UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              caption/regular:
            </UIText>
            <BlurrableBalance kind="caption/regular">
              <UIText kind="caption/regular">$12.34</UIText>
            </BlurrableBalance>
          </HStack>
        </VStack>
      </VStack>

      <VStack gap={24}>
        <UIText kind="headline/h2">Colored Balances</UIText>
        <VStack gap={16}>
          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              Green (positive):
            </UIText>
            <BlurrableBalance kind="body/accent" color="var(--positive-500)">
              <UIText kind="body/accent" color="var(--positive-500)">
                +$1,234.56
              </UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              Red (negative):
            </UIText>
            <BlurrableBalance kind="body/accent" color="var(--negative-500)">
              <UIText kind="body/accent" color="var(--negative-500)">
                -$1,234.56
              </UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              Primary color:
            </UIText>
            <BlurrableBalance kind="body/accent" color="var(--primary)">
              <UIText kind="body/accent" color="var(--primary)">
                $1,234.56
              </UIText>
            </BlurrableBalance>
          </HStack>

          <HStack gap={16} alignItems="center">
            <UIText kind="body/regular" style={{ minWidth: '150px' }}>
              Neutral (default):
            </UIText>
            <BlurrableBalance kind="body/accent" color="var(--neutral-500)">
              <UIText kind="body/accent" color="var(--neutral-500)">
                $1,234.56
              </UIText>
            </BlurrableBalance>
          </HStack>
        </VStack>
      </VStack>

      <VStack gap={24}>
        <UIText kind="headline/h2">Usage Instructions</UIText>
        <VStack gap={8}>
          <UIText kind="body/regular">
            Toggle the "Hide Balances" setting in Settings → Privacy to see the
            blur effect.
          </UIText>
          <UIText kind="body/regular">
            Or use keyboard shortcuts: Shift+H, Cmd+H (Mac), or Ctrl+H
            (Windows/Linux)
          </UIText>
        </VStack>
      </VStack>
    </VStack>
  ),
});
