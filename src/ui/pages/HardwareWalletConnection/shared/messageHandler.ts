import { createNanoEvents } from 'nanoevents';
import type { RpcRequest } from 'src/shared/custom-rpc';
import { isRpcResponse, isRpcResult } from 'src/shared/custom-rpc';

class MessageHandler {
  emitter = createNanoEvents<{
    message: (msg: unknown) => void;
    postMessage: (msg: RpcRequest) => void;
  }>();

  constructor() {
    window.addEventListener('message', this.handleMessage);
  }

  handleMessage = (event: MessageEvent) => {
    this.emitter.emit('message', event.data);
  };

  destroy() {
    window.removeEventListener('message', this.handleMessage);
  }

  request<T>(request: RpcRequest, contentWindow: Window): Promise<T> {
    const { id } = request;
    contentWindow.postMessage(request, '*');
    return new Promise((resolve, reject) => {
      const unlisten = this.emitter.on('message', (msg) => {
        if (isRpcResponse(msg)) {
          if (id === msg.id) {
            if (isRpcResult(msg)) {
              resolve(msg.result as T);
            } else {
              reject(msg.error);
            }
            unlisten();
          }
        }
      });
    });
  }
}

export const hardwareMessageHandler = new MessageHandler();
