export type ResponseBody<T> = {
  data: T;
  errors?: { title: string; detail: string }[];
};
