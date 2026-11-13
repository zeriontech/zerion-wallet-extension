import type { ActionLabel } from 'src/modules/zerion-api/requests/wallet-get-actions';

export const RECIPIENT_FALLBACK_CAPTION = 'Recipient';

export type LabelLine =
  | { kind: 'application-contract' }
  | { kind: 'application-wallet'; caption: string | null; address: string; copyOnly: boolean }
  | { kind: 'address'; caption: string; address: string; name: string | null; copyOnly: boolean };

export function getLabelLine(label: ActionLabel | null | undefined): LabelLine | null {
  if (!label) {
    return null;
  }
  const { wallet, contract } = label;
  const title: string | undefined = label.title;
  if (!wallet) {
    return contract ? { kind: 'application-contract' } : null;
  }
  const copyOnly = wallet.trackable !== true;
  switch (title) {
    case 'application':
      return contract
        ? { kind: 'application-contract' }
        : {
            kind: 'application-wallet',
            caption: label.displayTitle ?? null,
            address: wallet.address,
            copyOnly,
          };
    default:
      return {
        kind: 'address',
        caption: label.displayTitle ?? RECIPIENT_FALLBACK_CAPTION,
        address: wallet.address,
        name: wallet.name ?? null,
        copyOnly,
      };
  }
}
