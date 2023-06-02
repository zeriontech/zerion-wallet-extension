import { useMutation } from '@tanstack/react-query';
import { accountPublicRPCPort } from 'src/ui/shared/channels';

export function useEraseDataMutation<
  T extends Omit<Parameters<typeof useMutation>[1], 'mutationFn'>
>(options: T) {
  return useMutation(async () => {
    // artificial delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return accountPublicRPCPort.request('eraseAllData');
  }, options);
}
