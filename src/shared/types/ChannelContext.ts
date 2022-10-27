export interface ChannelContext {
  origin: string;
  tabId: number;
}

export interface PrivateChannelContext {
  origin: symbol;
  tabId: null;
}
