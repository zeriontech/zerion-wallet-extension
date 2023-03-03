import { PROXY_URL } from 'src/env/config';

const UNSTOPPABLE_DOMAINS_PROXY_URL = `${PROXY_URL}unstoppable-domains/`;

interface UnstoppableDomainsResponse {
  meta: {
    domain: string;
    owner: string;
  };
}

export async function udLookup(address: string): Promise<string | null> {
  try {
    const rawResonse = await fetch(
      `${UNSTOPPABLE_DOMAINS_PROXY_URL}reverse/${address}`,
      { method: 'get' }
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
      `${UNSTOPPABLE_DOMAINS_PROXY_URL}domains/${domain}`,
      { method: 'get' }
    );
    const response: UnstoppableDomainsResponse = await rawResonse.json();
    return response.meta.owner || null;
  } catch {
    return null;
  }
}
