import {
  parseQuoteErrorDetails,
  parseQuoteErrorDetailsFromText,
} from './quoteErrorDetails';

describe('parseQuoteErrorDetails', () => {
  it('reads the first ZPI error entry', () => {
    expect(
      parseQuoteErrorDetails({
        data: null,
        errors: [
          {
            title: 'Bad request',
            detail: 'Unshielding is not supported. Please use ${DAPP}.',
            dappName: 'Zama',
            dappUrl: 'https://app.zama.org/',
          },
        ],
      })
    ).toEqual({
      title: 'Bad request',
      detail: 'Unshielding is not supported. Please use ${DAPP}.',
      dappName: 'Zama',
      dappUrl: 'https://app.zama.org/',
    });
  });

  it('nulls missing and blank fields', () => {
    expect(
      parseQuoteErrorDetails({ errors: [{ title: 'Oops', dappName: '  ' }] })
    ).toEqual({ title: 'Oops', detail: null, dappName: null, dappUrl: null });
  });

  it('returns null without a title or detail', () => {
    expect(parseQuoteErrorDetails({ errors: [{ dappName: 'Zama' }] })).toBe(
      null
    );
    expect(parseQuoteErrorDetails({ errors: [] })).toBe(null);
    expect(parseQuoteErrorDetails({ errors: 'nope' })).toBe(null);
    expect(parseQuoteErrorDetails({ data: null })).toBe(null);
    expect(parseQuoteErrorDetails(null)).toBe(null);
    expect(parseQuoteErrorDetails('text')).toBe(null);
  });
});

describe('parseQuoteErrorDetailsFromText', () => {
  it('parses JSON text', () => {
    expect(
      parseQuoteErrorDetailsFromText('{"errors":[{"detail":"No route"}]}')
    ).toEqual({
      title: null,
      detail: 'No route',
      dappName: null,
      dappUrl: null,
    });
  });

  it('yields null for plain text and broken JSON', () => {
    expect(parseQuoteErrorDetailsFromText('Internal Server Error')).toBe(null);
    expect(parseQuoteErrorDetailsFromText('{"errors":')).toBe(null);
    expect(parseQuoteErrorDetailsFromText('')).toBe(null);
  });
});
