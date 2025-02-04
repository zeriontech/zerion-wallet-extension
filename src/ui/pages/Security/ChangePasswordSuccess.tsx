import React from 'react';
import { animated, useTrail } from '@react-spring/web';
import { useNavigate } from 'react-router-dom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import CheckIcon from 'jsx:src/ui/assets/check-circle-thin.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PageBottom } from 'src/ui/components/PageBottom';
import { focusNode } from 'src/ui/shared/focusNode';

export function ChangePasswordSuccess() {
  const navigate = useNavigate();
  const trail = useTrail(3, {
    config: { tension: 400 },
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
  });
  return (
    <PageColumn>
      <NavigationTitle urlBar="none" title="Password Changed" />
      <Spacer height={64} />
      <animated.div style={trail[0]}>
        <CheckIcon
          style={{
            display: 'block',
            marginInline: 'auto',
            width: 72,
            height: 72,
            color: 'var(--primary-500)',
          }}
        />
      </animated.div>
      <Spacer height={32} />
      <animated.div style={trail[1]}>
        <UIText kind="headline/h1" style={{ textAlign: 'center' }}>
          Password Changed
        </UIText>
      </animated.div>
      <animated.div style={trail[2]}>
        <UIText kind="small/regular" style={{ textAlign: 'center' }}>
          All your wallet data has been re-encrypted with the new password
        </UIText>
      </animated.div>
      <PageBottom />
      <VStack gap={16} style={{ marginTop: 'auto', textAlign: 'center' }}>
        <Button
          ref={focusNode}
          style={{ marginTop: 'auto' }}
          onClick={() => navigate(-2)}
        >
          Done
        </Button>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
