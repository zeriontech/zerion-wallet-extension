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
        platform: 'extension';
        version: string;
      };
    }
  | {
      signTx: {
        network: string;
        platform: 'extension';
        txHash: string;
        version: string;
      };
    }
  | { gm: object } // gm: {}
  | {
      claimPerk: {
        extensionBackground: {
          tokenId: string;
          backgroundId: number;
          signature: string;
        };
      };
    };

export interface DnaAction {
  address: string;
  id: string;
  payload: DnaActionPayload;
}
