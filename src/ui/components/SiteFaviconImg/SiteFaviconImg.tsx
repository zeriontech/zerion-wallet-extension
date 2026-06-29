import React, { useMemo, useState } from 'react';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import { useFetchDappIcon } from 'src/ui/components/DappIconFetcher/useFetchDappIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DelayedRender } from '../DelayedRender';

type Props = {
  url: string;
  size: number | string;
  style?: React.CSSProperties;
  /**
   * A directly-known icon URL (e.g. the active browser tab's `favIconUrl`)
   * that is already loaded and cached. Tried first so it paints instantly
   * without waiting on the dapp HTML fetch.
   */
  priorityUrl?: string | null;
};

function FallbackIcon({
  url,
  size,
  style,
}: Pick<Props, 'url' | 'size' | 'style'>) {
  const siteNamePreview = new URL(url).hostname.split('.').at(-2)?.slice(0, 2);
  return siteNamePreview ? (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '20%',
        backgroundColor: 'var(--neutral-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <UIText kind="caption/accent" color="var(--always-white)">
        {siteNamePreview}
      </UIText>
    </div>
  ) : (
    <GlobeIcon style={{ color: 'var(--primary)', ...style }} />
  );
}

/**
 * Renders an <img> immediately, walking through a list of candidate sources
 * on each load error. Cached images paint synchronously on the first frame,
 * so a loaded favicon is the first thing shown — the fallback only appears
 * once every candidate has failed.
 */
function ProgressiveFavicon({
  url,
  size,
  style: styleProp,
  priorityUrl,
  liveIconUrl,
  ...imgProps
}: Props & {
  liveIconUrl?: string | null;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const style = { width: size, height: size, ...styleProp };
  // The HTML-declared icon at the moment this url first rendered. When it is
  // already cached we can show the accurate icon first; when it arrives later
  // we only append it (below) so we never reshuffle an already-shown source.
  const [initialIconUrl] = useState(liveIconUrl ?? null);

  const sources = useMemo(() => {
    const ordered = [
      priorityUrl,
      initialIconUrl,
      `${url}/favicon.png`,
      `${url}/favicon.ico`,
      liveIconUrl,
    ].filter(Boolean) as string[];
    return Array.from(new Set(ordered));
  }, [priorityUrl, initialIconUrl, url, liveIconUrl]);

  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (src == null) {
    // Every candidate failed (or none exists) — fall back. The delay avoids
    // flashing the fallback during the brief error cascade between candidates.
    return (
      <div style={{ width: size, height: size }}>
        <DelayedRender>
          <FallbackIcon size={size} url={url} style={styleProp} />
        </DelayedRender>
      </div>
    );
  }

  return (
    <img
      {...imgProps}
      style={style}
      src={src}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}

export function SiteFaviconImg({
  url,
  priorityUrl,
  ...rest
}: Props & React.ImgHTMLAttributes<HTMLImageElement>) {
  const { data: iconUrl } = useFetchDappIcon(url);
  return (
    // key by url so the source progression resets cleanly when the site changes
    <ProgressiveFavicon
      key={url}
      url={url}
      priorityUrl={priorityUrl}
      liveIconUrl={iconUrl}
      {...rest}
    />
  );
}
