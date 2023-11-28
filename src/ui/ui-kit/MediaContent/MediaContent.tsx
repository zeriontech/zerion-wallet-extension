import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Image, Audio, Video } from 'src/ui/ui-kit/MediaFallback';

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

export interface MediaContentValue {
  image_preview_url?: string;
  image_url?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  type: 'video' | 'image' | 'audio';
}

export function MediaContent({
  content,
  alt,
  style,
  errorStyle,
  renderLoading,
  className,
  forcePreview,
  onReady,
}: {
  content?: MediaContentValue;
  alt: string;
  errorStyle?: React.CSSProperties;
  renderLoading?(): React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  forcePreview?: boolean;
  onReady?(): void;
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
        onReady={onReady}
      />
    );
  }
  if (content?.type === 'video' && content?.video_url) {
    return (
      <Video
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
        onReady={onReady}
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
        onReady={onReady}
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
        onReady={onReady}
      />
    );
  }
  return (
    <UIText kind="body/regular" className={className}>
      Unsupported content
    </UIText>
  );
}
