/** Makes passed fields required and all others optional (partial) */
export type PartiallyRequired<T, K extends keyof T> = {
  [P in keyof T]?: T[P];
} & Required<{
  [P in K]: NonNullable<T[P]>;
}>;
