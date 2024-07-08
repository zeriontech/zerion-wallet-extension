import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { UIText } from '../ui-kit/UIText';
import { useWalletAddresses } from '../pages/Networks/shared/useWalletAddresses';
import { VerifyUser } from '../components/VerifyUser';

function Explore({ addresses }: { addresses: string[] }) {
  const { data: exploreData } = useQuery({
    queryKey: ['getExploreSections', addresses],
    queryFn: () =>
      addresses
        ? ZerionAPI.getExploreSections({ addresses, currency: 'usd' })
        : null,
  });
  console.log(exploreData);
  return <UIText kind="headline/hero">Hello world!</UIText>;
}

export function NewTab() {
  const { data: addresses, refetch } = useWalletAddresses();

  if (!addresses) {
    return <VerifyUser onSuccess={refetch} />;
  }

  return <Explore addresses={addresses} />;
}
