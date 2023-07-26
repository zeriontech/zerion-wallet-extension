import React, { useCallback } from 'react';
import { animated } from '@react-spring/web';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import SuccessIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';

const ICON_SIZE = 20;

export function HashButton({ hash }: { hash: string }) {
  const { style: iconStyle, trigger: hoverTrigger } = useTransformTrigger({
    x: 2,
  });
  const { style: successIconStyle, trigger: successCopyTrigger } =
    useTransformTrigger({ x: 2 });
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: hash });

  const handleClick = useCallback(() => {
    handleCopy();
    successCopyTrigger();
  }, [handleCopy, successCopyTrigger]);

  return (
    <UnstyledButton
      onClick={handleClick}
      onMouseEnter={hoverTrigger}
      className={helperStyles.hoverUnderline}
      style={{
        justifySelf: 'end',
        color: isSuccess ? 'var(--positive-500)' : 'var(--primary)',
      }}
    >
      <HStack gap={4} alignItems="center">
        <UIText kind="small/accent">Hash</UIText>
        {isSuccess ? (
          <animated.div style={{ ...successIconStyle, display: 'flex' }}>
            <SuccessIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        ) : (
          <animated.div style={{ ...iconStyle, display: 'flex' }}>
            <CopyIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </animated.div>
        )}
      </HStack>
    </UnstyledButton>
  );
}
