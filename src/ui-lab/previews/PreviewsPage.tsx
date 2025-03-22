import React from 'react';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { EmptyView2 } from 'src/ui/components/EmptyView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewArea } from 'src/ui/components/ViewArea';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { previews } from './registerPreview';

function PreviewList() {
  return (
    <VStack gap={48}>
      {previews.map((preview) => (
        <VStack key={preview.name} gap={12}>
          <UIText kind="headline/h2">{preview.name}</UIText>
          {preview.component}
        </VStack>
      ))}
    </VStack>
  );
}

export default function PreviewsPage() {
  useBackgroundKind(whiteBackgroundKind);
  return (
    <ViewArea>
      <PageColumn>
        <PageTop />
        <UIText kind="headline/h1">Previews</UIText>
        <PageTop />
        {previews.length ? (
          <PreviewList />
        ) : (
          <EmptyView2>No Previews Yet</EmptyView2>
        )}
      </PageColumn>
    </ViewArea>
  );
}
