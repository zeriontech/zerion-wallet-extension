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

export function openInPageTabView(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) {
  event?.preventDefault();
  const url = new URL(event.currentTarget.href);
  url.searchParams.set('windowContext', 'tab');
  url.searchParams.set('layout', 'page');
  browser.tabs.create({
    url: url.toString(),
  });
}
