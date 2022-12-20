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
  const shouldConsiderLoadingState = Boolean(renderLoading);
  const [loading, setIsLoading] = useState(
    shouldConsiderLoadingState ? true : false
  );
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
        onError: () => setIsError(true),
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
