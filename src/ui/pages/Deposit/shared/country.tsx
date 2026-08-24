import React from 'react';

const REGIONAL_INDICATOR_OFFSET = 127397; // 0x1F1E6 - 'A'.charCodeAt(0)

function countryCodeToFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => REGIONAL_INDICATOR_OFFSET + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * An ISO 3166-1 alpha-2 code rendered as its flag.
 *
 * Windows ships no glyphs for regional-indicator pairs, so the flag degrades to
 * the two letters of the code there. Every place we show a flag also shows the
 * country's name beside it, so the degraded form reads as a country code rather
 * than as a duplicate of the label (which is why the web app's currency
 * dropdown, where the flag sits next to a ticker, drops it on Windows instead).
 */
export function CountryFlag({
  code,
  size = 24,
}: {
  code: string;
  size?: number;
}) {
  return (
    <span
      role="presentation"
      style={{
        display: 'block',
        // Reserves the emoji's width so rows line up, but does not clip: on
        // Windows the fallback is two letters, which are wider than one flag
        minWidth: size,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {countryCodeToFlagEmoji(code)}
    </span>
  );
}

const regionNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/**
 * The country's English name, for codes we can't look up in
 * `deposit/supported-countries/v1` — precisely the unsupported ones, whose name
 * we still want to say out loud when explaining why the form is blocked.
 */
export function getCountryName(code: string) {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
