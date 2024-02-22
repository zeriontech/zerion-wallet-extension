export interface Payload {
  addressses: string[];
}

export interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}
