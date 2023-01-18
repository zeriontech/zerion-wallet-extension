import browser from 'webextension-polyfill';

export function openInNewWindow(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) {
  event.preventDefault();
  browser.windows.create({
    url: event.currentTarget.getAttribute('href') as string,
    width: 600,
    height: 800,
  });
}
