import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import { DappIconFetcher } from 'src/ui/components/DappIconFetcher';
import { DelayedRender } from '../DelayedRender';

export function SiteFaviconImg({
  url,
  size,
  style: styleProp,
  ...imgProps
}: {
  url: string;
  size: number | string;
  style?: React.CSSProperties;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const style = { width: size, height: size, ...styleProp };
  return (
    <DappIconFetcher
      url={url}
      render={(src) =>
        src == null ? (
          <div style={{ width: size, height: size }}>
            <DelayedRender>
              <GlobeIcon style={{ color: 'var(--primary)', ...style }} />
            </DelayedRender>
          </div>
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
