import React from 'react';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { EmptyView2 } from 'src/ui/components/EmptyView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { NavigationBar } from 'src/ui/components/NavigationBar';
import { DocumentTitle } from 'src/ui/components/URLBar/URLBar';
import { previews } from './registerPreview';

function PreviewList() {
  return (
    <VStack gap={48}>
      {previews.map((preview) => (
        <VStack key={preview.name} gap={12}>
          <UnstyledLink
            className="hover:underline"
            to={`/playground/${encodeURIComponent(preview.name)}`}
          >
            <UIText kind="headline/h2">{preview.name}</UIText>
          </UnstyledLink>
          {typeof preview.component === 'function'
            ? preview.component()
            : preview.component}
        </VStack>
      ))}
    </VStack>
  );
}

export default function PreviewsPage() {
  useBackgroundKind(whiteBackgroundKind);
  return (
    <PageColumn>
      <PageTop />
      <NavigationBar title="Component Previews" />
      <DocumentTitle title="Component Previews" />
      <PageTop />
      <Spacer height={36} />
      {previews.length ? (
        <PreviewList />
      ) : (
        <EmptyView2>No Previews Yet</EmptyView2>
      )}
    </PageColumn>
  );
}
