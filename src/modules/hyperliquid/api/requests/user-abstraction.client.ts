import { postInfo } from '../postInfo';
import {
  parseAbstractionMode,
  type AbstractionMode,
  type UserAbstractionPayload,
} from './user-abstraction.types';

export async function userAbstraction(
  payload: UserAbstractionPayload
): Promise<AbstractionMode | null> {
  const response = await postInfo<unknown>({
    type: 'userAbstraction',
    user: payload.address,
  });
  if (response === null) return null;
  return parseAbstractionMode(response);
}
