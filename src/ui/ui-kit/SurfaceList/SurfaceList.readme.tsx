import { capitalize } from 'capitalize-ts';
import React from 'react';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from '../HStack';
import { Radio } from '../Radio';
import { UIText } from '../UIText';
import { VStack } from '../VStack';
import { SurfaceList } from './SurfaceList';

export const readme: Readme = {
  id: 'surfaceList',
  name: 'SurfaceList',
  description: null,
  component: () => (
    <WindowSize
      style={{
        // @ts-ignore --background
        '--background': 'var(--neutral-100)',
        backgroundColor: 'var(--background)',
      }}
    >
      <PageColumn>
        <PageTop />
        <VStack gap={24}>
          <VStack gap={8}>
            <UIText kind="body/regular">Basic List</UIText>
            <SurfaceList
              items={['apple', 'mango', 'cherry'].map((fruit, index) => ({
                key: index,
                component: <UIText kind="body/regular">{fruit}</UIText>,
              }))}
            />
          </VStack>
          <VStack gap={8}>
            <UIText kind="body/regular">Interactive</UIText>
            <SurfaceList
              items={['apple', 'mango', 'cherry'].map((fruit, index) => ({
                key: index,
                onClick: () => {}, //eslint-disable-line @typescript-eslint/no-empty-function
                component: <UIText kind="body/regular">{fruit}</UIText>,
              }))}
            />
          </VStack>
          <VStack gap={8}>
            <UIText kind="body/regular">Radio group</UIText>
            <SurfaceList
              items={['apple', 'mango', 'cherry'].map((fruit, index) => ({
                key: index,
                onClick: () => {}, //eslint-disable-line @typescript-eslint/no-empty-function
                component: (
                  <UIText as="label" kind="body/regular" color="var(--primary)">
                    <HStack gap={8} alignItems="center">
                      <Radio name="fruit" value={fruit} />
                      <span>{capitalize(fruit)}</span>
                    </HStack>
                  </UIText>
                ),
              }))}
            />
          </VStack>
        </VStack>
        <PageBottom />
      </PageColumn>
    </WindowSize>
  ),
};
