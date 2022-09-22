import { useQuery } from 'react-query';
import { walletPort } from '../channels';
import { getActiveTabOrigin } from './getActiveTabOrigin';

export function useIsConnectedToActiveTab(address: string) {
  const { data: tabOrigin } = useQuery('activeTab/origin', getActiveTabOrigin, {
    useErrorBoundary: true,
  });
  return useQuery(
    `hasPermission(${address}, ${tabOrigin})`,
    async () => {
      if (tabOrigin) {
        return walletPort.request('hasPermission', {
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
