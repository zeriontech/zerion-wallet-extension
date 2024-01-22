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

export function openInFullScreen(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) {
  event?.preventDefault();
  const url = new URL(event.currentTarget.href);
  url.searchParams.set('templateType', 'tab');
  url.searchParams.set('fullScreen', 'true');
  browser.tabs.create({
    url: url.toString(),
  });
}
