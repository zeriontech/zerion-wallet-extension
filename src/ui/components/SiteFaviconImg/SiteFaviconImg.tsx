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
  return (
    <DappIconFetcher
      url={url}
      render={(src) =>
        src == null ? (
          <GlobeIcon style={{ color: 'var(--primary)', ...style }} />
        ) : (
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
        )
      }
    />
  );
}
