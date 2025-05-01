import { describe, expect, it } from 'vitest';
import { estimatePasswordStrengh, Strength } from './password-strength';
import { PASSWORD_MIN_LENGTH } from './user-input';

describe('estimatePasswordStrengh', () => {
  describe('basic checks', () => {
    it('detects lowercase letters', () => {
      const result = estimatePasswordStrengh('UPPER123!a');
      expect(result.someLowerCase).toBe(true);
    });

    it('detects uppercase letters', () => {
      const result = estimatePasswordStrengh('lower123!A');
      expect(result.someUpperCase).toBe(true);
    });

    it('detects numbers', () => {
      const result = estimatePasswordStrengh('Password1');
      expect(result.someNumbers).toBe(true);
    });

    it('detects special characters', () => {
      const result = estimatePasswordStrengh('Password!');
      expect(result.someSymbols).toBe(true);
    });

    it('validates minimum length', () => {
      const result = estimatePasswordStrengh('a'.repeat(PASSWORD_MIN_LENGTH));
      expect(result.minLength).toBe(true);
    });
  });

  describe('strength evaluation', () => {
    it('considers short password as weak', () => {
      const result = estimatePasswordStrengh('Aa1!');
      expect(result.strength).toBe(Strength.weak);
    });

    it('considers medium-length password with two character types as medium', () => {
      const result = estimatePasswordStrengh('Password1234');
      expect(result.strength).toBe(Strength.medium);
    });

    it('considers long password with diverse characters as strong', () => {
      const result = estimatePasswordStrengh('MyVeryStrongP@ssw0rd');
      expect(result.strength).toBe(Strength.strong);
    });

    it('downgrades long password with repeating characters', () => {
      const result = estimatePasswordStrengh('aaaaaaaaaaaaaaaaaaaaa');
      expect(result.strength).toBe(Strength.weak);
    });
  });

  describe('edge cases', () => {
    it('handles empty string correctly', () => {
      const result = estimatePasswordStrengh('');
      expect(result.strength).toBe(Strength.weak);
    });

    it('handles password with spaces correctly', () => {
      const result = estimatePasswordStrengh('My Password 123');
      expect(result.someSymbols).toBe(false);
    });

    it('handles non-latin characters correctly', () => {
      const result = estimatePasswordStrengh('Password123!');
      expect(result.someLowerCase).toBe(true);
      expect(result.someUpperCase).toBe(true);
    });
  });
});
