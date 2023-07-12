import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { SignMessage } from './SignMessage';

const samples: Array<{ message: string }> = [{ message: 'Hello, world' }];

const sampleOrigins = [
  'https://app.zerion.io/',
  'https://app.uniswap.org/',
  'https://app.sushi.com/',
];

export const readme: Readme = {
  id: 'signMessage',
  name: 'SignMessage',
  description: null,
  component: () => (
    <div
      style={{
        display: 'grid',
        gridGap: 12,
        gridTemplateColumns: 'repeat(5, minmax(360px, 700px))',
        overflowX: 'auto',
      }}
    >
      {samples.map((sample, index) => (
        <MemoryRouter
          key={index}
          initialEntries={[
            `/signMessage?${new URLSearchParams({
              origin: sampleOrigins[index % sampleOrigins.length],
              windowId: String(index),
              ...sample,
            })}`,
          ]}
        >
          <WindowSize>
            <ViewSuspense>
              <SignMessage />
            </ViewSuspense>
          </WindowSize>
        </MemoryRouter>
      ))}
    </div>
  ),
};
