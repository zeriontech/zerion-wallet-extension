import { useFetchDappIcon } from './useFetchDappIcon';

type IconRenderer = (src: string) => JSX.Element;

interface Props {
  url: string;
  renderIcon: IconRenderer;
}

export function DappIconFetcher({ url: dappUrl, renderIcon }: Props) {
  const { data: iconUrl, isLoading } = useFetchDappIcon(dappUrl);
  if (isLoading) {
    return null;
  }
  const src = iconUrl ? iconUrl : `${dappUrl}/favicon.png`;
  return renderIcon(src);
}
