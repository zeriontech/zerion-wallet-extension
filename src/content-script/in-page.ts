import { EthereumProvider } from 'src/modules/ethereum/provider';
import { Connection } from 'src/modules/ethereum/connection';

declare global {
  interface Window {
    myWalletChannelId: string;
    ethereum?: EthereumProvider;
    zerionWallet?: EthereumProvider;
  }
}

const broadcastChannel = new BroadcastChannel(window.myWalletChannelId);
const connection = new Connection(broadcastChannel);
const provider = new EthereumProvider(connection);
provider.isZerionWallet = true;

provider.connect();

window.ethereum = provider;
window.zerionWallet = provider;
