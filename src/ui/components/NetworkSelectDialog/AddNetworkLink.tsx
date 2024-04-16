import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import { SurfaceItemLink, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';

export function AddNetworkLink() {
  return (
    <>
      <div
        style={{
          height: 8,
          width: '100%',
          borderTop: '2px solid var(--neutral-200)',
        }}
      />
      <SurfaceList
        style={{
          paddingBlock: 0,
          ['--surface-background-color' as string]: 'transparent',
        }}
        items={[
          {
            key: 'Add network',
            style: { padding: 0 },
            pad: false,
            component: (
              <SurfaceItemLink
                to="/networks/create"
                style={{ paddingInline: 0 }}
              >
                <HStack gap={8} alignItems="center" style={{ paddingBlock: 4 }}>
                  <AddCircleIcon
                    style={{ display: 'block', marginInline: 'auto' }}
                  />
                  <UIText kind="body/accent">Add Network</UIText>
                </HStack>
              </SurfaceItemLink>
            ),
          },
        ]}
      />
    </>
  );
}
