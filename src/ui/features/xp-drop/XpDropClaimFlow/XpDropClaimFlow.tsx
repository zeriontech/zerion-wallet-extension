import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { XpDropClaim } from './XpDropClaim';
import { XpDropClaimSuccess } from './XpDropClaimSuccess';

export function XpDropClaimFlow() {
  return (
    <Routes>
      <Route path="/" element={<XpDropClaim />} />
      <Route path="/success" element={<XpDropClaimSuccess />} />
    </Routes>
  );
}
