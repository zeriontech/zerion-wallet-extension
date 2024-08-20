import React from 'react';
import { FillView } from 'src/ui/components/FillView';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import noResultsImg from 'src/ui/assets/no-results@2x.png';

export function EmptyView({
  emoji = '🥺',
  children,
}: {
  emoji?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <FillView>
      <VStack gap={6} style={{ textAlign: 'center' }}>
        <UIText kind="headline/hero">{emoji}</UIText>
        <UIText kind="small/accent" color="var(--neutral-500)">
          {children}
        </UIText>
      </VStack>
    </FillView>
  );
}

export function EmptyView2(
  props:
    | {
        children: React.ReactNode;
      }
    | {
        title: React.ReactNode;
        message: React.ReactNode;
      }
) {
  return (
    <FillView>
      <VStack gap={16} style={{ textAlign: 'center' }}>
        <img
          src={noResultsImg}
          style={{ height: 64, placeSelf: 'center' }}
          alt=""
        />
        {'children' in props ? (
          props.children
        ) : (
          <VStack gap={8}>
            <UIText kind="headline/h3">{props.title}</UIText>
            <UIText kind="small/regular" color="var(--neutral-500)">
              {props.message}
            </UIText>
          </VStack>
        )}
      </VStack>
    </FillView>
  );
}
