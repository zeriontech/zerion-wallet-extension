import { getError } from 'src/shared/errors/getErrorBase';
import { parseError } from './parseError';
import { samples } from './samples';

describe('parseError', () => {
  test('correctly parses known error messages', () => {
    for (const sample of samples) {
      if (sample.expected) {
        expect(parseError(getError(sample.value)).display).toBe(sample.expected);
      }
    }
  });
});
