import { postInfo } from '../postInfo';

export interface PerpApprovedBuildersPayload {
  address: string;
}

/**
 * Hyperliquid returns an array of approved builder addresses. Fee values are
 * read separately with `maxBuilderFee` per builder.
 */
export async function perpApprovedBuilders(
  payload: PerpApprovedBuildersPayload,
): Promise<string[] | null> {
  const response = await postInfo<unknown>({
    type: 'approvedBuilders',
    user: payload.address,
  });
  if (!Array.isArray(response)) return null;
  return response.filter((item): item is string => typeof item === 'string');
}
