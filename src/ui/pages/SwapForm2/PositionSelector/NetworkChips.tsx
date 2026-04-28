import React, { forwardRef } from 'react';
import {
  TabList,
  Tab,
  useTabContext,
  useStoreState,
  TabPanel,
} from '@ariakit/react';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
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
  }
>(function NetworkChips({ networks, onOpenNetworkSelector }, ref) {
  return (
    <div className={styles.chipsContainer}>
      <TabList
        ref={ref}
        className={styles.chipsScroll}
        aria-label="Filter by network"
      >
        <Tab
          key={ALL_NETWORKS_TAB_ID}
          id={ALL_NETWORKS_TAB_ID}
          data-chain-id={ALL_NETWORKS_TAB_ID}
          className={styles.chip}
        >
          <AllNetworksIcon style={{ width: 16, height: 16 }} />
          All
        </Tab>
        {networks.map((network) => (
          <Tab
            key={network.chainId}
            id={network.chainId}
            data-chain-id={network.chainId}
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
      <button
        type="button"
        className={styles.globeButton}
        onClick={onOpenNetworkSelector}
        title="All Networks"
      >
        <GlobeIcon style={{ width: 16, height: 16 }} />
      </button>
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
  return <TabPanel tabId={tabId}>{children}</TabPanel>;
}
