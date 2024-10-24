import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { XpDropOnboarding } from './XpDropOnboarding';
import { XpDropClaim } from './XpDropClaim';

export function XpDrop() {
  return (
    <Routes>
      <Route path="/" element={<XpDropOnboarding />} />
      <Route path="/claim" element={<XpDropClaim />} />
    </Routes>
  );
}
