import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageLayout } from 'src/ui/features/onboarding/shared/PageLayout';
import { WideScreen } from '../../shared/WideScreen';
import { MintDna } from './MintDna';
import { Success } from './Success';
import { MintDnaWaiting } from './MintDnaWaiting';

export function MintDnaFlow() {
  return (
    <PageLayout>
      <WideScreen>
        <Routes>
          <Route path="/" element={<MintDna />} />
          <Route path="/minting" element={<MintDnaWaiting />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </WideScreen>
    </PageLayout>
  );
}
