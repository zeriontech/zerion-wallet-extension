export interface Payload {
  addresses: string[];
  chain: string;
}

export interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}
