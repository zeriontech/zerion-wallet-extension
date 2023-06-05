import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { accountPublicRPCPort } from 'src/ui/shared/channels';

export function useEraseDataMutation(options: MutateOptions) {
  return useMutation({
    mutationFn: async () => {
      // artificial delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return accountPublicRPCPort.request('eraseAllData');
    },
    ...options,
  });
}
