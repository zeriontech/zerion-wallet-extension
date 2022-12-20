import React from 'react';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';

export function NetworkSelectDialog({ value }: { value: string }) {
  const { networks } = useNetworks();

  return (
    <form method="dialog">
      <SurfaceList
        items={
          networks
            ? networks.getNetworks().map((network) => ({
                key: network.chain,
                isInteractive: true,
                separatorTop: true,
                pad: false,
                component: (
                  <SurfaceItemButton value={network.chain}>
                    <HStack gap={4} justifyContent="space-between">
                      <HStack gap={8} alignItems="center">
                        <img
                          src={network.icon_url || ''}
                          alt=""
                          style={{ width: 16, height: 16 }}
                        />

                        {networks.getChainName(createChain(network.name))}
                      </HStack>

                      {network.chain === value ? (
                        <span style={{ color: 'var(--primary)' }}>✔</span>
                      ) : null}
                    </HStack>
                  </SurfaceItemButton>
                ),
              }))
            : []
        }
      />
    </form>
  );
}
