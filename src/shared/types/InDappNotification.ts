export type InDappNotification =
  | {
      notificationEvent: 'chainChanged';
      networkName: string;
      networkIcon: string;
    }
  | {
      notificationEvent: 'switchChainError';
      chainId: string;
    };
