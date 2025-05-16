/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PortMessageChannel } from 'src/shared/PortMessageChannel';

/**
 * Extracts only async methods and simplifies signature, i.e.:
 * type X = ExtractChannelMethods<{ fn1(params: { params: { a: string } }): Promise<number> }>
 * Results in:
 * type X = { fn1(params: { a: string } ): Promise<number> }
 */
export type ExtractChannelMethods<T> = {
  [K in keyof T as K extends string
    ? T[K] extends (...args: any[]) => Promise<any>
      ? K
      : never
    : never]: T[K] extends (arg: infer Arg, ...args: any[]) => infer R
    ? Arg extends { params: infer P }
      ? (params: P) => R
      : () => R
    : never;
};

// Helper type to correctly extract parameter types (handles unions in params)
type ExtractParams<T> = T extends (params: infer P) => any ? P : never;

/**
 * Turns methods into an rpc-like "request" signature:
 * type X = RPCApi<{ fn1(params: { a: string } ): Promise<number> }>
 * Results in:
 * type X = { request: (method: 'fn1', params: { a: string }) => Promise<number> }
 */
export type RPCApi<T> = {
  request<K extends keyof T>(
    method: K,
    ...args: T[K] extends () => Promise<any>
      ? []
      : [params: ExtractParams<T[K]>]
  ): T[K] extends (...args: any[]) => Promise<infer R> ? Promise<R> : never;
};

export type RPCPort<Implementation> = Omit<PortMessageChannel, 'request'> &
  RPCApi<ExtractChannelMethods<Implementation>>;
