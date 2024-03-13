interface CustomContext {
  clientScope?: string;
}

export interface ChannelContext {
  origin: string;
  tabId: number;
  metaParams?: CustomContext;
}

export interface PrivateChannelContext {
  origin: symbol;
  tabId: null;
  metaParams?: CustomContext;
}
