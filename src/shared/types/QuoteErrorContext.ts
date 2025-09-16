export type QuoteErrorContext = {
  message: string; // parsed client message
  backendMessage?: string; // raw message from backend
  context: 'Swap' | 'Bridge';
  actionType: 'Trade' | 'Send';
  errorCode?: number; // HTTP status code or custom code
  type: string;
  address: string;
  inputFungibleId: string;
  outputFungibleId: string;
  inputAmount: string;
  inputChain: string | null;
  outputAmount: string | null;
  outputChain: string | null;
  contractType: string | null;
  pathname: string;
  slippage: number | null;
};
