import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { SignInWithEthereum } from './SignInWithEthereum';

const MESSAGE =
  'https://lenster.xyz wants you to sign in with your Ethereum account:\n0x3083A9c26582C01Ec075373A8327016A15c1269B\n\nSign in with ethereum to lens\n\nURI: https://lenster.xyz\nVersion: 1\nChain ID: 137\nNonce: a83183e64822e4a4\nIssued At: 2023-02-25T14:34:03.642Z';

export const readme: Readme = {
  id: 'siwe',
  name: 'SIWE',
  description: null,
  component: () => (
    <div
      style={{
        display: 'grid',
        gridGap: 12,
        gridTemplateColumns: 'repeat(5, minmax(400px, 700px))',
        overflowX: 'auto',
      }}
    >
      <MemoryRouter
        initialEntries={[
          `/siwe?${new URLSearchParams({
            origin: 'https://zerion.io',
            message: MESSAGE,
            windowId: '1',
          })}`,
        ]}
      >
        <WindowSize>
          <ViewSuspense>
            <SignInWithEthereum />
          </ViewSuspense>
        </WindowSize>
      </MemoryRouter>
    </div>
  ),
};
