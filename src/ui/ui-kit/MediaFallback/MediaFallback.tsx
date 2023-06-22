import React, { useLayoutEffect, useState } from 'react';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;
type VideoProps = React.VideoHTMLAttributes<HTMLVideoElement>;
type AudioProps = React.AudioHTMLAttributes<HTMLAudioElement>;

interface FallbackProps {
  renderError: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
}

function MediaFallback<T extends ImageProps | AudioProps | VideoProps>({
  type,
  renderError,
  renderLoading,
  ...props
}: T & { type: 'img' | 'audio' | 'video' } & FallbackProps) {
  const [loading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { src } = props;

  useLayoutEffect(() => {
    setIsError(false);
    setIsLoading(true);
  }, [src]);

  if (isError) {
    return renderError() as React.ReactElement;
  }
  return (
    <>
      {React.createElement(type, {
        ...props,
        style: {
          ...props.style,
          // to avoid failed state blink
          opacity: loading ? 0 : props.style?.opacity ?? undefined,
        },
        onError: () => {
          setIsError(true);
          setIsLoading(false);
        },
        onLoad: () => setIsLoading(false),
        onLoadedData: () => setIsLoading(false),
      })}
      {loading && renderLoading ? renderLoading() : null}
    </>
  );
}

export const Image = (props: FallbackProps & ImageProps) => (
  <MediaFallback<ImageProps> type="img" {...props} />
);

export const Video = (props: FallbackProps & VideoProps) => (
  <MediaFallback<VideoProps> type="video" {...props} />
);

export const Audio = (props: FallbackProps & AudioProps) => (
  <MediaFallback<AudioProps> type="audio" {...props} />
);
