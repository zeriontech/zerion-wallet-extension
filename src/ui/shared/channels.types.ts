import type { PortMessageChannel } from 'src/shared/PortMessageChannel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncMethod = (...args: any) => Promise<any>;

export type RPCPort<Implementation> = Omit<PortMessageChannel, 'request'> & {
  request<
    T extends string,
    Method = T extends keyof Implementation
      ? Implementation[T] extends AsyncMethod
        ? Implementation[T]
        : never
      : never
  >(
    method: Method extends AsyncMethod ? T : never,
    ...params: Method extends AsyncMethod
      ? Omit<Parameters<Method>[0], 'context'> extends {
          params: unknown;
        }
        ? [
            params: Omit<Parameters<Method>[0], 'context'>['params'],
            id?: number
          ]
        : [params?: undefined, id?: number]
      : [never]
  ): Method extends AsyncMethod ? ReturnType<Method> : never;
};
