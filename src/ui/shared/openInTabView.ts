import browser from 'webextension-polyfill';

export function openInTabView(event: React.MouseEvent) {
  event.preventDefault();
  const attr = event.currentTarget.getAttributeNode('href');
  if (attr) {
    const url = new URL(attr.value, attr?.baseURI);
    url.searchParams.append('templateType', 'tab');
    browser.tabs.create({ url: url.toString() });
  }
}
