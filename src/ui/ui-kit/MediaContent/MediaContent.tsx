import React, { useMemo } from 'react';
import { isChromeBrowser } from 'src/ui/shared/isChromeBrowser';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Image, Audio, Video } from 'src/ui/ui-kit/MediaFallback';

interface MediaDescription {
  url: string | null;
  meta: null | Record<string, string>;
}

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

interface MimeType {
  type: string;
  subtype: string;
  mimeType: string;
}

const isChrome = isChromeBrowser();

function normalizeMimeType(type: string) {
  if (isChrome) {
    // Looks like a bug in Google Chrome:
    // https://secure.phabricator.com/T13135
    return type === 'video/quicktime' ? 'video/mp4' : type;
  }
  return type;
}

function inferMediaType(content: MediaDescription): MimeType | null {
  const { url, meta } = content;
  if (meta && meta.type) {
    const normalizedType = normalizeMimeType(meta.type);
    const parts = normalizedType.split('/');
    if (parts.length > 1) {
      const [type, subtype] = parts;
      return { type, subtype, mimeType: normalizedType };
    }
  }
  if (!url) {
    return null;
  }
  const match = url.match(/\.([^.]+)$/);
  if (!match) {
    return null;
  }
  const extension = match[1];
  const supportedExtentions = {
    mp4: 'video',
    mov: 'video',
    mp3: 'audio',
    jpg: 'image',
    gif: 'image',
  };
  const type =
    supportedExtentions[extension as keyof typeof supportedExtentions] || null;
  return type
    ? { type, subtype: extension, mimeType: `${type}/${extension}` }
    : null;
}

export function MediaContent({
  content,
  alt,
  style,
  errorStyle,
  className,
}: {
  content: MediaDescription;
  alt: string;
  errorStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { url } = content;
  const mimeTypeObject = useMemo(() => inferMediaType(content), [content]);
  if (mimeTypeObject == null || mimeTypeObject.type === 'image') {
    return (
      <Image
        // safari doesn't emit img onError for empty string src
        src={url || 'no-image'}
        alt={alt}
        style={style}
        className={className}
        renderError={() => <MediaError style={errorStyle} src={url} />}
      />
    );
  }
  const { type, mimeType } = mimeTypeObject;
  if (type === 'video') {
    if (!url) {
      return (
        <UIText kind="body/regular" className={className}>
          Unknown video
        </UIText>
      );
    }
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
          <MediaError image="📹" style={errorStyle} src={url} />
        )}
      >
        <source src={url} type={mimeType} />
        Sorry, your browser doesn't support embedded videos.
      </Video>
    );
  }
  if (type === 'audio') {
    return (
      <Audio
        src={url || ''}
        controls={true}
        autoPlay={false}
        style={style}
        className={className}
        renderError={() => (
          <MediaError image="🎵" style={errorStyle} src={url} />
        )}
      />
    );
  }
  return (
    <UIText kind="body/regular" className={className}>
      Unsupported content
    </UIText>
  );
}

export interface MediaContentValue {
  image_preview_url?: string;
  image_url: string;
  audio_url: string;
  video_url: string;
  type: 'video' | 'image' | 'audio';
}

export function ParcedMediaContent({
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
