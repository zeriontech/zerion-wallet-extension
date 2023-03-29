import * as browserStorage from 'src/background/webapis/storage';

export interface User {
  id: string;
  salt: string;
}

export const currentUserKey = 'currentUser';

export async function getCurrentUser() {
  return browserStorage.get<User>(currentUserKey);
}
