import { capitalize } from 'capitalize-ts';
import React, { useState } from 'react';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from '../HStack';
import { Input } from '../Input';
import { SurfaceList } from '../SurfaceList';
import { ItemLabel } from '../SurfaceList/SurfaceList';
import { UIText } from '../UIText';
import { VStack } from '../VStack';
import { Radio } from './Radio';

function RadioGroupExample() {
  const [selected, setSelected] = useState('');
  return (
    <VStack gap={8}>
      <UIText kind="body/regular">Radio group</UIText>
      <Input placeholder="focusable element to test tab navigation" />
      <SurfaceList
        items={['apple', 'mango', 'cherry'].map((fruit, index) => ({
          key: index,
          isInteractive: true,
          pad: false,
          component: (
            <ItemLabel>
              <UIText
                kind="body/regular"
                color={selected === fruit ? 'var(--primary)' : undefined}
              >
                <HStack gap={8} alignItems="center">
                  <Radio
                    name="fruit"
                    value={fruit}
                    checked={selected === fruit}
                    onChange={(event) => {
                      if (event.currentTarget.checked) {
                        setSelected(event.currentTarget.value as string);
                      }
                    }}
                  />
                  <span>{capitalize(fruit)}</span>
                </HStack>
              </UIText>
            </ItemLabel>
          ),
        }))}
      />
      <Input placeholder="focusable element to test tab navigation" />
    </VStack>
  );
}
export const readme: Readme = {
  id: 'radio-button',
  name: 'Radio Button',
  description: () => (
    <UIText kind="subtitle/l_reg">Decorated radio button</UIText>
  ),
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
        <RadioGroupExample />
        <PageBottom />
      </PageColumn>
    </WindowSize>
  ),
};
