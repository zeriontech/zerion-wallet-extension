// import { ethers } from 'ethers';
import { Chain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store';
import { BareWallet } from 'src/shared/types/BareWallet';

const testAddress = process.env.TEST_WALLET_ADDRESS as string;
const testWallet: BareWallet = {
  address: testAddress,
  mnemonic: null,
  privateKey: '<privateKey>',
  name: null,
};

export const walletPort = {
  state: {
    chainId: '0x89',
  },

  async request(method: string, ...args: unknown[]) {
    if (method === 'getCurrentWallet') {
      return Promise.resolve(testWallet);
    } else if (method === 'getCurrentAddress') {
      return Promise.resolve(testWallet.address);
    } else if (method === 'signAndSendTransaction') {
      return Promise.resolve({ hash: '0x12345' });
    } else if (method === 'getChainId' || method === 'eth_chainId') {
      return Promise.resolve(this.state.chainId);
    } else if (method === 'switchChain') {
      const networks = await networksStore.load();

      this.state.chainId = networks.getChainId(new Chain(args[0] as string));
      return;
    }
  },
};

export const accountPublicRPCPort = {
  request(method: string) {
    if (method === 'logout') {
      return Promise.resolve().then(() => {
        // eslint-disable-next-line no-console
        console.log('accountPublicRPCPort mock: logout!');
      });
    }
  },
};

export const windowPort = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  confirm(windowId: number, ...args: any[]) {
    // eslint-disable-next-line no-console
    console.log(`windowPort.reject(${windowId}, ${args.join(', ')})`);
  },
  reject(windowId: number) {
    // eslint-disable-next-line no-console
    console.log(`windowPort.reject(${windowId})`);
  },
};

Object.assign(window, { walletPort, accountPublicRPCPort, windowPort });
