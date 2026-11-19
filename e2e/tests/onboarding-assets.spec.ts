import { expect } from '@playwright/test';
import { createExtensionTest } from './test';

const test = createExtensionTest({ onboarding: { auto: false } });

test('loads the onboarding welcome background image', async ({ page, extensionPopupUrl }) => {
  await page.goto(new URL('?appMode=onboarding#/onboarding/welcome', extensionPopupUrl).toString());
  await page.waitForSelector('text=Welcome to Zerion');

  const background = await page.evaluate(async () => {
    let element: HTMLElement | null =
      [...document.querySelectorAll<HTMLElement>('div')].find(
        (candidate) => candidate.textContent === 'Welcome to Zerion',
      ) ?? null;
    while (element && getComputedStyle(element).backgroundImage === 'none') {
      element = element.parentElement;
    }
    if (!element) {
      return null;
    }

    const backgroundImage = getComputedStyle(element).backgroundImage;
    const url = new URL(backgroundImage.slice(5, -2));
    const response = await fetch(url);
    return {
      url: url.toString(),
      status: response.status,
      contentType: response.headers.get('content-type'),
      bytes: (await response.arrayBuffer()).byteLength,
    };
  });

  expect(background).not.toBeNull();
  expect(background?.url).toMatch(/\/assets\/welcome_background-.+\.png$/);
  expect(background?.status).toBe(200);
  expect(background?.contentType).toBe('image/png');
  expect(background?.bytes).toBeGreaterThan(0);
});
