import React, { useCallback, useMemo, useState } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { Button } from 'src/ui/ui-kit/Button';
import { Media } from 'src/ui/ui-kit/Media';
import IconLeft from 'jsx:src/ui/assets/arrow-left.svg';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { DelayedRender } from '../DelayedRender';
import { NetworkIcon } from '../NetworkIcon';
import { PageBottom } from '../PageBottom';
import { PageColumn } from '../PageColumn';
import { ViewLoading } from '../ViewLoading';

function NetworkList({
  networks,
  networkList,
}: {
  networks: Networks;
  networkList: NetworkConfig[];
}) {
  return (
    <SurfaceList
      items={networkList.map((network) => ({
        key: network.external_id || network.chain,
        isInteractive: true,
        pad: false,
        component: (
          <SurfaceItemButton value={network.chain}>
            <HStack gap={4} justifyContent="space-between" alignItems="center">
              <Media
                image={
                  <NetworkIcon // TODO: Create NetworkIcon component
                    size={24}
                    src={network.icon_url}
                    chainId={network.external_id}
                  />
                }
                text={networks.getChainName(createChain(network.chain))}
                vGap={0}
                detailText={null}
              />

              <UIText kind="small/regular" color="var(--neutral-500)">
                $1234.34
              </UIText>
            </HStack>
          </SurfaceItemButton>
        ),
      }))}
    />
  );
}

function MainNetworkView({
  networks,
  value,
  onOpenMore,
}: {
  networks: Networks;
  value: string;
  onOpenMore: () => void;
}) {
  return (
    <>
      <Spacer height={16} />
      <UIText kind="headline/h3" style={{ paddingInline: 16 }}>
        <DialogTitle alignTitle="start" title="Filter by Network" />
      </UIText>
      <form method="dialog">
        <SurfaceList
          items={
            networks
              ? networks
                  .getNetworks()
                  .slice(0, 6)
                  .map((network) => ({
                    key: network.external_id || network.chain,
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

                            {networks.getChainName(createChain(network.chain))}
                          </HStack>

                          {network.chain === value ? (
                            <span style={{ color: 'var(--primary)' }}>✔</span>
                          ) : null}
                        </HStack>
                      </SurfaceItemButton>
                    ),
                  }))
                  .concat([
                    {
                      key: 'more-button',
                      separatorTop: true,
                      isInteractive: true,
                      pad: false,
                      component: (
                        <SurfaceItemButton type="button" onClick={onOpenMore}>
                          <UIText kind="body/regular" color="var(--primary)">
                            Available networks {'->'}
                          </UIText>
                        </SurfaceItemButton>
                      ),
                    },
                  ])
              : []
          }
        />
      </form>
    </>
  );
}

function PseudoRoute({
  when,
  component,
}: {
  when: boolean;
  component: JSX.Element;
}) {
  if (when) {
    return component;
  }
  return null;
}

enum Tab {
  mainnets,
  testnets,
  customList,
}

function CompleteNetworkList({
  networks,
  onGoBack,
}: {
  networks: Networks;
  onGoBack: () => void;
}) {
  const mainnetList = networks.getNetworks();
  const testnetList = useMemo(() => networks.getTestNetworks(), [networks]);
  const customList = useMemo(() => networks.getCustomNetworks(), [networks]);
  const [tab, setTab] = useState(Tab.mainnets);
  const handleTabChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) =>
      setTab(Number(event.currentTarget.value)),
    []
  );

  return (
    <>
      <div
        style={{ padding: 8, display: 'flex', justifyContent: 'space-between' }}
      >
        <HStack gap={8} alignItems="center">
          <Button
            kind="ghost"
            aria-label="Go back"
            onClick={onGoBack}
            size={40}
            style={{ padding: 8 }}
            type="button"
          >
            <IconLeft
              role="presentation"
              style={{ display: 'block', width: 20, height: 20 }}
            />
          </Button>
          <UIText kind="headline/h3">Available Networks</UIText>
        </HStack>
        <Button
          as={UnstyledLink}
          to="/networks/create"
          kind="ghost"
          title="Add Network"
          size={40}
          style={{ padding: 8 }}
        >
          <AddCircleIcon style={{ display: 'block', marginInline: 'auto' }} />
        </Button>
      </div>
      <PageColumn>
        <Input boxHeight={40} type="search" placeholder="Search" />
        <Spacer height={16} />
        <SegmentedControlGroup style={{ paddingTop: 4 }}>
          <SegmentedControlRadio
            name="tab"
            value={Tab.mainnets}
            onChange={handleTabChange}
            checked={tab === Tab.mainnets}
          >
            Mainnets
          </SegmentedControlRadio>
          <SegmentedControlRadio
            name="tab"
            value={Tab.testnets}
            onChange={handleTabChange}
            checked={tab === Tab.testnets}
          >
            Testnets
          </SegmentedControlRadio>
          <SegmentedControlRadio
            name="tab"
            value={Tab.customList}
            onChange={handleTabChange}
            checked={tab === Tab.customList}
          >
            Custom
          </SegmentedControlRadio>
        </SegmentedControlGroup>
        <Spacer height={8} />
        <PseudoRoute
          when={tab === Tab.mainnets}
          component={
            <form method="dialog">
              <NetworkList networks={networks} networkList={mainnetList} />
            </form>
          }
        />
        <PseudoRoute
          when={tab === Tab.testnets}
          component={
            <form method="dialog">
              <NetworkList networks={networks} networkList={testnetList} />
            </form>
          }
        />
        <PseudoRoute
          when={tab === Tab.customList}
          component={
            <form method="dialog">
              <NetworkList networks={networks} networkList={customList} />
            </form>
          }
        />
        <PageBottom />
      </PageColumn>
    </>
  );
}

enum View {
  main,
  completeList,
}
export function NetworkSelectDialog({ value }: { value: string }) {
  const { networks } = useNetworks();
  const [view, setView] = useState<View>(View.main);

  if (!networks && !navigator.onLine) {
    return <ViewLoading kind="network" />;
  }
  if (!networks) {
    return <DelayedRender delay={4000}>No Data</DelayedRender>;
  }
  return (
    <>
      <PseudoRoute
        when={view === View.main}
        component={
          <MainNetworkView
            value={value}
            networks={networks}
            onOpenMore={() => setView(View.completeList)}
          />
        }
      />
      <PseudoRoute
        when={view === View.completeList}
        component={
          <CompleteNetworkList
            // value={value}
            networks={networks}
            onGoBack={() => setView(View.main)}
          />
        }
      />
    </>
  );
}
