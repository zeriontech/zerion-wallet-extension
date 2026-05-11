import React, { forwardRef } from 'react';
import {
  TabList,
  Tab,
  useTabContext,
  useStoreState,
  TabPanel,
  Role,
} from '@ariakit/react';
import { Tooltip, TooltipAnchor, TooltipProvider } from 'src/ui/ui-kit/Tooltip';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { isMacOS } from 'src/ui/shared/isMacos';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import AllNetworksIcon from 'jsx:src/ui/assets/all-networks.svg';
import * as styles from './styles.module.css';

export const ALL_NETWORKS_TAB_ID = 'all';

export interface NetworkOption {
  chainId: string;
  name: string;
  iconUrl: string;
}

export const NetworkChips = forwardRef<
  HTMLDivElement,
  {
    networks: NetworkOption[];
    onOpenNetworkSelector: () => void;
    showAllTab?: boolean;
    showNetworkSelectorTrigger?: boolean;
  }
>(function NetworkChips(
  {
    networks,
    onOpenNetworkSelector,
    showAllTab = true,
    showNetworkSelectorTrigger = true,
  },
  ref
) {
  return (
    <div className={styles.chipsContainer}>
      <TabList
        ref={ref}
        className={styles.chipsScroll}
        aria-label="Filter by network"
      >
        {showAllTab ? (
          <Tab
            key={ALL_NETWORKS_TAB_ID}
            id={ALL_NETWORKS_TAB_ID}
            data-chain-id={ALL_NETWORKS_TAB_ID}
            accessibleWhenDisabled={false}
            render={<Role.div />}
            className={styles.chip}
          >
            <AllNetworksIcon style={{ width: 16, height: 16 }} />
            All
          </Tab>
        ) : null}
        {networks.map((network) => (
          <Tab
            key={network.chainId}
            id={network.chainId}
            data-chain-id={network.chainId}
            accessibleWhenDisabled={false}
            render={<Role.div />}
            className={styles.chip}
          >
            <NetworkIcon
              src={network.iconUrl}
              name={network.name}
              size={16}
              style={{
                borderRadius: 4,
                background: 'var(--neutral-100)',
              }}
            />
            {network.name}
          </Tab>
        ))}
      </TabList>
      {showNetworkSelectorTrigger ? (
        <div className={styles.globeButtonWrapper}>
          <TooltipProvider placement="top" timeout={150}>
            <TooltipAnchor
              render={
                <button
                  type="button"
                  className={styles.globeButton}
                  onClick={onOpenNetworkSelector}
                >
                  <GlobeIcon style={{ width: 16, height: 16 }} />
                </button>
              }
            />
            <Tooltip className={styles.tooltip} gutter={8} portal={false}>
              <span>Browse All Networks</span>
              <span className={styles.tooltipKbd}>
                {isMacOS() ? '⇧→' : 'Shift+→'}
              </span>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : null}
    </div>
  );
});

/**
 * Connects a TabPanel to the currently selected tab.
 * Follows the pattern from pulse-frontend WalletMenu's TabPanelWrapper.
 * Must be rendered inside a TabProvider.
 */
export function TabPanelWrapper({ children }: { children: React.ReactNode }) {
  const tab = useTabContext();
  const tabId = useStoreState(tab, (state) => state?.selectedId);
  return (
    <TabPanel key={tabId} tabId={tabId}>
      {children}
    </TabPanel>
  );
}
