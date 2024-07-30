export enum ViewParam {
  password = 'password',
  hardware = 'hardware',
}

export function assertViewParam(param: string): asserts param is ViewParam {
  if (param in ViewParam === false) {
    throw new Error('Unsupported view parameter');
  }
}
