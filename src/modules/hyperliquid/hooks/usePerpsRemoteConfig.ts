import { useQuery } from '@tanstack/react-query';
import ky from 'ky';
import { PROXY_URL } from 'src/env/config';

export interface HyperliquidPerpsConfig {
  builderAddress: string;
  builderFee: number;
  builderFeePremium: number;
  referralCode: string;
  maxApproveBuilderFee: string;
  maxApproveBuilderFeeInteger: number;
  withdrawalFeeUsd: number;
  minimumPositionSizeUsd: number;
  supportedCollateralTokens: number[];
  supportedDexes: string[];
  tokenizedAssetDexes: string[];
}

interface RemoteConfigResponse {
  hyperliquid_perps_config?: HyperliquidPerpsConfig;
}

async function fetchHyperliquidPerpsConfig(): Promise<
  HyperliquidPerpsConfig | undefined
> {
  const response = await ky
    .get(new URL('remote-config?key=hyperliquid_perps_config', PROXY_URL), {
      timeout: 30000,
      retry: 2,
    })
    .json<RemoteConfigResponse>();
  return response.hyperliquid_perps_config;
}

export function usePerpsRemoteConfig() {
  return useQuery({
    queryKey: ['perps/remote-config/hyperliquid_perps_config'],
    queryFn: fetchHyperliquidPerpsConfig,
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 20_000,
  });
}
