import { WidgetInstance } from 'friendly-challenge';

const ZERION_CAPTCHA_SITEKEY = 'FCMTM2991RKE7478';

export async function resolveCaptcha() {
  // we need to create captcha anchor every time
  // because this element will be destroyed in successful callback
  const element = document.createElement('div');
  element.setAttribute('id', 'friendly-captcha');
  document.body.appendChild(element);

  return new Promise<string>((resolve) => {
    const widget = new WidgetInstance(element, {
      doneCallback: (solution: string) => {
        resolve(solution);
        // we need to postpone destroying widget to avoid captcha internal problem
        setTimeout(() => widget?.destroy());
      },
      sitekey: ZERION_CAPTCHA_SITEKEY,
      startMode: 'auto',
    });
  });
}
