import { PASSWORD_MIN_LENGTH } from './user-input';

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
        /\d/.test(char) === false &&
        char !== ' ' &&
        char.toLowerCase() === char.toUpperCase()
    );
}

function hasNumbers(s: string) {
  return /\d/.test(s);
}

export interface StrengthStats {
  minLength: boolean;
  someLowerCase: boolean;
  someUpperCase: boolean;
  someSymbols: boolean;
  someNumbers: boolean;
  strength: Strength;
  length: number;
}

const SHORT = 10;
const MEDIUM = 14;
const LONG = 20;

export function estimatePasswordStrengh(value: string): StrengthStats {
  const someLowerCase = hasLowerCase(value);
  const someUpperCase = hasUpperCase(value);
  const someSymbols = hasNonAlphanumeric(value);
  const someNumbers = hasNumbers(value);
  const score =
    Number(someLowerCase && someUpperCase) +
    Number(someSymbols) +
    Number(someNumbers);
  const minLength = value.length >= PASSWORD_MIN_LENGTH;
  const stats = {
    someLowerCase,
    someUpperCase,
    someSymbols,
    someNumbers,
    minLength,
    length: value.length,
  };
  const uniqueChars = new Set(value);
  if (value.length < SHORT) {
    return { strength: Strength.weak, ...stats };
  } else if (value.length < MEDIUM) {
    const strength = score >= 2 ? Strength.medium : Strength.weak;
    return { strength, ...stats };
  } else if (value.length < LONG) {
    const strength = score >= 2 ? Strength.strong : Strength.medium;
    return { strength, ...stats };
  } else {
    const strength =
      uniqueChars.size < 5
        ? Strength.weak
        : uniqueChars.size < 8
        ? Strength.medium
        : Strength.strong;
    return { strength, ...stats };
  }
}
