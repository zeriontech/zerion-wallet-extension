import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageLayout } from 'src/ui/components/PageLayout';
import { WideScreen } from '../../shared/WideScreen';
import { Success } from './Success';
import { SelectBackground } from './SelectBackground';
import { SelectDna } from './SelectDna';
import { UpgradeDnaWaiting } from './UpgradeDnaWaiting';

export function UpgradeDnaFlow() {
  return (
    <PageLayout>
      <WideScreen>
        <Routes>
          <Route path="/" element={<SelectBackground />} />
          <Route path="/sign" element={<SelectDna />} />
          <Route path="/waiting" element={<UpgradeDnaWaiting />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </WideScreen>
    </PageLayout>
  );
}
