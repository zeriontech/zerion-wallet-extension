export type PartiallyRequired<T, K extends keyof T> = {
  [P in keyof T]?: T[P];
} & {
  [P in K]: T[P];
};
