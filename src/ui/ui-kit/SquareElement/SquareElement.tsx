import React from 'react';

export function SquareElement({
  render,
  style,
  ...props
}: {
  render: (style: React.CSSProperties) => React.ReactNode;
} & React.HTMLProps<HTMLDivElement>) {
  const supportsAspectRatio = CSS.supports('aspect-ratio: 1 / 1');
  return (
    <div
      style={Object.assign(
        {
          position: 'relative',
          aspectRatio: '1',
          display: 'flex',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style
      )}
      {...props}
    >
      {supportsAspectRatio ? null : (
        <div
          style={{
            pointerEvents: 'none',
            width: '100%',
            paddingBottom: '100%',
          }}
        />
      )}
      {render({
        position: supportsAspectRatio ? undefined : 'absolute',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '1',
        objectFit: 'contain',
      })}
    </div>
  );
}
