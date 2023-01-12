import { useFetchIcon } from './useFetchIcon';

type IconRenderer = (src: string) => JSX.Element;

interface Props {
  url: string;
  renderIcon: IconRenderer;
}

function extractFaviconUrl(
  dappUrl: string,
  dappHtml: string
): string | null | undefined {
  const parser = new DOMParser();
  const doc = parser.parseFromString(dappHtml, 'text/html');
  const head = doc.head;
  // All links with "sizes" attribute are icons (have rel="icon" attribute)
  const icon512 = head.querySelector("link[sizes='512x512']");
  const icon192 = head.querySelector("link[sizes='192x192']");
  const icon180 = head.querySelector("link[sizes='180x180']");
  const icon167 = head.querySelector("link[sizes='167x167']");
  const icon152 = head.querySelector("link[sizes='152x152']");
  const icon144 = head.querySelector("link[sizes='144x144']");
  const icon = head.querySelector("link[rel*='icon']");

  const iconElement =
    icon512 ?? icon192 ?? icon180 ?? icon167 ?? icon152 ?? icon144 ?? icon;
  const href = iconElement?.getAttribute('href');
  return href ? new URL(href, dappUrl).toString() : null;
}

export function DappIconFetcher({ url, renderIcon }: Props) {
  const { data, isLoading } = useFetchIcon(url);
  const hqUrl = !isLoading && data ? extractFaviconUrl(url, data) : null;
  const src = hqUrl ?? `${url}/favicon.png`;
  return renderIcon(src);
}
