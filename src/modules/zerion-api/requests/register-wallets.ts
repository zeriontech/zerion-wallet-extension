export interface Payload {
  addresses: string[];
}

export interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}
