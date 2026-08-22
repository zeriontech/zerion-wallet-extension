/**
 * The three-layer background the web app draws behind loyalty quest cards: a
 * base colour, a radial gradient, and one of four tiled SVG patterns.
 *
 * Ported here for the receive screen, which is the only surface in the
 * extension that uses it. The tiles live on the same CDN path as every other
 * `dna-assets` image we already load, so nothing new has to be allowed.
 */

export type QuestPattern = 0 | 1 | 2 | 3;
export type QuestGradient = 0 | 1 | 2 | 3;

export const QUEST_PATTERN_URLS: Record<QuestPattern, string> = {
  0: 'https://cdn.zerion.io/images/dna-assets/quest-pattern-0.svg',
  1: 'https://cdn.zerion.io/images/dna-assets/quest-pattern-1.svg',
  2: 'https://cdn.zerion.io/images/dna-assets/quest-pattern-2.svg',
  3: 'https://cdn.zerion.io/images/dna-assets/quest-pattern-3.svg',
};

/** Each tile is drawn at its own scale — they are not interchangeable. */
export const QUEST_PATTERN_SIZES: Record<QuestPattern, string> = {
  0: '120px 120px',
  1: '120px 120px',
  2: '100px 100px',
  3: '180px 180px',
};

export const QUEST_GRADIENTS: Record<QuestGradient, string> = {
  0: 'radial-gradient(122% 100% at 50% 0%, #BE20B8 0%, rgba(253, 187, 108, 0.00) 100%)',
  1: 'radial-gradient(122% 100% at 50% 0%, #2962EF 0%, rgba(31, 194, 96, 0.00) 100%)',
  2: 'radial-gradient(122% 100% at 50% 0%, #E58B0B 0%, rgba(219, 58, 72, 0.00) 100%)',
  3: 'radial-gradient(122% 100% at 50% 0%, #01A643 0%, rgba(219, 58, 72, 0.00) 100%)',
};

export const QUEST_BACKGROUND_COLOR = { light: '#f2f7ff', dark: '#29292c' };
export const QUEST_GRADIENT_OPACITY = { light: 0.16, dark: 0.32 };
export const QUEST_PATTERN_OPACITY = { light: 0.06, dark: 0.12 };

/**
 * The `lightgray` under-colour looks like a leftover from the original Figma
 * export, but it does visible work: the tiles are partly transparent, and at
 * 6–12% opacity it is what keeps the pattern from disappearing entirely.
 */
export function getQuestPatternBackground(pattern: QuestPattern) {
  return `url(${QUEST_PATTERN_URLS[pattern]}) lightgray 0% 0% / ${QUEST_PATTERN_SIZES[pattern]} repeat`;
}

/**
 * Quest cards pick their pattern and gradient at random on mount, which is
 * right for a card in a list and wrong for a wallet: a receive screen that
 * changes colour every time you open it can never become recognisable.
 * Deriving both from the address gives every wallet one permanent pair, so the
 * background reads as a second blockie rather than as decoration.
 *
 * Hashing the whole string instead of reading its first and last byte keeps
 * this working for Solana addresses, which aren't hex.
 */
export function getQuestBackgroundForAddress(address: string): {
  pattern: QuestPattern;
  gradient: QuestGradient;
} {
  const normalizedAddress = address.toLowerCase();
  let hash = 2166136261; // FNV-1a 32-bit offset basis
  for (let i = 0; i < normalizedAddress.length; i++) {
    hash ^= normalizedAddress.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash >>>= 0;

  return {
    pattern: (hash % 4) as QuestPattern,
    // A second, independent slice of the same hash — reusing `hash % 4` for
    // both would lock every wallet to a matching pattern/gradient index and
    // collapse the sixteen combinations down to four.
    gradient: ((hash >>> 8) % 4) as QuestGradient,
  };
}
