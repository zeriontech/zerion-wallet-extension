const platforms = ['chrome', 'firefox'] as const;
export type Platform = (typeof platforms)[number];

export function ensureSupportedPlatform(
  platform: string
): asserts platform is Platform {
  if (!platforms.includes(platform as Platform)) {
    throw new Error(`Unsupported PLATFORM: ${platform}`);
  }
}
