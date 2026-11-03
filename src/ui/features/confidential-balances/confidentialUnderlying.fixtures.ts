import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';

/** Web @ 60bd6e501 `confidentialUnderlying.ts`, copied as the expected table: [wrapper address, underlying fungible id] */
export const WEB_BACKEND_SUPPORTED: Array<[string, string]> = [
  [
    '0xe978f22157048e5db8e5d07971376e86671672b2',
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  ],
  [
    '0xae0207c757aa2b4019ad96edd0092ddc63ef0c50',
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
  ],
  [
    '0xda9396b82634ea99243ce51258b6a5ae512d4893',
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  ],
  [
    '0x73cc9af9d6befdb3c3faf8a5e8c05cb95fdaeef1',
    '0x68749665ff8d2d112fa859aa293f07a622782f38',
  ],
  [
    '0x80cb147fd86dc6dee3eee7e4cee33d1397d98071',
    '7f45f75d-4c40-4255-8bce-f449631d1bd4',
  ],
  [
    '0x85de671c3bec1aded752c3cea943521181c826bc',
    'e0eb7374-168a-43dd-afa4-61ba2c8cd396',
  ],
  [
    '0xa873750ccbafd5ec7dd13bfd5237d7129832edd9',
    '97f718aa-29fe-4c05-ad41-712c76f11b28',
  ],
  [
    '0xba4cff6ed6f7cb2a58776deca4e984b498446762',
    'db026117-3c77-4173-8751-18e8c9df7419',
  ],
  [
    '0x66bf74e96900d1a19c7070d939d124f2f565c458',
    '33ff31dd-63ab-4771-875b-a706b0471533',
  ],
];

export const WEB_REGISTRY_ONLY: Array<[string, string]> = [
  [
    '0xea9a15a29dd180c40442142caeefc491d37bfdb2',
    '9a7b798c-12fa-4060-b824-d8b5b1870742',
  ],
  [
    '0x9abb8f3dc2863b1f108ded7ea41902fef6732a8c',
    '2033318b-c287-40e7-997f-c841378dda2f',
  ],
  [
    '0x8900123f7e17709c1d80eda1e611a9503cf1b3df',
    '0x808507121b80c02388fad14726482e061b8da827',
  ],
  [
    '0xd86ae89c089b380f064fe01899b4071f1eb6bb3d',
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  ],
  [
    '0x2ebbd099f66b0ca94dd82b4c06fe3eef6aff853c',
    '672cdb58-e053-4751-bca7-dd6a49f9c2c9',
  ],
  [
    '0x77f8207ee451441336538ba07a2f425780ded8db',
    '3612f83a-3837-48a6-b742-b537d6a6aa39',
  ],
  [
    '0x63a60acc304b84ef829b263f28e7b636bf77d45a',
    '3b40f37b-0746-4f97-bc95-03e4bd70ffc6',
  ],
  [
    '0xbac6dedf2c10d6d381f9dbd9efd69d93ffcef50b',
    'd374bf09-e58b-4e87-9772-ea785843e698',
  ],
  [
    '0xf921a5b0634f4236b21a4e948317abf9a2e86b6f',
    '79a25cd3-a223-4403-b24d-f616bead4bfd',
  ],
  [
    '0x501b014f86a73a7199e00cb31c0e9565ac51e51b',
    '7d21016e-9b13-4300-b680-9e24c6933437',
  ],
  [
    '0x80ae7dbce3c1696d3eed04ec8348c3c432322273',
    '092eb578-dc0e-431e-89e5-e04176d05cfd',
  ],
  [
    '0x76a3f985315aac9789cb5bf8a5bb83bff55fd5a6',
    '7ad45b48-5a36-41ca-a06d-6a20c4852a0e',
  ],
  [
    '0xa28a369df348ac232e4daf7b0ef90280d8707d7f',
    '86015af5-b5db-494b-8828-c81a9fa31b41',
  ],
  [
    '0xb6e5299fc56053dd5440104fd6fd2a3cd064edbc',
    '01514730-d2b9-4519-ab34-aedd6e33a407',
  ],
  [
    '0x4fccf8046fb7fb7ab76321bd39c27453e396b88f',
    '0ffe9382-8768-4f53-8e4d-d7414429a9fc',
  ],
  [
    '0xb1b18ad1f16d744c470cb6b09cb826affcc9eb30',
    'e6de2ad2-44f7-4b4d-b55f-abdf3a9d1db7',
  ],
  [
    '0x1f6a937119c0c34db0a2c4f000386a3bfd4a9e73',
    '1ed308c3-ad0e-4e7d-b253-4221a7e3cdf0',
  ],
];

export function makePosition({
  chainId = 'ethereum',
  fungibleId,
  address,
  quantity = '0',
}: {
  chainId?: string;
  fungibleId: string;
  address: string | null;
  quantity?: string;
}): FungiblePosition {
  return {
    id: `${fungibleId}-${chainId}-asset-asset`,
    amount: { currency: 'usd', quantity, value: null, usdValue: null },
    chain: { id: chainId, name: chainId, iconUrl: '' },
    fungible: {
      id: fungibleId,
      implementations: { [chainId]: { address, decimals: 6 } },
    },
  } as unknown as FungiblePosition;
}
