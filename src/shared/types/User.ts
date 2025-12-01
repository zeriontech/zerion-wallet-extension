export type Passkey = {
  encryptedPassword: string;
  salt: string;
  id: string;
};
export interface User {
  id: string;
  salt: string;
  passkey?: Passkey | null;
}

export interface PublicUser {
  id: User['id'];
}
