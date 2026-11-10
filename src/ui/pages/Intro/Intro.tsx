import React from 'react';
import { Navigate } from 'react-router';

export function Intro() {
  return (
    <Navigate
      replace={true}
      to={`/get-started?beforeCreate=${encodeURIComponent('/create-account')}&intro`}
    />
  );
}
