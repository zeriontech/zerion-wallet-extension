import { useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { isRpcRequest, isRpcResponse } from 'src/shared/custom-rpc';
import { openUrl } from 'src/ui/shared/openUrl';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { isAllowedMessage } from 'src/ui/pages/HardwareWalletConnection/shared/isAllowedMessage';
import {
  setLedgerIframeController,
  type LedgerIframeController,
  type LedgerSignParams,
} from './handle';

interface UseLedgerIframeControllerOptions {
  /** Open the troubleshooting dialog (notConnected / interactionRequested). */
  onShowTroubleshooting: () => void;
  /** Close the troubleshooting dialog (success/resume/error/cancel). */
  onHideTroubleshooting: () => void;
}

/**
 * Owns the Ledger iframe message-handling, dialog show/hide rules, and
 * dynamic param push (bluetooth from global preferences). Used both by the
 * legacy `<HardwareSignTransaction />` button and by the new
 * `<TransactionSigner />` host.
 *
 * Single-consumer: registers itself in a module singleton so the queue runner
 * (in TransactionSigner) can grab the iframe contentWindow + push sign params
 * imperatively. The iframe itself is mounted by the consumer.
 */
export function useLedgerIframeController({
  onShowTroubleshooting,
  onHideTroubleshooting,
}: UseLedgerIframeControllerOptions): {
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
} {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const showRef = useRef(onShowTroubleshooting);
  const hideRef = useRef(onHideTroubleshooting);
  showRef.current = onShowTroubleshooting;
  hideRef.current = onHideTroubleshooting;

  // Global preferences (bluetooth toggle).
  const { globalPreferences } = useGlobalPreferences();
  const bluetoothSupportEnabled = Boolean(
    globalPreferences?.bluetoothSupportEnabled
  );

  // Keep last-known params in a ref so the registered controller can re-emit
  // on demand without a re-render dependency.
  const paramsRef = useRef<LedgerSignParams>({
    supportBluetooth: bluetoothSupportEnabled,
  });

  const postSignParams = useCallback((partial: LedgerSignParams) => {
    const win = iframeRef.current?.contentWindow;
    paramsRef.current = { ...paramsRef.current, ...partial };
    if (!win) return;
    win.postMessage(
      {
        id: nanoid(),
        method: 'ledger/setSignParams',
        params: paramsRef.current,
      },
      '*'
    );
  }, []);

  // Push bluetooth changes to the iframe whenever global preferences change.
  useEffect(() => {
    postSignParams({ supportBluetooth: bluetoothSupportEnabled });
  }, [bluetoothSupportEnabled, postSignParams]);

  // Register module-singleton controller so the queue runner can talk to the
  // iframe imperatively.
  useEffect(() => {
    const controller: LedgerIframeController = {
      getContentWindow: () => iframeRef.current?.contentWindow ?? null,
      setSignParams: postSignParams,
      cancelInFlight: () => {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        win.postMessage(
          { id: nanoid(), method: 'ledger/sign/cancel', params: {} },
          '*'
        );
      },
    };
    setLedgerIframeController(controller);
    return () => setLedgerIframeController(null);
  }, [postSignParams]);

  // Window-message subscription — drives troubleshooting dialog open/close.
  useEffect(() => {
    function handler(event: MessageEvent) {
      const iframe = iframeRef.current;
      if (!iframe) return;
      invariant(iframe, 'Iframe should be mounted');
      if (!isAllowedMessage(event, iframe)) return;
      // The iframe posts an RpcResponse (`{id, result}` / `{id, error}`) when a
      // sign call settles. The legacy `ledger/sign/success` message is only
      // emitted by the connect-device flow, not by sign success — so without
      // this branch the troubleshooting dialog stays visible after the user
      // confirms on device.
      if (isRpcResponse(event.data)) {
        hideRef.current();
        return;
      }
      if (!isRpcRequest(event.data)) return;
      const { method } = event.data;
      if (
        method === 'ledger/sign/success' ||
        method === 'ledger/sign/resume' ||
        method === 'ledger/sign/error' ||
        method === 'ledger/sign/cancel'
      ) {
        hideRef.current();
      } else if (
        method === 'ledger/sign/notConnected' ||
        method === 'ledger/sign/interactionRequested'
      ) {
        showRef.current();
      } else if (method === 'ledger/sign/openInTab') {
        const url = new URL(window.location.href);
        openUrl(url, { windowType: 'tab' });
        navigate('/');
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigate]);

  return { iframeRef };
}
