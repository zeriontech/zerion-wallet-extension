import React, { useCallback, useEffect, useRef, useState } from 'react';
import browser from 'webextension-polyfill';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { walletPort } from 'src/ui/shared/channels';
import { isCloudflareChallengeMessage, isSecurityCheckUrl } from 'src/shared/cloudflareChallenge';
import { TurnstileFrame } from './TurnstileFrame';
import { getChallengeState, notifyChallengeDismissed, notifyChallengeSolved } from './helpers';
import { emitter } from './events';

function TurnstileDialog() {
  const { innerWidth } = useWindowSizeStore();
  const turnstileWidgetHeight = 88;
  const turnstileWidgetWidth = innerWidth - 32;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const solvedRef = useRef(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleTurnstileToken = useCallback(() => {
    solvedRef.current = true;
    dialogRef.current?.close();
    notifyChallengeSolved('sheet');
    queryClient.refetchQueries();
    emitter.emit('turnstileClosed');
  }, []);

  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="fit-content"
      closeOnClickOutside={false}
      onClosed={() => {
        if (!solvedRef.current) {
          notifyChallengeDismissed('sheet');
        }
      }}
      containerStyle={{ backgroundColor: 'var(--z-index-0)' }}
    >
      <TurnstileFrame
        onToken={handleTurnstileToken}
        width={turnstileWidgetWidth}
        height={turnstileWidgetHeight}
        style={{ maxWidth: 'calc(var(--sheet-dialog-max-width) - 32px)' }}
        autoFocus={true}
      />
    </BottomSheetDialog>
  );
}

export function TurnstileTokenHandler() {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    return emitter.on('openTurnstile', () => {
      setShowDialog(true);
      void walletPort.request('trackUiEvent', {
        name: 'cloudflareChallengeIssued',
        data: { source: 'ui', surface: 'sheet' },
      });
    });
  }, []);

  useEffect(() => {
    const listener = (message: unknown) => {
      if (isCloudflareChallengeMessage(message) && message.action === 'show-sheet') {
        setShowDialog(true);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    // Recovers from two cases: the page was dismissed while no UI was open
    // (the sheet is the way back in once the popup opens), or the show-sheet
    // message arrived before this UI finished mounting.
    if (isSecurityCheckUrl(window.location.href)) return;
    void getChallengeState().then((state) => {
      const pageAlreadyShowsIt = state?.surface === 'page' && !state.dismissed;
      if (state?.pending && !pageAlreadyShowsIt) {
        setShowDialog(true);
      }
    });
  }, []);

  useEffect(() => {
    return emitter.on('turnstileClosed', () => {
      setShowDialog(false);
    });
  }, []);

  return showDialog ? <TurnstileDialog /> : null;
}
