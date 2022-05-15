import type { Account } from 'src/background/account/Account';
import { emitter } from 'src/background/events';

interface Listener {
  startListening(): void;
  stopListening(): void;
}

type PortsGetter = () => Array<chrome.runtime.Port>;

export class EthereumEventsBroadcaster implements Listener {
  account: Account;
  getActivePorts: PortsGetter;
  private disposers: Array<() => void>;

  constructor({
    account,
    getActivePorts,
  }: {
    account: Account;
    getActivePorts: PortsGetter;
  }) {
    this.account = account;
    this.getActivePorts = getActivePorts;
    this.disposers = [];
  }

  cleanup() {
    this.disposers.forEach((cb) => cb());
    this.disposers = [];
  }

  private getClientPorts() {
    const ports = this.getActivePorts();
    return ports.filter(
      (port) => port.name === `${chrome.runtime.id}/ethereum`
    );
  }

  startListening() {
    this.disposers.push(
      emitter.on('accountsChanged', () => {
        this.getClientPorts().forEach(async (port) => {
          const wallet = this.account.getCurrentWallet();
          const accounts = await wallet.eth_accounts({
            context: {
              origin: port.sender?.origin,
              tabId: port.sender?.tab?.id,
            },
          });
          port.postMessage({
            type: 'ethereumEvent',
            event: 'accountsChanged',
            value: accounts,
          });
        });
      })
    );

    this.disposers.push(
      emitter.on('chainChanged', async (chainId) => {
        this.getClientPorts().forEach((port) => {
          port.postMessage({
            type: 'ethereumEvent',
            event: 'chainChanged',
            value: chainId,
          });
        });
      })
    );
  }

  stopListening() {
    this.cleanup?.();
  }
}
