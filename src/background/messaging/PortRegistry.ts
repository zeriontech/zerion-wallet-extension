import { pushUnique, removeFromArray } from 'src/shared/array-mutations';
import type { RuntimePort } from '../webapis/RuntimePort';

export type PortMessageHandler = (
  port: RuntimePort,
  msg: unknown
) => void | boolean;

export class PortRegistry {
  private ports: RuntimePort[];
  private handlers: PortMessageHandler[];
  listener: (msg: unknown, port: RuntimePort) => void;
  private listeners: {
    onDisconnect: Set<(port: RuntimePort) => void>;
  };

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

    this.listeners = {
      onDisconnect: new Set(),
    };
  }

  addListener(event: 'disconnect', listener: (port: RuntimePort) => void) {
    if (event === 'disconnect') {
      this.listeners.onDisconnect.add(listener);
      return () => {
        this.listeners.onDisconnect.delete(listener);
      };
    } else {
      throw new Error('Unsupported event');
    }
  }

  register(port: RuntimePort) {
    pushUnique(this.ports, port);
    port.onMessage.addListener(this.listener);

    const disconnectHandler = () => {
      port.onMessage.removeListener(this.listener);
      for (const eventListener of this.listeners.onDisconnect) {
        eventListener(port);
      }
      this.unregister(port);
      port.onDisconnect.removeListener(disconnectHandler);
    };
    port.onDisconnect.addListener(disconnectHandler);
  }

  unregister(port: RuntimePort) {
    removeFromArray(this.ports, port);
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
