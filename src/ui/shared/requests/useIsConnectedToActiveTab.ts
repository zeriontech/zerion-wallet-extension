import { useQuery } from 'react-query';
import { walletPort } from '../channels';
import { getActiveTabOrigin } from './getActiveTabOrigin';

export function useIsConnectedToActiveTab(address: string) {
  const { data } = useQuery('activeTab/origin', getActiveTabOrigin, {
    useErrorBoundary: true,
  });
  const tabOrigin = data?.tabOrigin;
  return useQuery(
    `hasPermission(${address}, ${tabOrigin})`,
    async () => {
      if (tabOrigin) {
        return walletPort.request('isAccountAvailableToOrigin', {
          address,
          origin: tabOrigin,
        });
      } else {
        return null;
      }
    },
    { enabled: Boolean(tabOrigin) }
  );
}

export function IsConnectedToActiveTab({
  address,
  render,
}: {
  address: string;
  render: (value: ReturnType<typeof useIsConnectedToActiveTab>) => JSX.Element;
}) {
  return render(useIsConnectedToActiveTab(address));
}
