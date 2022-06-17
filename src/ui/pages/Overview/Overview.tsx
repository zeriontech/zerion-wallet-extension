import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { PageHeading } from 'src/ui/components/PageHeading';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { useNavigate } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useNetworks } from 'src/modules/networks/useNetworks';

const chainIdToName: { [key: string]: string } = {
  '0x89': 'polygon',
  '0x1': 'ethereum',
};
export function Overview() {
  const navigate = useNavigate();
  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery('wallet', () => {
    return walletPort.request('getCurrentWallet');
  });
  const logout = useMutation(() => accountPublicRPCPort.request('logout'));
  const { networks } = useNetworks();

  const { data: chainId, refetch: refetchChainId } = useQuery(
    'wallet/chainId',
    () => walletPort.request('getChainId')
  );
  console.log({ chainId });
  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet) {
    return null;
  }
  return (
    <Background backgroundColor="var(--background)">
      <PageColumn>
        <div style={{ position: 'absolute', right: 8, top: 8 }}>
          <select
            name="chain"
            value={chainIdToName[chainId || '0x1']}
            onChange={(event) => {
              walletPort.request('switchChain', event.target.value);
              refetchChainId();
            }}
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
          </select>
          <div
            style={{
              overflow: 'hidden',
              maxWidth: 100,
              textOverflow: 'ellipsis',
            }}
          >
            {networks && chainId
              ? networks.getRpcUrlInternal(networks.getChainById(chainId))
              : null}
          </div>
        </div>
        <PageTop />
        <PageHeading>Summary</PageHeading>
        <Spacer height={24} />
        <Surface style={{ padding: 12 }}>
          <UIText kind="subtitle/l_reg">Portfolio</UIText>
          <UIText kind="h/1_med">
            $0<span style={{ color: 'var(--neutral-300)' }}>.00</span>
          </UIText>
          <UIText kind="subtitle/l_reg" color="var(--positive-500)">
            +3.4% ($44.22) Today
          </UIText>
        </Surface>
        <Spacer height={8} />
        <Surface style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <BlockieImg address={wallet.address} size={44} />
            <div>
              <UIText kind="subtitle/l_reg" title={wallet.address}>
                {truncateAddress(wallet.address, 4)}
              </UIText>
              <UIText kind="h/6_med">
                $0<span style={{ color: 'var(--neutral-300)' }}>.00</span>
              </UIText>
            </div>
          </div>
        </Surface>
        <div
          style={{ marginTop: 'auto', paddingBottom: 16, textAlign: 'center' }}
        >
          <UnstyledButton
            onClick={async () => {
              await logout.mutateAsync();
              navigate('/login');
            }}
          >
            {logout.isLoading ? 'Locking...' : 'Lock (log out)'}
          </UnstyledButton>
        </div>
      </PageColumn>
    </Background>
  );
}
