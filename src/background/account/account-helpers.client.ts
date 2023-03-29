import * as browserStorage from 'src/background/webapis/storage';
import { currentUserKey, User } from 'src/shared/getCurrentUser';

export async function getUserId() {
  const user = await browserStorage.get<User>(currentUserKey);
  return user?.id;
}
