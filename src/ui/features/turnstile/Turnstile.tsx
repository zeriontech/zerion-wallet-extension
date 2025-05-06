import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { walletPort } from 'src/ui/shared/channels';
import { WebAppMessageHandler } from '../referral-program/WebAppMessageHandler';
import { emitter } from './events';

function TurnstileDialog() {
  const { innerWidth } = useWindowSizeStore();
  const turnstileWidgetHeight = 88;
  const turnstileWidgetWidth = innerWidth - 32;
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    walletPort.request('cloudflareChallengeIssued');
  }, []);

  const handleTurnstileToken = useCallback((params: unknown) => {
    invariant(
      isObj(params) && typeof params.token === 'string',
      'Got invalid payload from set-turnstile-token web app message'
    );
    dialogRef.current?.close();
    queryClient.refetchQueries();
    emitter.emit('turnstileClosed');
  }, []);

  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="fit-content"
      closeOnClickOutside={false}
      containerStyle={{ backgroundColor: 'var(--z-index-0)' }}
    >
      <WebAppMessageHandler
        pathname="/turnstile.html"
        callbackName="set-turnstile-token"
        callbackFn={handleTurnstileToken}
        hidden={false}
        style={{
          width: turnstileWidgetWidth,
          height: turnstileWidgetHeight,
          border: 'none',
          colorScheme: 'auto',
        }}
      />
    </BottomSheetDialog>
  );
}

export function TurnstileTokenHandler() {
  const [showDialog, setShowDialog] = useState(false);
  useEffect(() => {
    return emitter.on('openTurnstile', () => {
      setShowDialog(true);
    });
  }, []);

  useEffect(() => {
    return emitter.on('turnstileClosed', () => {
      setShowDialog(false);
    });
  }, []);

  return showDialog ? <TurnstileDialog /> : null;
}
