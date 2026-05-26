import { pushUnique, removeFromArray } from 'src/shared/array-mutations';
import type { RuntimePort } from '../webapis/RuntimePort';

export type PortMessageHandler = (
  port: RuntimePort,
  msg: unknown
) => void | boolean;

export class PortRegistry {
  private ports: RuntimePort[];
  private handlers: PortMessageHandler[];
  // Messages that arrive before any handler is registered are buffered here.
  // Without this, requests sent by content scripts while the background
  // service worker is still running `initialize()` (handlers are pushed in
  // its `.then` callback) hit an empty handler array and are silently
  // dropped, leaving the dapp to wait until its own RPC timeout fires.
  private queued: Array<[RuntimePort, unknown]>;
  private drainScheduled: boolean;
  listener: (msg: unknown, port: RuntimePort) => void;
  private listeners: {
    onDisconnect: Set<(port: RuntimePort) => void>;
  };

  constructor() {
    this.ports = [];
    this.handlers = [];
    this.queued = [];
    this.drainScheduled = false;

    this.listener = (msg: unknown, port: RuntimePort) => {
      if (this.handlers.length === 0) {
        this.queued.push([port, msg]);
        return;
      }
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
    if (this.queued.length && !this.drainScheduled) {
      this.drainScheduled = true;
      // Defer to a microtask so that any sibling `addMessageHandler` calls
      // running in the same synchronous block (e.g. the post-`initialize`
      // setup in src/background/index.ts) finish registering before the
      // queued messages are replayed against the listener chain.
      queueMicrotask(() => {
        this.drainScheduled = false;
        const queued = this.queued;
        this.queued = [];
        for (const [port, msg] of queued) {
          // Skip messages whose port has disconnected during init.
          if (this.ports.includes(port)) {
            this.listener(msg, port);
          }
        }
      });
    }
  }

  postMessage<T>({ portName, message }: { portName: string; message: T }) {
    const port = this.ports.find((port) => port.name === portName);
    if (port) {
      port.postMessage(message);
    }
  }
}
