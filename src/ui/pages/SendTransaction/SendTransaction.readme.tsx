import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SendTransaction } from './SendTransaction';
import { sample } from './transactions.sample';

export const readme: Readme = {
  name: 'SendTransaction',
  description: null,
  component: () => (
    <HStack
      gap={12}
      style={{ gridAutoColumns: 'minmax(250px, 1fr)', overflowX: 'auto' }}
    >
      {Object.values(sample).map((tx, index) => (
        <MemoryRouter
          key={index}
          initialEntries={[
            `/sendTransaction?${new URLSearchParams({
              origin: 'https://zerion.io',
              transaction: JSON.stringify(tx),
              windowId: String(index),
            })}`,
          ]}
        >
          <WindowSize>
            <SendTransaction />
          </WindowSize>
        </MemoryRouter>
      ))}
    </HStack>
  ),
};
