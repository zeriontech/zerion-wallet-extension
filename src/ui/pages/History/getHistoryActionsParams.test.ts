import { describe, expect, it } from '@jest/globals';
import { getPageRequestParams } from 'src/modules/zerion-api/requests/getPageRequestParams';
import { getHistoryActionsParams } from './getHistoryActionsParams';

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
const NEXT_PAGE_CURSOR = 'eyJvZmZzZXQiOjEwfQ==';

describe('History request params: includePending (AC1)', () => {
  const cases = [true, false].flatMap((isOwnWallet) =>
    [undefined, 'Oct 20, 2026'].flatMap((startDate) =>
      [undefined, NEXT_PAGE_CURSOR].map(
        (pageParam) =>
          [
            isOwnWallet ? 'own' : 'watchlist',
            startDate ? 'date jump' : 'no date jump',
            pageParam ? 'cursor page' : 'first page',
            { isOwnWallet, startDate, pageParam },
            isOwnWallet && !startDate && !pageParam,
          ] as const
      )
    )
  );

  it('covers every combination once', () => {
    expect(cases).toHaveLength(8);
  });

  it.each(cases)(
    '%s wallet, %s, %s',
    (
      _wallet,
      _date,
      _page,
      { isOwnWallet, startDate, pageParam },
      expected
    ) => {
      const request = getPageRequestParams(
        getHistoryActionsParams({
          address: ADDRESS,
          currency: 'usd',
          startDate,
          isOwnWallet,
        }),
        pageParam
      );
      expect(request.includePending === true).toBe(expected);
      expect('includePending' in request).toBe(expected);
    }
  );

  it('a date jump turns into the first-page cursor and a cursor page keeps its own cursor', () => {
    const params = getHistoryActionsParams({
      address: ADDRESS,
      currency: 'usd',
      startDate: 'Oct 20, 2026',
      isOwnWallet: true,
    });
    expect(params.cursor).toEqual(expect.any(String));
    expect(getPageRequestParams(params, undefined).cursor).toBe(params.cursor);
    expect(getPageRequestParams(params, NEXT_PAGE_CURSOR).cursor).toBe(
      NEXT_PAGE_CURSOR
    );
  });

  it('an empty search query is left out, so History and the badge share one cache entry', () => {
    expect(
      getHistoryActionsParams({
        address: ADDRESS,
        currency: 'usd',
        searchQuery: '',
        isOwnWallet: true,
      })
    ).toEqual(
      getHistoryActionsParams({
        address: ADDRESS,
        currency: 'usd',
        isOwnWallet: true,
      })
    );
  });
});
