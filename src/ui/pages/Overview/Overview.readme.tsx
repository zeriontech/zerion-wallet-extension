import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { Overview } from './Overview';

export const readme: Readme = {
  id: 'overview',
  name: 'Overview',
  description: null,
  component: () => (
    <MemoryRouter>
      <WindowSize
        style={{
          // @ts-ignore --background
          '--background': 'var(--neutral-100)',
          backgroundColor: 'var(--background)',
        }}
      >
        <ViewSuspense>
          <Overview />
        </ViewSuspense>
      </WindowSize>
    </MemoryRouter>
  ),
};
