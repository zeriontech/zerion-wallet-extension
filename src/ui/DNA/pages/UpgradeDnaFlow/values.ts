export type Value =
  | 'self-custodial'
  | 'seek-alpha'
  | 'dont-be-maxi'
  | 'be-invested'
  | 'its-all-on-chain';

export const VALUE_INDEX: Record<Value, number> = {
  'self-custodial': 0,
  'seek-alpha': 1,
  'dont-be-maxi': 2,
  'be-invested': 3,
  'its-all-on-chain': 4,
};

export const VALUE_TEXTS: Record<
  Value,
  { title: string; description: string }
> = {
  'self-custodial': {
    title: 'Self-Custodial Humans',
    description: 'Cherish the freedom of personal responsibility.',
  },
  'seek-alpha': {
    title: 'Seek Alpha',
    description: 'Question the status quo and use creativity to find an edge.',
  },
  'dont-be-maxi': {
    title: "Don't Be a Maxi",
    description:
      'Stay smart, truthful, and confident but never arrogant & short-sighted.',
  },
  'be-invested': {
    title: 'Be Invested',
    description: 'Care about what you do. Care about others around you.',
  },
  'its-all-on-chain': {
    title: "It's All On Chain",
    description:
      'Be true to yourself and to others, and be open & proactive about it.',
  },
};
