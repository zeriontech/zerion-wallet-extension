export interface User {
  id: string;
  salt: string;
}

export interface PublicUser {
  id: User['id'];
}
