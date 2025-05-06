import React, { useEffect, useRef, useState } from 'react';
import type { AssetFullInfo } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';

/**
 * Took this component from Web App
 * https://github.com/zeriontech/pulse-frontend/blob/master/src/z/dumb/TextPreview/index.tsx
 */
const TextPreview = ({ text }: { text: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isClamped, setIsClamped] = useState<false | true | undefined>(
    undefined
  );
  // on Safari line-camp works correctly only with inline elements inside
  const paragraphs = text.split(/\r?\n|\r/g);
  const markup: React.ReactNode[] = [];
  paragraphs.forEach((block, index, array) => {
    markup.push(<span key={index}>{block}</span>);
    markup.push(<br key={array.length + index} />);
  });

  useEffect(() => {
    if (ref.current && ref.current.scrollHeight > ref.current.clientHeight) {
      setIsClamped(true);
    }
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <UIText
        as="p"
        kind="body/regular"
        style={
          isClamped ?? true
            ? {
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
              }
            : { wordBreak: 'break-word' }
        }
        ref={ref}
      >
        {markup}
      </UIText>
      {isClamped && (
        <UnstyledButton
          onClick={() => setIsClamped(false)}
          style={{
            color: 'var(--primary)',
            position: 'absolute',
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(90deg, transparent 0%, var(--background) 30%)',
            paddingLeft: 40,
          }}
          className={helperStyles.hoverUnderline}
        >
          <UIText style={{ cursor: 'pointer' }} kind="body/regular">
            See more
          </UIText>
        </UnstyledButton>
      )}
    </div>
  );
};

export function AssetDescription({
  assetFullInfo,
}: {
  assetFullInfo: AssetFullInfo;
}) {
  const hasNoDescription = !assetFullInfo.extra.description;

  if (hasNoDescription) {
    return null;
  }

  return (
    <VStack gap={12}>
      <UIText kind="headline/h3">About {assetFullInfo.fungible.name}</UIText>
      {assetFullInfo.extra.description ? (
        <TextPreview text={assetFullInfo.extra.description} />
      ) : null}
    </VStack>
  );
}
