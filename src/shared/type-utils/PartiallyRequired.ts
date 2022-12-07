export type PartiallyRequired<T, K extends keyof T> = {
  [P in keyof T]?: T[P];
} & Required<{
  [P in K]: T[P];
}>;
