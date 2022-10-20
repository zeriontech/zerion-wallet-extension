import type { RuntimePort } from '../webapis/RuntimePort';

function pushUnique<T>(arr: T[], item: T) {
  if (!arr.includes(item)) {
    arr.push(item);
  }
}

function remove<T>(arr: T[], item: T) {
  const pos = arr.indexOf(item);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

export type PortMessageHandler = (
  port: RuntimePort,
  msg: unknown
) => void | boolean;

export class PortRegistry {
  private ports: RuntimePort[];
  private handlers: PortMessageHandler[];
  listener: (msg: unknown, port: RuntimePort) => void;

  constructor() {
    this.ports = [];
    this.handlers = [];

    this.listener = (msg: unknown, port: RuntimePort) => {
      for (const handler of this.handlers) {
        const didHandle = handler(port, msg);
        if (didHandle) {
          break;
        }
      }
    };
  }

  register(port: RuntimePort) {
    pushUnique(this.ports, port);
    port.onMessage.addListener(this.listener);

    port.onDisconnect.addListener(() => {
      console.log('port disconnected', port.name); // eslint-disable-line no-console
      port.onMessage.removeListener(this.listener);
      this.unregister(port);
    });
  }

  unregister(port: RuntimePort) {
    remove(this.ports, port);
  }

  getActivePorts() {
    return this.ports;
  }

  addMessageHandler(handler: PortMessageHandler) {
    this.handlers.push(handler);
  }

  postMessage<T>({ portName, message }: { portName: string; message: T }) {
    const port = this.ports.find((port) => port.name === portName);
    if (port) {
      port.postMessage(message);
    }
  }
}
