import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { invariant } from 'src/shared/invariant';
import { emitter } from 'src/ui/shared/events';
import { isObj } from 'src/shared/isObj';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { WebAppMessageHandler } from '../referral-program/WebAppMessageHandler';

export function TurnstileTokenHandler() {
  const { innerWidth } = useWindowSizeStore();
  const turnstileWidgetHeight = 73;
  const turnstileWidgetWidth = innerWidth - 32;
  const [showDialog, setShowDialog] = useState(false);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  useEffect(() => {
    return emitter.on('openTurnstile', () => {
      setShowDialog(true);
      dialogRef.current?.showModal();
    });
  }, []);

  const handleTurnstileToken = useCallback((params: unknown) => {
    invariant(
      isObj(params) && typeof params.token === 'string',
      'Got invalid payload from set-turnstile-token web app message'
    );
    setShowDialog(false);
    dialogRef.current?.close();
    queryClient.refetchQueries();
  }, []);

  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="fit-content"
      closeOnClickOutside={false}
      containerStyle={{ backgroundColor: 'var(--z-index-0)' }}
    >
      {showDialog ? (
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
      ) : null}
    </BottomSheetDialog>
  );
}
