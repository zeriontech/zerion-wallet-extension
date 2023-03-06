export interface ChannelContext {
  origin: string;
  tabId: number;
  chainId?: string;
}

export interface PrivateChannelContext {
  origin: symbol;
  tabId: null;
}
