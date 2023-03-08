import { PROXY_URL } from 'src/env/config';

interface UnstoppableDomainsResponse {
  meta: {
    domain: string;
    owner: string;
  };
}

export async function udLookup(address: string): Promise<string | null> {
  try {
    const rawResonse = await fetch(
      new URL(`unstoppable-domains/reverse/${address}`, PROXY_URL),
      {
        method: 'get',
      }
    );
    const response: UnstoppableDomainsResponse = await rawResonse.json();
    return response.meta.domain || null;
  } catch {
    return null;
  }
}

export async function udResolve(domain: string): Promise<string | null> {
  try {
    const rawResonse = await fetch(
      new URL(`unstoppable-domains/domains/${domain}`, PROXY_URL),
      {
        method: 'get',
      }
    );
    const response: UnstoppableDomainsResponse = await rawResonse.json();
    return response.meta.owner || null;
  } catch {
    return null;
  }
}
