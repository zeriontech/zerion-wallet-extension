export type DnaActionPayload =
  | {
      promoteToken: {
        generation: 'OnePointO';
        id: string;
        signature: string;
      };
    }
  | {
      registerWallet: {
        imported: boolean;
        platform: 'web';
        version: string;
      };
    }
  | {
      signTx: {
        network: string;
        platform: 'web';
        txHash: string;
        version: string;
      };
    };

export interface DnaAction {
  address: string;
  id: string;
  payload: DnaActionPayload;
}
