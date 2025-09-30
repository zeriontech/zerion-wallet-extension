import React, { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import type { PublicUser } from 'src/shared/types/User';
import TouchIdIcon from 'jsx:src/ui/assets/touch-id.svg';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useNavigationType } from 'react-router-dom';
import { getPasswordWithPasskey } from './passkey';
import * as styles from './styles.module.css';

export function TouchIdLogin({
  user,
  onSuccess,
  style,
}: {
  user: PublicUser;
  onSuccess: () => void;
  style?: React.CSSProperties;
}) {
  const defaultValueQuery = useQuery({
    queryKey: ['account/getPasskeyEnabled'],
    queryFn: () => {
      return accountPublicRPCPort.request('getPasskeyEnabled');
    },
    useErrorBoundary: true,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const password = await getPasswordWithPasskey();
      return accountPublicRPCPort.request('login', { user, password });
    },
    onSuccess,
  });

  const passkeyEnabled = defaultValueQuery.data;
  const navigationType = useNavigationType();
  const autologinRef = useRef(false);

  useEffect(() => {
    // Automatically trigger Touch ID login if the user navigated here via a replace action
    // This happens when user is redirected to the login page when opening the extension popup
    const showSuggestTouchId = navigationType === 'REPLACE';
    if (showSuggestTouchId && passkeyEnabled && !autologinRef.current) {
      autologinRef.current = true;
      loginMutation.mutate();
    }
  }, [navigationType, passkeyEnabled, loginMutation]);

  if (!passkeyEnabled) {
    return null;
  }

  return (
    <VStack gap={0} style={{ position: 'relative', ...style }}>
      <UnstyledButton
        type="button"
        autoFocus={true}
        aria-label="Login with Touch ID"
        onClick={() => loginMutation.mutate()}
        className={styles.touchId}
        disabled={loginMutation.isLoading}
        title="Unlock with Touch ID"
      >
        {loginMutation.isLoading ? (
          <CircleSpinner
            size="40px"
            color="var(--primary)"
            trackColor="var(--primary-200)"
          />
        ) : (
          <TouchIdIcon />
        )}
      </UnstyledButton>
      {loginMutation.isLoading ? null : (
        <UIText
          kind="small/regular"
          color="var(--white)"
          className={styles.touchIdPopup}
        >
          Unlock with Touch ID
        </UIText>
      )}
      {loginMutation.error ? (
        <UIText kind="small/regular" color="var(--negative-500)">
          {(loginMutation.error as Error).message || 'unknown error'}
        </UIText>
      ) : null}
    </VStack>
  );
}
