import browser from 'webextension-polyfill';
import type { Account } from 'src/background/account/Account';
import { emitter } from 'src/background/events';
import type { RuntimePort } from 'src/background/webapis/RuntimePort';
import { payloadId } from '@json-rpc-tools/utils';
import { getProviderInjectionChange } from 'src/background/Wallet/GlobalPreferences';
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
            id: payloadId(),
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
      emitter.on('chainsUpdated', async () => {
        this.getClientPorts().forEach(async (port) => {
          const wallet = this.account.getCurrentWallet();
          const chainId = await wallet.publicEthereumController.eth_chainId({
            context: getPortContext(port),
            id: payloadId(),
          });
          port.postMessage({
            type: 'ethereumEvent',
            event: 'chainChanged',
            value: chainId,
          });
        });
      })
    );

    this.disposers.push(
      emitter.on('connectToSiteEvent', ({ origin }) => {
        this.getClientPorts().forEach((port) => {
          const portUrl = port.sender?.url;
          if (!portUrl) {
            return;
          }
          const portOrigin = new URL(portUrl).origin;
          if (portOrigin === origin) {
            port.postMessage({
              type: 'ethereumEvent',
              event: 'connect',
            });
          }
        });
      })
    );

    this.disposers.push(
      emitter.on('globalPreferencesChange', (state, prevState) => {
        const { paused } = getProviderInjectionChange(state, prevState);
        if (!paused.length) {
          return;
        }
        const pausedOriginsSet = new Set(paused);

        this.getClientPorts().forEach((port) => {
          const portUrl = port.sender?.url;
          if (!portUrl) {
            return;
          }
          const portOrigin = new URL(portUrl).origin;
          if (pausedOriginsSet.has(portOrigin)) {
            port.postMessage({ type: 'walletEvent', event: 'pauseInjection' });
          }
        });
      })
    );
  }

  stopListening() {
    this.cleanup?.();
  }
}
