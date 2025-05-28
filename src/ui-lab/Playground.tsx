import React from 'react';
import { Routes, Route } from 'react-router-dom';

const PreviewsPage = React.lazy(() => import('./previews/PreviewsPage'));

export function Playground() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return (
    <Routes>
      <Route path="/" element={<PreviewsPage />} />
    </Routes>
  );
}
