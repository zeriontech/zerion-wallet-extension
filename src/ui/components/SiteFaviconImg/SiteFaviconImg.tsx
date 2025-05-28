import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import { DappIconFetcher } from 'src/ui/components/DappIconFetcher';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DelayedRender } from '../DelayedRender';

type Props = {
  url: string;
  size: number | string;
  style?: React.CSSProperties;
};

function FallbackIcon({ url, size, style }: Props) {
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
      <UIText kind="headline/h1" color="var(--always-white)">
        {siteNamePreview}
      </UIText>
    </div>
  ) : (
    <GlobeIcon style={{ color: 'var(--primary)', ...style }} />
  );
}

export function SiteFaviconImg({
  url,
  size,
  style: styleProp,
  ...imgProps
}: Props & React.ImgHTMLAttributes<HTMLImageElement>) {
  const style = { width: size, height: size, ...styleProp };
  return (
    <DappIconFetcher
      url={url}
      render={(src) =>
        src == null ? (
          <div style={{ width: size, height: size }}>
            <DelayedRender>
              <FallbackIcon size={size} url={url} style={styleProp} />
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
                  <FallbackIcon size={size} url={url} style={styleProp} />
                )}
              />
            )}
          />
        )
      }
    />
  );
}
