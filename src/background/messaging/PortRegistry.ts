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
  port: chrome.runtime.Port,
  msg: unknown
) => void | boolean;

export class PortRegistry {
  private ports: chrome.runtime.Port[];
  private handlers: PortMessageHandler[];

  constructor() {
    this.ports = [];
    this.handlers = [];
  }

  register(port: chrome.runtime.Port) {
    pushUnique(this.ports, port);
    const listener = (msg: unknown) => {
      for (const handler of this.handlers) {
        const didHandle = handler(port, msg);
        if (didHandle) {
          break;
        }
      }
    };
    port.onMessage.addListener(listener);
    port.onDisconnect.addListener(() => {
      console.log('port disconnected', port.name); // eslint-disable-line no-console
      port.onMessage.removeListener(listener);
      this.unregister(port);
    });
  }

  unregister(port: chrome.runtime.Port) {
    remove(this.ports, port);
  }

  getActivePorts() {
    return this.ports;
  }

  addMessageHandler(handler: PortMessageHandler) {
    this.handlers.push(handler);
  }
}
