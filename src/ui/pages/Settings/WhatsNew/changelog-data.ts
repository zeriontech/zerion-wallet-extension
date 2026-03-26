export interface ChangelogImage {
  src: string;
  alt: string;
}

export interface ChangelogLink {
  label: string;
  to: string;
}

export interface ChangelogItem {
  text: string;
  highlight?: boolean;
  link?: ChangelogLink;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  image?: ChangelogImage;
  new?: ChangelogItem[];
  improvements?: ChangelogItem[];
  fixes?: ChangelogItem[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.38.0',
    date: 'March 25, 2026',
    new: [
      {
        text: 'Filters in History',
        highlight: true,
        link: { label: 'History', to: '/overview/history' },
      },
      {
        text: 'Pending actions full-page details',
        highlight: true,
      },
      {
        text: 'Hotkey to confirm and sign transactions',
        highlight: true,
      },
    ],
    improvements: [
      {
        text: 'Search in wallet list',
        link: { label: 'Wallets', to: '/wallets' },
      },
    ],
    fixes: [{ text: 'Gas estimation causing simulation failure' }],
  },
  {
    version: '1.37.0',
    date: 'March 18, 2026',
    new: [
      {
        text: 'Send max native token amount',
        highlight: true,
      },
      {
        text: 'Wallet selector for cross-ecosystem dApp requests',
        highlight: true,
        link: { label: 'Wallets', to: '/wallets' },
      },
      { text: 'Hyperliquid banner in Overview' },
    ],
    improvements: [
      {
        text: 'Trading form improvements',
        link: { label: 'Swap', to: '/swap-form' },
      },
      { text: 'Improved search results display' },
      { text: 'Transaction poller with max retries' },
    ],
    fixes: [
      { text: 'Simulation request no longer fires on window focus' },
      { text: 'Asset page title overflow for small prices' },
      { text: 'Simulation label handling on Zero' },
      {
        text: 'Credentials moved to SessionStorage for infinite autolock',
        link: { label: 'Security', to: '/settings/security' },
      },
    ],
  },
  {
    version: '1.36.0',
    date: 'March 10, 2026',
    new: [
      {
        text: 'One-click approve and trade',
        highlight: true,
        link: { label: 'Swap', to: '/swap-form' },
      },
    ],
  },
];
