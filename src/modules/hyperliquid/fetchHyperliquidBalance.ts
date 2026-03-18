const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

interface ClearinghouseState {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  withdrawable: string;
}

export async function fetchHyperliquidBalance(
  address: string
): Promise<number | null> {
  const response = await fetch(HYPERLIQUID_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'clearinghouseState', user: address }),
  });
  if (!response.ok) {
    return null;
  }
  const data: ClearinghouseState = await response.json();
  const accountValue = Number(data.marginSummary.accountValue);
  return accountValue > 0 ? accountValue : null;
}
