import React from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { useCurrentNetwork } from 'src/ui/shared/networks/useCurrentNetwork';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';

export function Networks() {
  const navigate = useNavigate();
  const { network: currentNetwork, refetch } = useCurrentNetwork();
  const { networks } = useNetworks();
  const switchChainMutation = useMutation(
    (chain: string) => walletPort.request('switchChain', chain),
    {
      onSuccess: () => {
        refetch();
        navigate(-1);
      },
    }
  );
  return (
    <PageColumn>
      <PageTop />
      <SurfaceList
        items={
          networks
            ? networks.getNetworks().map((network) => ({
                key: network.chain,
                onClick: () => {
                  switchChainMutation.mutate(network.chain);
                },
                component: (
                  <HStack gap={4} justifyContent="space-between">
                    <HStack gap={8} alignItems="center">
                      <img
                        src={network.icon_url || ''}
                        alt=""
                        style={{ width: 16, height: 16 }}
                      />

                      {networks.getChainName(createChain(network.name))}
                    </HStack>

                    {network.chain === currentNetwork?.chain ? (
                      <span style={{ color: 'var(--primary)' }}>✔</span>
                    ) : null}
                  </HStack>
                ),
              }))
            : []
        }
      />
    </PageColumn>
  );
}
