import { describe, expect, test } from 'vitest';
import { createUrl } from './createUrl';

describe('createUrl', () => {
  test('returns URL instance', () => {
    const result = createUrl({ base: 'https://a.com', pathname: '/a' });
    expect(result).toBeInstanceOf(URL);
  });

  test('simple cases', () => {
    expect(
      createUrl({ base: 'https://example.com', pathname: '/api' }).toString()
    ).toBe('https://example.com/api');

    expect(
      createUrl({ base: 'https://example.com/', pathname: '/api' }).toString()
    ).toBe('https://example.com/api');

    expect(
      createUrl({
        base: 'https://example.com/base/',
        pathname: './api/',
      }).toString()
    ).toBe('https://example.com/base/api/');

    expect(
      createUrl({
        base: 'https://example.com/base',
        pathname: './api/subpath/path',
      }).toString()
    ).toBe('https://example.com/api/subpath/path');
  });

  test('empty pathname', () => {
    expect(
      createUrl({ base: 'https://example.com/', pathname: '' }).toString()
    ).toBe('https://example.com/');

    expect(
      createUrl({
        base: 'https://example.com',
        pathname: '',
      }).toString()
    ).toBe('https://example.com/');
  });

  test('base as URL', () => {
    expect(
      createUrl({
        base: new URL('https://example.com/base'),
        pathname: './api',
      }).toString()
    ).toBe('https://example.com/api');
  });

  test('searchParams option', () => {
    expect(
      createUrl({
        base: 'https://example.com',
        pathname: '/api',
        searchParams: new URLSearchParams({ search: 'hello' }),
      }).toString()
    ).toBe('https://example.com/api?search=hello');

    expect(
      createUrl({
        base: 'https://example.com',
        pathname: '/api',
        searchParams: { search: 'hello', a: 'b' },
      }).toString()
    ).toBe('https://example.com/api?search=hello&a=b');

    expect(
      createUrl({
        base: 'https://example.com',
        pathname: '/api/',
        searchParams: 'name=apple&name=cherry&color=green',
      }).toString()
    ).toBe('https://example.com/api/?name=apple&name=cherry&color=green');

    expect(
      createUrl({
        base: 'https://example.com',
        pathname: '/api/',
        searchParams: '',
      }).toString()
    ).toBe('https://example.com/api/');
  });

  test('searchParams in base', () => {
    expect(
      createUrl({
        base: 'https://example.com?a=b',
        pathname: '/api',
      }).toString()
    ).toBe('https://example.com/api?a=b');

    expect(
      createUrl({
        base: 'https://example.com/base/?a=b',
        pathname: './api',
      }).toString()
    ).toBe('https://example.com/base/api?a=b');

    expect(
      createUrl({
        base: 'https://example.com/base/?a=b',
        pathname: '',
      }).toString()
    ).toBe('https://example.com/base/?a=b');
  });

  test('searchParams in options and in base', () => {
    expect(
      createUrl({
        base: 'https://example.com/base/?a=b',
        pathname: './api',
        searchParams: new URLSearchParams({ b: 'c' }),
      }).toString()
    ).toBe('https://example.com/base/api?a=b&b=c');

    expect(
      createUrl({
        base: 'https://example.com/base/?a=b',
        pathname: './api',
        searchParams: new URLSearchParams({ a: 'c' }),
      }).toString()
    ).toBe('https://example.com/base/api?a=b&a=c');
  });

  test('searchParams in pathname', () => {
    expect(
      createUrl({
        base: 'https://example.com',
        pathname: './api?color=red',
      }).toString()
    ).toBe('https://example.com/api?color=red');

    expect(
      createUrl({
        base: 'https://example.com/base/',
        pathname: './api/subpath/?color=red&season=winter',
      }).toString()
    ).toBe('https://example.com/base/api/subpath/?color=red&season=winter');
  });

  test('searchParams in options and in pathname', () => {
    expect(
      createUrl({
        base: 'https://example.com/base/',
        pathname: './api/subpath/?color=red&season=winter',
        searchParams: '?fruit=banana',
      }).toString()
    ).toBe(
      'https://example.com/base/api/subpath/?color=red&season=winter&fruit=banana'
    );

    expect(
      createUrl({
        base: 'https://example.com/base/',
        pathname: './api/subpath/?color=red&season=winter',
        searchParams: '',
      }).toString()
    ).toBe('https://example.com/base/api/subpath/?color=red&season=winter');
  });

  test('searchParams in options, base and pathname', () => {
    expect(
      createUrl({
        base: 'https://example.com?base=1&a=b',
        pathname: './api/subpath/?color=red&season=winter',
        searchParams: '?fruit=banana',
      }).toString()
    ).toBe(
      'https://example.com/api/subpath/?base=1&a=b&color=red&season=winter&fruit=banana'
    );

    expect(
      createUrl({
        base: new URL('https://example.com?base=1&a=b'),
        pathname: './api/subpath/?color=red&season=winter',
        searchParams: new URLSearchParams({
          fruit: 'banana',
          color: 'green',
          plant: '',
        }),
      }).toString()
    ).toBe(
      'https://example.com/api/subpath/?base=1&a=b&color=red&season=winter&fruit=banana&color=green&plant='
    );
  });

  expect(
    createUrl({
      base: new URL('https://example.com/v1?base=1&a=b'),
      pathname: '?color=red&season=winter',
      searchParams: new URLSearchParams({
        fruit: 'banana',
        color: 'green',
        plant: '',
      }),
    }).toString()
  ).toBe(
    'https://example.com/v1?base=1&a=b&color=red&season=winter&fruit=banana&color=green&plant='
  );

  expect(
    createUrl({
      base: new URL('https://example.com/v1?base=1&a=b'),
      pathname: '',
      searchParams: new URLSearchParams({ fruit: 'banana' }),
    }).toString()
  ).toBe('https://example.com/v1?base=1&a=b&fruit=banana');
});
