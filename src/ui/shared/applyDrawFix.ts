import browser from 'webextension-polyfill';
// Taken from: https://github.com/RabbyHub/Rabby/blob/5e2d6f80b86cc1e6fb6c58fb416aa2b7473b6742/src/ui/index.tsx#L30-L62

export function applyDrawFix() {
  if (
    window.screenLeft < 0 ||
    window.screenTop < 0 ||
    window.screenLeft > window.screen.width ||
    window.screenTop > window.screen.height
  ) {
    browser.runtime.getPlatformInfo().then((info) => {
      if (info.os === 'mac') {
        const fontFaceSheet = new CSSStyleSheet();
        fontFaceSheet.insertRule(`
        @keyframes redraw {
          0% {
            opacity: 1;
          }
          100% {
            opacity: .99;
          }
        }
      `);
        fontFaceSheet.insertRule(`
        html {
          animation: redraw 1s linear infinite;
        }
      `);
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).adoptedStyleSheets = [
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(document as any).adoptedStyleSheets,
          fontFaceSheet,
        ];
      }
    });
  }
}
