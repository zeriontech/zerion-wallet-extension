const LENS_API_URL = 'https://api.lens.dev/';

interface LensProfile {
  id: string;
  handle: string;
  ownedBy: string;
}

interface LensResponse {
  data?: { profiles?: { items?: LensProfile[] } };
}

async function getLensProfilesByAddress(
  address: string
): Promise<LensProfile[] | null> {
  const rawResponse = await fetch(LENS_API_URL, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query:
        'query ($request: ProfileQueryRequest!) {\n  profiles(request: $request) {\n    items {\n      id\n      handle\n      ownedBy\n      __typename\n    }\n    __typename\n  }\n}',
      variables: { request: { ownedBy: address } },
    }),
  });

  const response: LensResponse = await rawResponse.json();
  return response.data?.profiles?.items || null;
}

export async function lensLookup(address: string): Promise<string | null> {
  const profiles = await getLensProfilesByAddress(address);
  return profiles?.[0]?.handle || null;
}
