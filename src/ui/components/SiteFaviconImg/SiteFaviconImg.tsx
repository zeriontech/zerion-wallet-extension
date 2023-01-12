import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import { DappIconFetcher } from 'src/ui/components/DappIconFetcher';

export function SiteFaviconImg({
  url,
  style,
  ...imgProps
}: {
  url: string;
  style?: React.CSSProperties;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  /**
   * For now, let's assume that url is the origin,
   * but later it can be any url, and we can parse <link /> tag
   * to get favicon for that specific url
   */
  return (
    <DappIconFetcher
      url={url}
      renderIcon={(src) => (
        <Image
          style={style}
          src={src}
          {...imgProps}
          renderError={() => (
            <Image
              style={style}
              src={`${url}/favicon.ico`}
              renderError={() => (
                <GlobeIcon style={{ color: 'var(--primary)', ...style }} />
              )}
            />
          )}
        />
      )}
    />
  );
}
