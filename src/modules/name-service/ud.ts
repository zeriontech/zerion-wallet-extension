// const UNSTOPPABLE_DOMAINS_PROXY_URL =
//   'https://proxy.zerion.io/unstoppable-domains/';

const UNSTOPPABLE_DOMAINS_PROXY_URL =
  'http://localhost:8080/unstoppable-domains/';

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
    return response.meta.domain;
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
    return response.meta.owner;
  } catch {
    return null;
  }
}
