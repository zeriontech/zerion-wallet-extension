export enum Strength {
  weak,
  medium,
  strong,
}

function hasLowerCase(s: string) {
  // RegExp /\w+/ would only work for latin alphabet
  return s.toLowerCase() !== s;
}

function hasUpperCase(s: string) {
  // RegExp /\w+/ would only work for latin alphabet
  return s.toUpperCase() !== s;
}

function hasNonAlphanumeric(s: string) {
  return s
    .split('')
    .some(
      (char) =>
        /\d/.test(char) === false && char.toLowerCase() === char.toUpperCase()
    );
}

export function estimatePasswordStrengh(value: string): Strength {
  if (value.length > 16) {
    return Strength.strong;
  }
  if (value.length < 6) {
    return Strength.weak;
  }
  const someLowerCase = hasLowerCase(value);
  const someUpperCase = hasUpperCase(value);
  const someSymbols = hasNonAlphanumeric(value);
  const score =
    Number(someLowerCase) + Number(someUpperCase) + Number(someSymbols);
  if (score <= 1) {
    return Strength.weak;
  } else if (value.length < 8) {
    return Strength.medium;
  } else if (score === 2) {
    return value.length < 16 ? Strength.medium : Strength.strong;
  } else if (score >= 3) {
    return value.length < 10 ? Strength.medium : Strength.strong;
  }
  // impossible case
  return Strength.weak;
}
