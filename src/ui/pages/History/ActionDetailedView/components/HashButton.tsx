import React, { useCallback } from 'react';
import { animated, useSpring } from 'react-spring';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { useHoverAnimation } from 'src/ui/shared/useHoverAnimation';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import SuccessIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import * as helperStyles from 'src/ui/style/helpers.module.css';

const ICON_SIZE = 20;

export function HashButton({ hash }: { hash: string }) {
  const { isBooped, handleMouseEnter } = useHoverAnimation(150);
  const { isBooped: isSuccessBooped, handleMouseEnter: handleCopyClick } =
    useHoverAnimation(150);
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: hash });

  const successIconStyle = useSpring({
    display: 'flex',
    transform: isSuccessBooped ? 'scale(1.2)' : 'scale(1)',
    config: { tension: 300, friction: 15 },
  });

  const iconStyle = useSpring({
    display: 'flex',
    x: isBooped ? 5 : 0,
    config: { tension: 300, friction: 15 },
  });

  const handleClick = useCallback(() => {
    handleCopy();
    handleCopyClick();
  }, [handleCopy, handleCopyClick]);

  return (
    <UnstyledButton
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={helperStyles.hoverUnderline}
      style={{
        justifySelf: 'end',
        color: isSuccess ? 'var(--positive-500)' : 'var(--primary)',
      }}
    >
      <HStack gap={4} alignItems="center">
        <UIText kind="small/accent">Hash</UIText>
        {isSuccess ? (
          <animated.div style={successIconStyle}>
            <SuccessIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        ) : (
          <animated.div style={iconStyle}>
            <CopyIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        )}
      </HStack>
    </UnstyledButton>
  );
}
