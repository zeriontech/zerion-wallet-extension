import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';

export interface GasbackData {
  /** fixed gasback for a particular trade */
  value?: number;
  /** potential gasback for a trade */
  estimation?: number;
}
export function useGasbackEstimation({
  paymasterEligible,
  suppportsSimulations,
  supportsSponsoredTransactions,
}: {
  paymasterEligible: null | boolean;
  suppportsSimulations: boolean;
  supportsSponsoredTransactions: boolean | undefined;
}) {
  const { data, ...query } = useFirebaseConfig(['ios_loyalty_config'], {
    enabled: !paymasterEligible && suppportsSimulations,
  });
  const showGasback =
    suppportsSimulations &&
    (supportsSponsoredTransactions === false || paymasterEligible === false); // Important: explicit checks for `false`
  const estimation = data?.ios_loyalty_config.gasbackValue;
  return {
    data: estimation && showGasback ? ({ estimation } as GasbackData) : null,
    ...query,
  };
}
