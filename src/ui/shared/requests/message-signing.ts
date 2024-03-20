import { useMutation } from '@tanstack/react-query';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { MessageContextParams } from 'src/shared/types/SignatureContextParams';
import { walletPort } from 'src/ui/shared/channels';

type SignMutationProps = { onSuccess: (value: string) => void };

export function useSignTypedData_v4Mutation({ onSuccess }: SignMutationProps) {
  return useMutation({
    mutationFn: async ({
      typedData,
      ...messageContextParams
    }: {
      typedData: TypedData | string;
    } & MessageContextParams) => {
      return await walletPort.request('signTypedData_v4', {
        typedData,
        ...messageContextParams,
      });
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    onMutate: () => '_signTypedData',
    onSuccess,
  });
}

export function usePersonalSignMutation({ onSuccess }: SignMutationProps) {
  return useMutation({
    mutationFn: async (params: { params: [string] } & MessageContextParams) => {
      return await walletPort.request('personalSign', params);
    },
    // The value returned by onMutate can be accessed in
    // a global onError handler (src/ui/shared/requests/queryClient.ts)
    // TODO: refactor to just emit error directly from the mutationFn
    onMutate: () => 'signMessage',
    onSuccess,
  });
}
