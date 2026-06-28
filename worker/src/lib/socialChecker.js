const PLATFORMS = ['github', 'x', 'bluesky', 'discord'];
const VARIANTS = [
  { type: 'exact',  suffix: '' },
  { type: 'suffix', suffix: 'hq' },
  { type: 'prefix', suffix: 'official' },
];

// Stub — returns unknown for all handles until real checking is implemented.
export async function checkSocialHandles(word) {
  return PLATFORMS.flatMap(platform =>
    VARIANTS.map(v => ({
      platform,
      handle: v.type === 'prefix' ? `${v.suffix}${word}` : `${word}${v.suffix}`,
      handle_type: v.type,
      status: 'unknown',
      last_checked: Date.now(),
    }))
  );
}
