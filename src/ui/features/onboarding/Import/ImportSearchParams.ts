export enum ViewParam {
  password = 'password',
  secret = 'secret',
  'select-wallets' = 'select-wallets',
}

export function assertViewParam(param: string): asserts param is ViewParam {
  if (param in ViewParam === false) {
    throw new Error('Unsupported view parameter');
  }
}
