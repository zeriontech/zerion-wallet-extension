type VersionableEntity = { version: number };

function ensureVersion<
  PossibleEntry extends VersionableEntity,
  T extends PossibleEntry
>(entry: PossibleEntry, version: number): asserts entry is T {
  // object without version assumed as version: 1
  if (
    (!entry.version && version !== 1) ||
    (entry.version && entry.version !== version)
  ) {
    throw new Error(
      `Unexpected version provided. Expected: ${version}, received: ${entry.version}`
    );
  }
}

function getNextVersion<T extends Partial<VersionableEntity>>(
  entry: T
): T['version'] {
  return (entry.version || 1) + 1;
}

type Arr<N extends number, T extends unknown[] = []> = T['length'] extends N
  ? T
  : Arr<N, [...T, unknown]>;
type Inc<N extends number> = [...Arr<N>, unknown]['length'];
type Dec<N extends number> = Arr<N> extends [unknown, ...infer U]
  ? U['length']
  : never;

export type Upgrades<T extends VersionableEntity> = {
  [Version in T['version'] as Dec<Version> extends T['version']
    ? Version
    : never]: (
    param: Extract<T, { version: Dec<Version> }>
  ) => Extract<T, { version: Version }>;
};

type FinalVersion<T extends VersionableEntity> = Extract<
  T,
  {
    version: keyof {
      [Version in T['version'] as Inc<Version> extends T['version']
        ? never
        : Version]: null;
    };
  }
>;

export function upgradeRecord<PossibleEntry extends VersionableEntity>(
  entry: PossibleEntry,
  upgrades: Upgrades<PossibleEntry>
): FinalVersion<PossibleEntry> {
  let result = entry;
  let nextVersion = getNextVersion(result) as keyof Upgrades<PossibleEntry>;
  while (nextVersion in upgrades) {
    ensureVersion<
      PossibleEntry,
      Extract<PossibleEntry, { version: Dec<typeof nextVersion> }>
    >(result, nextVersion - 1);
    result = upgrades[nextVersion](result);
    nextVersion = getNextVersion(result) as keyof Upgrades<PossibleEntry>;
  }
  return result as FinalVersion<PossibleEntry>;
}
