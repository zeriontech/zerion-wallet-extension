import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { XpDropOnboarding } from './XpDropOnboarding';
import { XpDropClaimFlow } from './XpDropClaimFlow';

export function XpDrop() {
  return (
    <Routes>
      <Route path="/onboarding/*" element={<XpDropOnboarding />} />
      <Route path="/claim/*" element={<XpDropClaimFlow />} />
    </Routes>
  );
}
