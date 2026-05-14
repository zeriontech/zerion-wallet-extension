import { useQuery } from '@tanstack/react-query';
import { perpUserRole } from '../api/requests/perp-user-role.client';
import type { PerpUserRolePayload } from '../api/requests/perp-user-role.types';

export const USER_ROLE_QUERY_KEY = 'hyperliquid/userRole';

export function useUserRole(
  payload: PerpUserRolePayload,
  {
    suspense = false,
    enabled = true,
  }: { suspense?: boolean; enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [USER_ROLE_QUERY_KEY, payload],
    queryFn: () => perpUserRole(payload),
    retry: 0,
    suspense,
    enabled: Boolean(enabled && payload.address),
    staleTime: 60_000,
  });
}
