import React, { useEffect, useRef, useState } from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as styles from 'src/ui/style/helpers.module.css';

/**
 * Took this component from Web App
 * https://github.com/zeriontech/pulse-frontend/blob/master/src/z/dumb/TextPreview/index.tsx
 */
export const TextPreview = ({ text }: { text: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isClamped, setIsClamped] = useState<false | true | undefined>(
    undefined
  );
  // on Safari line-camp works correctly only with inline elements inside
  const paragraphs = text.split(/(\r?\n|\r)+/g);
  const markup: React.ReactNode[] = [];
  paragraphs.forEach((block, index, array) => {
    markup.push(<span key={index}>{block}</span>);
    markup.push(<br key={array.length + index} />);
  });

  useEffect(() => {
    if (ref.current) {
      if (ref.current.scrollHeight > ref.current.clientHeight) {
        setIsClamped(true);
      }
    }
  }, []);

  return (
    <div>
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
          style={{ color: 'var(--primary)' }}
          className={styles.hoverUnderline}
        >
          <UIText style={{ cursor: 'pointer' }} kind="body/regular">
            See more
          </UIText>
        </UnstyledButton>
      )}
    </div>
  );
};
