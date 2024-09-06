// eslint-disable-next-line @typescript-eslint/no-namespace
namespace OpaqueSymbols {
  export declare const type: unique symbol;
  export declare const name: unique symbol;
}

export type Opaque<T, Name> = {
  readonly [OpaqueSymbols.type]: T;
  readonly [OpaqueSymbols.name]: Name;
};

export function opaqueType<T extends Opaque<unknown, unknown>>(
  value: T[typeof OpaqueSymbols.type]
) {
  return value as T;
}

export function unwrapOpaqueType<T extends Opaque<unknown, unknown>>(value: T) {
  return value as T[typeof OpaqueSymbols.type];
}
