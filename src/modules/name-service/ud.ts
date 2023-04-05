import { PROXY_URL } from 'src/env/config';

interface UnstoppableDomainsResponse {
  meta: {
    domain: string;
    owner: string;
  };
}

export async function udLookup(address: string): Promise<string | null> {
  const rawResonse = await fetch(
    new URL(`unstoppable-domains/reverse/${address}`, PROXY_URL)
  );
  const response: UnstoppableDomainsResponse = await rawResonse.json();
  return response.meta.domain || null;
}

export async function udResolve(domain: string): Promise<string | null> {
  const rawResonse = await fetch(
    new URL(`unstoppable-domains/domains/${domain}`, PROXY_URL)
  );
  const response: UnstoppableDomainsResponse = await rawResonse.json();
  return response.meta.owner || null;
}
