export class UserRejected extends Error {
  code = -32010;

  constructor(message: string) {
    super(message);
  }
}
