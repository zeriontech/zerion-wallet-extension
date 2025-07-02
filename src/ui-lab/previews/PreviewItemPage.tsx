import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { invariant } from 'src/shared/invariant';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { VStack } from 'src/ui/ui-kit/VStack';
import { NavigationBar } from 'src/ui/components/NavigationBar';
import { NotFoundPage } from 'src/ui/components/NotFoundPage';
import { DocumentTitle } from 'src/ui/components/URLBar/URLBar';
import { PageBottom } from 'src/ui/components/PageBottom';
import type { PreviewConfig } from './registerPreview';
import { previews } from './registerPreview';

function PreviewItem({ preview }: { preview: PreviewConfig }) {
  return (
    <VStack key={preview.name} gap={12}>
      {typeof preview.component === 'function'
        ? preview.component()
        : preview.component}
    </VStack>
  );
}

export default function PreviewItemPage() {
  useBackgroundKind(whiteBackgroundKind);
  const params = useParams();
  const name = params.name;
  invariant(name, 'name param is required');
  const item = useMemo(
    () => previews.find((preview) => preview.name === name),
    [name]
  );
  if (!item) {
    return <NotFoundPage />;
  }
  return (
    <PageColumn>
      <PageTop />
      <NavigationBar title={item.name} home="/plaground" />
      <DocumentTitle title={`Preview · ${item.name}`} />
      <PageTop />
      <PreviewItem preview={item} />
      <PageBottom />
    </PageColumn>
  );
}
