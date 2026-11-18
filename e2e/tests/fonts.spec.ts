import { expect } from '@playwright/test';
import { createExtensionTest } from './test';

const test = createExtensionTest({ onboarding: { auto: false } });

test('loads and renders the Aeonik Pro UI font', async ({ page, extensionPopupUrl }) => {
  // The bare popup URL redirects and closes itself when no wallet exists;
  // the onboarding welcome route renders without onboarding a wallet first.
  await page.goto(new URL('?appMode=onboarding#/onboarding/welcome', extensionPopupUrl).toString());
  await page.waitForSelector('text=Welcome to Zerion');

  const font = await page.evaluate(async () => {
    const sample = 'Zerion Wallet 0123456789 WwMmIi';
    const family = 'Aeonik Pro';
    // Resolves with the matching @font-face entries. An empty array means the
    // stylesheet has no face for that weight (the UI then silently falls back).
    const regularFaces = await document.fonts.load(`400 14px "${family}"`, sample);
    const mediumFaces = await document.fonts.load(`500 14px "${family}"`, sample);
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable');
    }
    context.font = `400 14px "${family}"`;
    const customFontWidth = context.measureText(sample).width;
    context.font = '400 14px sans-serif';
    const fallbackWidth = context.measureText(sample).width;

    return {
      faceCount: document.fonts.size,
      regularFaces: regularFaces.map((face) => face.status),
      mediumFaces: mediumFaces.map((face) => face.status),
      regularLoaded: document.fonts.check(`400 14px "${family}"`, sample),
      mediumLoaded: document.fonts.check(`500 14px "${family}"`, sample),
      bodyFontFamily: getComputedStyle(document.body).fontFamily,
      customFontWidth,
      fallbackWidth,
      visibleText: document.body.innerText.trim().length,
    };
  });

  expect(font.faceCount).toBeGreaterThanOrEqual(2);
  expect(font.regularFaces.length).toBeGreaterThan(0);
  expect(font.mediumFaces.length).toBeGreaterThan(0);
  expect([...font.regularFaces, ...font.mediumFaces].every((status) => status === 'loaded')).toBe(
    true,
  );
  expect(font.regularLoaded).toBe(true);
  expect(font.mediumLoaded).toBe(true);
  expect(font.bodyFontFamily.split(',')[0].replaceAll(/['"]/g, '').trim()).toBe('Aeonik Pro');
  expect(font.visibleText).toBeGreaterThan(0);
  // Fallback text would measure exactly like `sans-serif`; the loaded face has
  // its own metrics.
  expect(font.customFontWidth).not.toBe(font.fallbackWidth);
});
