import React from 'react';
import {
  TabList,
  Tab,
  useTabContext,
  useStoreState,
  TabPanel,
} from '@ariakit/react';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import * as styles from './styles.module.css';

export interface NetworkOption {
  chainId: string;
  name: string;
  iconUrl: string;
}

export function NetworkChips({
  networks,
  onOpenNetworkSelector,
}: {
  networks: NetworkOption[];
  onOpenNetworkSelector: () => void;
}) {
  return (
    <div className={styles.chipsContainer}>
      <TabList className={styles.chipsScroll} aria-label="Filter by network">
        {networks.map((network) => (
          <Tab
            key={network.chainId}
            id={network.chainId}
            className={styles.chip}
          >
            <NetworkIcon
              src={network.iconUrl}
              name={network.name}
              size={16}
              style={{ borderRadius: 4 }}
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
}

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
