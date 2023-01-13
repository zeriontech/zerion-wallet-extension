import type { RpcRequest } from 'src/shared/custom-rpc';
import { windowPort } from './channels';

export function closeOtherWindows() {
  const request: RpcRequest = {
    id: String(Math.random()),
    method: 'closeCurrentWindow',
  };
  windowPort.port?.postMessage(request);
}
