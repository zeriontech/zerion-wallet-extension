import { useQuery } from '@tanstack/react-query';
import { isApplePaySupported } from './applePay';

/**
 * Resolved before quotes are requested rather than inside the quote's `queryFn`,
 * so the answer is part of the quote's query key instead of an invisible
 * dependency of it.
 */
export function useApplePaySupported() {
  return useQuery({
    queryKey: ['isApplePaySupported'],
    queryFn: isApplePaySupported,
    staleTime: Infinity,
    suspense: false,
  });
}
