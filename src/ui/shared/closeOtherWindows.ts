import { formatJsonRpcRequest } from '@json-rpc-tools/utils';
import { windowPort } from './channels';

export function closeOtherWindows() {
  windowPort.port.postMessage(formatJsonRpcRequest('closeCurrentWindow', null));
}
