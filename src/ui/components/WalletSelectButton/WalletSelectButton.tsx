import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';

/**
 * The wallet avatar in a page's top-right corner, as a link to the wallet
 * picker and back. `/wallet-select` switches the *current* address globally, so
 * a page whose own state is keyed off the old one has to say which search
 * params stop being true — those keys are dropped from the URL it returns to.
 */
export function WalletSelectButton({
  address,
  clearSearchParams,
  size = 24,
  borderRadius = 6,
  title = 'Change Wallet',
}: {
  address: string;
  /** Search params to drop from this page's URL on the way back. */
  clearSearchParams?: readonly string[];
  size?: number;
  borderRadius?: number;
  title?: string;
}) {
  const location = useLocation();
  const to = useMemo(() => {
    if (!clearSearchParams?.length) {
      return '/wallet-select';
    }
    const params = new URLSearchParams();
    for (const key of clearSearchParams) {
      params.append('clearSearchParams', key);
    }
    return { pathname: '/wallet-select', search: `?${params.toString()}` };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSearchParams?.join(',')]);

  // Only read by `/wallet-select` when there are params to clear: without them
  // it pops the history entry instead, which is cheaper and keeps the stack flat
  const state = useMemo(
    () => ({ from: `${location.pathname}${location.search}` }),
    [location.pathname, location.search]
  );

  return (
    <UnstyledLink
      to={to}
      state={state}
      title={title}
      style={{ display: 'flex' }}
    >
      <WalletAvatar
        active={false}
        address={address}
        size={size}
        borderRadius={borderRadius}
      />
    </UnstyledLink>
  );
}
