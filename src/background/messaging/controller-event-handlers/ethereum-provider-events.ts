import browser from 'webextension-polyfill';
import type { Account } from 'src/background/account/Account';
import { emitter } from 'src/background/events';
import type { RuntimePort } from 'src/background/webapis/RuntimePort';
import { getPortContext } from '../getPortContext';

interface Listener {
  startListening(): void;
  stopListening(): void;
}

type PortsGetter = () => Array<RuntimePort>;

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
      (port) => port.name === `${browser.runtime.id}/ethereum`
    );
  }

  startListening() {
    this.disposers.push(
      emitter.on('accountsChanged', () => {
        this.getClientPorts().forEach(async (port) => {
          const wallet = this.account.getCurrentWallet();
          const accounts = await wallet.publicEthereumController.eth_accounts({
            context: getPortContext(port),
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
      emitter.on('chainChanged', async () => {
        this.getClientPorts().forEach(async (port) => {
          const wallet = this.account.getCurrentWallet();
          const chainId = await wallet.publicEthereumController.eth_chainId({
            context: getPortContext(port),
          });
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
