import { WidgetInstance } from 'friendly-challenge';

const isDevelopment = process.env.NODE_ENV === 'development';

const ZERION_CAPTCHA_SITEKEY = 'FCMTM2991RKE7478';

export async function resolveCaptcha() {
  if (isDevelopment) {
    console.time('friendly captcha solution'); // eslint-disable-line no-console
  }
  // we need to create captcha anchor every time
  // because this element will be destroyed in successful callback
  const element = document.createElement('div');
  element.setAttribute('id', 'friendly-captcha');
  document.body.appendChild(element);

  return new Promise<string>((resolve, reject) => {
    if (isDevelopment) {
      console.log('will solve friendly captcha'); // eslint-disable-line no-console
    }
    const widget = new WidgetInstance(element, {
      doneCallback: (solution: string) => {
        resolve(solution);
        if (isDevelopment) {
          console.timeEnd('friendly captcha solution'); // eslint-disable-line no-console
        }
        // we need to postpone destroying widget to avoid captcha internal problem
        setTimeout(() => {
          widget?.destroy();
        });
      },
      errorCallback: () => {
        reject();
        setTimeout(() => {
          widget?.destroy();
        });
      },
      skipStyleInjection: true,
      sitekey: ZERION_CAPTCHA_SITEKEY,
      startMode: 'auto',
    });
  });
}
