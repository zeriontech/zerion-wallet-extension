import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ViewArea } from 'src/ui/components/ViewArea';

const PreviewsPage = React.lazy(() => import('./previews/PreviewsPage'));
const PreviewItemPage = React.lazy(() => import('./previews/PreviewItemPage'));

export function Playground() {
  return (
    <ViewArea>
      <Routes>
        <Route path="/" element={<PreviewsPage />} />
        <Route path="/:name" element={<PreviewItemPage />} />
      </Routes>
    </ViewArea>
  );
}
