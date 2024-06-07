import browser from 'webextension-polyfill';

export function openTabView(url: URL) {
  url.searchParams.append('windowContext', 'tab');
  browser.tabs.create({ url: url.toString() });
}

export function openInTabView(event: React.MouseEvent) {
  event.preventDefault();
  const attr = event.currentTarget.getAttributeNode('href');
  if (attr) {
    const url = new URL(attr.value, attr?.baseURI);
    openTabView(url);
  }
}
