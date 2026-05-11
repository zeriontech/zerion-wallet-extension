import React, { useState } from 'react';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

interface FallbackProps {
  renderError: () => React.ReactNode;
}

/**
 * Minimal image-with-fallback: renders the <img> immediately and swaps to
 * `renderError()` on load error. Unlike MediaFallback, there is no loading
 * state and no re-mount churn on src change — cached images paint without
 * an extra render cycle. Use this for small iconic images where a loading
 * placeholder isn't needed.
 */
export function Image2({
  renderError,
  onError,
  src,
  ...props
}: FallbackProps & ImageProps) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  if (!src || errorSrc === src) {
    return renderError() as React.ReactElement;
  }

  return (
    <img
      {...props}
      src={src}
      onError={(event) => {
        setErrorSrc(src);
        onError?.(event);
      }}
    />
  );
}
