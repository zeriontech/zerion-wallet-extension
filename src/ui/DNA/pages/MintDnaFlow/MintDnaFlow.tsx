import React, { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { PageLayout } from 'src/ui/features/onboarding/shared/PageLayout';
import { WideScreen } from '../../shared/WideScreen';
import { ENABLE_DNA_BANNERS } from '../../components/DnaBanners';
import { MintDna } from './MintDna';
import { Success } from './Success';
import { MintDnaWaiting } from './MintDnaWaiting';

export function MintDnaFlow() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!ENABLE_DNA_BANNERS) {
      navigate('/404');
    }
  }, [navigate]);
  if (!ENABLE_DNA_BANNERS) {
    return null;
  }
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
