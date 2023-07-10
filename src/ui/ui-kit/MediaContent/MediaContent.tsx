import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Image, Audio, Video } from 'src/ui/ui-kit/MediaFallback';
import type { MediaContentValue } from 'src/shared/types/MediaContentValue';

export const MediaError = ({
  image = '🖼',
  src,
  style,
}: {
  image?: string;
  src?: string | null;
  style?: React.CSSProperties;
}) => (
  <div
    title="Content failed to load"
    data-src={src}
    style={{
      width: '100%',
      aspectRatio: '1',
      borderRadius: 8,
      backgroundImage: 'linear-gradient(180deg, #faecff 0%, #cbdaff 100%)',
      display: 'grid',
      placeContent: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
      fontSize: 32,
      ...style,
    }}
  >
    <span style={{ lineHeight: 1 }}>{image}</span>
  </div>
);

export function MediaContent({
  content,
  alt,
  style,
  errorStyle,
  renderLoading,
  className,
  forcePreview,
}: {
  content?: MediaContentValue;
  alt: string;
  errorStyle?: React.CSSProperties;
  renderLoading?(): React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  forcePreview?: boolean;
}) {
  if (forcePreview && content?.image_preview_url) {
    return (
      <Image
        // safari doesn't emit img onError for empty string src
        src={content.image_preview_url || 'no-image'}
        alt={alt}
        style={style}
        className={className}
        renderError={() => (
          <MediaError style={errorStyle} src={content.image_preview_url} />
        )}
        renderLoading={renderLoading}
      />
    );
  }
  if (content?.type === 'video' && content?.video_url) {
    return (
      <Video
        key={content.video_url}
        controls={false}
        muted={true}
        autoPlay={true}
        width="100%"
        loop={true}
        playsInline={true}
        style={style}
        className={className}
        renderError={() => (
          <MediaError image="📹" style={errorStyle} src={content.video_url} />
        )}
        renderLoading={renderLoading}
      >
        <source src={content.video_url} />
        Sorry, your browser doesn't support embedded videos.
      </Video>
    );
  }
  if (content?.type === 'audio' && content?.audio_url) {
    return (
      <Audio
        src={content.audio_url || ''}
        controls={true}
        autoPlay={false}
        style={style}
        className={className}
        renderError={() => (
          <MediaError image="🎵" style={errorStyle} src={content.audio_url} />
        )}
        renderLoading={renderLoading}
      />
    );
  }
  if (content?.image_url) {
    return (
      <Image
        // safari doesn't emit img onError for empty string src
        src={content.image_url || 'no-image'}
        alt={alt}
        style={style}
        className={className}
        renderError={() => (
          <MediaError style={errorStyle} src={content.image_url} />
        )}
        renderLoading={renderLoading}
      />
    );
  }
  return (
    <UIText kind="body/regular" className={className}>
      Unsupported content
    </UIText>
  );
}
