export interface NetworkSelectDistribution {
  positionsChainsDistribution: Record<string, number>;
  chains: Record<string, unknown>;
  totalValue: number;
}
