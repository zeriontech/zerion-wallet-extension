import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { DepositTokenSelect } from './DepositTokenSelect';
import { DepositForm } from './DepositForm';

/**
 * The fiat on-ramp flow: pick what to buy, then how much and from whom. Nothing
 * here signs a transaction — the last step hands off to a third-party provider.
 */
export function Deposit() {
  return (
    <Routes>
      <Route path="/" element={<DepositTokenSelect />} />
      <Route path="/form" element={<DepositForm />} />
    </Routes>
  );
}
