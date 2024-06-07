import browser from 'webextension-polyfill';

export async function openTabView(url: URL) {
  url.searchParams.append('windowContext', 'tab');
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  browser.tabs.create({ url: url.toString(), index: activeTab?.index + 1 });
}

export function openInTabView(event: React.MouseEvent) {
  event.preventDefault();
  const attr = event.currentTarget.getAttributeNode('href');
  if (attr) {
    const url = new URL(attr.value, attr?.baseURI);
    openTabView(url);
  }
}
