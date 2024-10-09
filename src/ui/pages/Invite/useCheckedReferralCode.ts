import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { invariant } from 'src/shared/invariant';

export function useCheckedReferralCode({
  referralCode,
}: {
  referralCode: string | null;
}) {
  return useQuery({
    queryKey: ['zpi/checkReferralCode', referralCode],
    queryFn: async () => {
      invariant(referralCode, 'referralCode should be defined');
      try {
        await ZerionAPI.checkReferral({ referralCode });
        return referralCode;
      } catch (error) {
        return null;
      }
    },
    enabled: Boolean(referralCode),
    refetchOnWindowFocus: false,
  });
}
