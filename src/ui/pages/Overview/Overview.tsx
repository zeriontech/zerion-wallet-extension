import React from 'react';
import { useQuery } from 'react-query';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { PageHeading } from 'src/ui/components/PageHeading';
import { BlockieImg } from 'src/ui/components/BlockieImg';

export function Overview() {
  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery('wallet', () => {
    return walletPort.request('getCurrentWallet');
  });
  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet) {
    return null;
  }
  return (
    <div style={{ flexGrow: 1, backgroundColor: 'var(--background)' }}>
      <PageColumn>
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
      </PageColumn>
    </div>
  );
}
