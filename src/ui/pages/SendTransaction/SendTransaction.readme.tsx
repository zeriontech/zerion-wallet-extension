import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { SendTransaction } from './SendTransaction';
import { sample } from './transactions.sample';

const sampleOrigins = [
  'https://app.zerion.io/',
  'https://app.uniswap.org/',
  'https://app.sushi.com/',
];
export const readme: Readme = {
  name: 'SendTransaction',
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
      {Object.entries(sample).map(([key, tx], index) => (
        <div key={index}>
          {key}

          <MemoryRouter
            initialEntries={[
              `/sendTransaction?${new URLSearchParams({
                origin: sampleOrigins[index % sampleOrigins.length],
                transaction: JSON.stringify(tx),
                windowId: String(index),
              })}`,
            ]}
          >
            <WindowSize>
              <SendTransaction />
            </WindowSize>
          </MemoryRouter>
        </div>
      ))}
    </div>
  ),
};
