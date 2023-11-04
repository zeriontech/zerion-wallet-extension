import { useAddressPortfolioDecomposition } from 'defi-sdk';
import React from 'react';
import { useMemo } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { Networks } from 'src/modules/networks/Networks';

export function TokenNetworkSelect({
  address,
  name,
  onChange,
  value,
  networks,
}: {
  address: string;
  name: string;
  value: string;
  networks: Networks;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const { value: portfolioDecomposition } = useAddressPortfolioDecomposition({
    address,
    currency: 'usd',
    meta: {
      context: 'my_wallets',
    },
  });

  const availableNetworks = useMemo(() => {
    return networks
      ?.getNetworks()
      .filter((network) =>
        networks.supports('sending', createChain(network.chain))
      );
  }, [networks]);

  const availableSendTokenNetworks = useMemo(() => {
    return availableNetworks?.filter(
      (network) =>
        network.chain === NetworkId.Ethereum ||
        network.chain in
          (portfolioDecomposition?.positions_chains_distribution || {})
    );
  }, [availableNetworks, portfolioDecomposition]);

  return (
    <select name={name} onChange={onChange} value={value}>
      {availableSendTokenNetworks.map((network) => (
        <option key={network.id} value={network.chain}>
          {networks.getChainName(createChain(network.chain))}
        </option>
      ))}
    </select>
  );
}
