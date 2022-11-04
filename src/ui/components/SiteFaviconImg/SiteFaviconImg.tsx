import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';

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
    <Image
      style={style}
      src={`${url}/favicon.ico`}
      {...imgProps}
      renderError={() => (
        <Image
          style={style}
          src={`${url}/favicon.png`}
          renderError={() => <GlobeIcon style={style} />}
        />
      )}
    />
  );
}
