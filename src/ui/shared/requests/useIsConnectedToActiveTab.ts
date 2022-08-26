import { useQuery } from 'react-query';
import browser from 'webextension-polyfill';
import { walletPort } from '../channels';

export function useIsConnectedToActiveTab(address: string) {
  const { data: tabOrigin } = useQuery('activeTab/origin', async () => {
    const tabs = await browser.tabs.query({ active: true });
    const url = tabs.find((tab) => tab.url)?.url;
    if (url) {
      return new URL(url).origin;
    } else {
      return null;
    }
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
