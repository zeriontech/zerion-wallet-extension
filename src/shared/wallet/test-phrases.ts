/**
 * Public recovery phrases for tests. None of them may ever hold funds:
 * the first is the development phrase of Hardhat and Foundry, the rest are
 * the BIP-39 reference vectors for all-zero, 7f…, 80… and all-one entropy.
 */
function repeat(word: string, count: number) {
  return Array(count).fill(word).join(' ');
}

export const HARDHAT_PHRASE = 'test test test test test test test test test test test junk';

/** Published by Hardhat and Foundry for `HARDHAT_PHRASE`, path m/44'/60'/0'/0/{0,1,2} */
export const HARDHAT_ADDRESSES = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
];

export const TEST_PHRASES: Record<string, string> = {
  'hardhat development phrase': HARDHAT_PHRASE,
  '12 words, entropy 00': `${repeat('abandon', 11)} about`,
  '12 words, entropy 7f':
    'legal winner thank year wave sausage worth useful legal winner thank yellow',
  '12 words, entropy 80':
    'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
  '12 words, entropy ff': `${repeat('zoo', 11)} wrong`,
  '15 words, entropy 00': `${repeat('abandon', 14)} address`,
  '18 words, entropy 00': `${repeat('abandon', 17)} agent`,
  '18 words, entropy 7f':
    'legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal will',
  '18 words, entropy 80':
    'letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter always',
  '18 words, entropy ff': `${repeat('zoo', 17)} when`,
  '21 words, entropy 00': `${repeat('abandon', 20)} admit`,
  '24 words, entropy 00': `${repeat('abandon', 23)} art`,
  '24 words, entropy 7f':
    'legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth title',
  '24 words, entropy 80':
    'letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic bless',
  '24 words, entropy ff': `${repeat('zoo', 23)} vote`,
};
