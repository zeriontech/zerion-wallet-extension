import { useMutation } from '@tanstack/react-query';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { walletPort } from '../channels';

type SignMutationProps = { onSuccess: (value: string) => void };

export function useSignTypedData_v4Mutation({ onSuccess }: SignMutationProps) {
  return useMutation(
    async ({
      typedData,
      initiator,
    }: {
      typedData: TypedData | string;
      initiator: string;
    }) => {
      return await walletPort.request('signTypedData_v4', {
        typedData,
        initiator,
      });
    },
    {
      // onMutate creates a context that we can use in global onError handler
      // to know more about a mutation (in react-query@v4 you should use "context" instead)
      onMutate: () => '_signTypedData',
      onSuccess,
    }
  );
}

export function usePersonalSignMutation({ onSuccess }: SignMutationProps) {
  return useMutation(
    async (params: { params: [string]; initiator: string }) => {
      return await walletPort.request('personalSign', params);
    },
    {
      // onMutate creates a context that we can use in global onError handler
      // to know more about a mutation (in react-query@v4 you should use "context" instead)
      onMutate: () => 'signMessage',
      onSuccess,
    }
  );
}
