import { useFetchDappIcon } from './useFetchDappIcon';

type IconRenderer = (src: string | null) => React.ReactNode;

interface Props {
  url: string;
  render: IconRenderer;
}

export function DappIconFetcher({ url: dappUrl, render }: Props) {
  const { data: iconUrl, isLoading } = useFetchDappIcon(dappUrl);
  if (isLoading) {
    return render(null);
  }
  const src = iconUrl || `${dappUrl}/favicon.png`;
  return render(src);
}
