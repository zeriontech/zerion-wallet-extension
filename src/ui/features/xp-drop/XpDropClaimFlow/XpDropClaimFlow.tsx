import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { XpDropClaimSuccess } from './XpDropClaimSuccess';
import { XpDropClaim } from './XpDropClaim';

export function XpDropClaimFlow() {
  return (
    <Routes>
      <Route path="/" element={<XpDropClaim />} />
      <Route path="/success" element={<XpDropClaimSuccess />} />
    </Routes>
  );
}
