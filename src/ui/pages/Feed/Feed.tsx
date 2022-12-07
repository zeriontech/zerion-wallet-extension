import React from 'react';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { useWalletAbilities } from './daylight';

export function Feed() {
  const { singleAddress } = useAddressParams();
  // const { value, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
  //   useWalletAbilities(singleAddress);

  const fetching = false; // isFetchingNextPage || isFetching;
  const hasNextPage = true;

  // console.log(value);

  return hasNextPage ? (
    <SurfaceList
      items={[
        {
          key: 0,
          onClick: fetching ? undefined : () => fetchNextPage(),
          component: (
            <span
              style={{
                color: fetching ? 'var(--neutral-500)' : 'var(--primary)',
              }}
            >
              More abilities
            </span>
          ),
        },
      ]}
    />
  ) : null;
}
