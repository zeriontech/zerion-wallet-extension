import React, { useMemo } from 'react';
import cx from 'classnames';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import DownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { NetworkSelect } from '../../Networks/NetworkSelect';
import * as styles from './styles.module.css';

function NetworksDisclosureButton({
  title,
  value,
  networks,
  openDialog,
}: {
  title: string;
  value: string;
  networks: Networks | null;
  openDialog: () => void;
}) {
  const chain = createChain(value);
  const network = useMemo(
    () => networks?.getNetworkByName(chain),
    [chain, networks]
  );

  if (!networks || !network) {
    return <Spacer height={50} />;
  }

  return (
    <UnstyledButton
      type="button"
      onClick={openDialog}
      className={cx('parent-hover', styles.networkSelect)}
      style={{
        width: '100%',
        ['--parent-content-color' as string]: 'var(--neutral-500)',
        ['--parent-hovered-content-color' as string]: 'var(--black)',
      }}
    >
      <HStack gap={4} justifyContent="space-between" alignItems="center">
        <HStack gap={8} alignItems="center">
          <NetworkIcon size={24} src={network.icon_url} name={network.name} />
          <VStack gap={0} style={{ justifyItems: 'start', overflow: 'hidden' }}>
            <UIText kind="caption/regular" color="var(--neutral-600)">
              {title}
            </UIText>
            <UIText kind="small/accent" color="var(--black)">
              {networks.getChainName(chain)}
            </UIText>
          </VStack>
        </HStack>
        <DownIcon
          width={16}
          height={16}
          style={{ color: 'var(--primary-500)' }}
        />
      </HStack>
    </UnstyledButton>
  );
}

export function LabeledNetworkSelect({
  label,
  value,
  onChange,
  dialogRootNode,
  filterPredicate,
  showAllNetworksOption,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dialogRootNode?: HTMLElement;
  filterPredicate?: (network: NetworkConfig) => boolean;
  showAllNetworksOption?: boolean;
}) {
  return (
    <NetworkSelect
      value={value}
      onChange={onChange}
      dialogRootNode={dialogRootNode}
      filterPredicate={filterPredicate}
      showAllNetworksOption={showAllNetworksOption}
      renderButton={({ networks, openDialog, value }) => (
        <NetworksDisclosureButton
          title={label}
          value={value}
          openDialog={openDialog}
          networks={networks}
        />
      )}
    />
  );
}
