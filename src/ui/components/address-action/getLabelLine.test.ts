import type { ActionLabel } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { Asset } from 'src/defi-sdk.types';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { createSendTokenAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { getLabelLine, RECIPIENT_FALLBACK_CAPTION, type LabelLine } from './getLabelLine';

const WALLET_ADDRESS = '0x1111111111111111111111111111111111111111';
const CONTRACT_ADDRESS = '0x2222222222222222222222222222222222222222';

type Title = 'to' | 'from' | 'application' | undefined | 'via';
type Shape = 'W' | 'C' | 'W+C' | 'neither';
type Kind = LabelLine['kind'] | null;

const wallet = { address: WALLET_ADDRESS, name: 'alice.eth', iconUrl: null, trackable: false };
const contract = {
  address: CONTRACT_ADDRESS,
  dapp: { id: 'uniswap', name: 'Uniswap', iconUrl: null, url: null },
} as unknown as NonNullable<ActionLabel['contract']>;

function makeLabel({
  title,
  shape,
  displayTitle,
}: {
  title: Title;
  shape: Shape;
  displayTitle: string | undefined;
}): ActionLabel {
  return {
    ...(title !== undefined ? { title: title as ActionLabel['title'] } : null),
    ...(displayTitle !== undefined ? { displayTitle } : null),
    wallet: shape === 'W' || shape === 'W+C' ? wallet : null,
    contract: shape === 'C' || shape === 'W+C' ? contract : null,
  };
}

const KINDS: Record<string, Record<Shape, Kind>> = {
  application: {
    W: 'application-wallet',
    C: 'application-contract',
    'W+C': 'application-contract',
    neither: null,
  },
  to: { W: 'address', C: 'application-contract', 'W+C': 'address', neither: null },
  from: { W: 'address', C: 'application-contract', 'W+C': 'address', neither: null },
  undefined: { W: 'address', C: 'application-contract', 'W+C': 'address', neither: null },
  via: { W: 'address', C: 'application-contract', 'W+C': 'address', neither: null },
};

const TITLES: Title[] = ['to', 'from', 'application', undefined, 'via'];
const SHAPES: Shape[] = ['W', 'C', 'W+C', 'neither'];
const DISPLAY_TITLES = ['Shown', undefined];

const CASES = TITLES.flatMap((title) =>
  SHAPES.flatMap((shape) =>
    DISPLAY_TITLES.map((displayTitle) => {
      const kind = KINDS[String(title)][shape];
      let expected: LabelLine | null;
      if (kind === 'application-wallet') {
        expected = {
          kind,
          caption: displayTitle ?? null,
          address: WALLET_ADDRESS,
          copyOnly: true,
        };
      } else if (kind === 'address') {
        expected = {
          kind,
          caption: displayTitle ?? RECIPIENT_FALLBACK_CAPTION,
          address: WALLET_ADDRESS,
          name: 'alice.eth',
          copyOnly: true,
        };
      } else if (kind === 'application-contract') {
        expected = { kind };
      } else {
        expected = null;
      }
      return { title, shape, displayTitle, expected };
    }),
  ),
);

describe('getLabelLine', () => {
  test('the decision table covers every title × shape × displayTitle cell', () => {
    expect(CASES).toHaveLength(40);
  });

  test.each(CASES)(
    'title=$title shape=$shape displayTitle=$displayTitle',
    ({ title, shape, displayTitle, expected }) => {
      expect(getLabelLine(makeLabel({ title, shape, displayTitle }))).toStrictEqual(expected);
    },
  );

  test.each([null, undefined])('returns null for label %s', (label) => {
    expect(getLabelLine(label)).toBeNull();
  });

  const WALLET_CELLS = CASES.filter(
    ({ expected }) => expected?.kind === 'address' || expected?.kind === 'application-wallet',
  );
  const TRACKABLE_CASES = WALLET_CELLS.flatMap((cell) =>
    [
      { trackable: true, copyOnly: false },
      { trackable: false, copyOnly: true },
      { trackable: undefined, copyOnly: true },
    ].map((variant) => ({ ...cell, ...variant })),
  );

  test('every wallet-kind cell is checked against each trackable value', () => {
    expect(WALLET_CELLS).toHaveLength(18);
    expect(TRACKABLE_CASES).toHaveLength(54);
  });

  test.each(TRACKABLE_CASES)(
    'title=$title shape=$shape displayTitle=$displayTitle trackable=$trackable → copyOnly=$copyOnly',
    ({ title, shape, displayTitle, trackable, copyOnly }) => {
      const label = makeLabel({ title, shape, displayTitle });
      const { trackable: _, ...untracked } = wallet;
      label.wallet = trackable === undefined ? untracked : { ...untracked, trackable };
      const line = getLabelLine(label);
      expect(line && 'copyOnly' in line ? line.copyOnly : 'no wallet line').toBe(copyOnly);
    },
  );

  test('a wallet-shaped application label is a copy-only application-wallet line', () => {
    expect(
      getLabelLine({
        title: 'application',
        displayTitle: 'Application',
        wallet: { address: WALLET_ADDRESS, name: WALLET_ADDRESS, iconUrl: '', trackable: false },
        contract: null,
      }),
    ).toStrictEqual({
      kind: 'application-wallet',
      caption: 'Application',
      address: WALLET_ADDRESS,
      copyOnly: true,
    });
  });

  test('to and from wallet labels are captioned by their displayTitle', () => {
    expect(getLabelLine({ title: 'to', displayTitle: 'To', wallet, contract: null })).toMatchObject(
      { kind: 'address', caption: 'To' },
    );
    expect(
      getLabelLine({ title: 'from', displayTitle: 'From', wallet, contract: null }),
    ).toMatchObject({ kind: 'address', caption: 'From' });
  });

  test('a contract-shaped application label is an application-contract line', () => {
    expect(
      getLabelLine({ title: 'application', displayTitle: 'Application', wallet: null, contract }),
    ).toStrictEqual({ kind: 'application-contract' });
  });

  test('the locally built send label is a copy-only "Recipient" address line', () => {
    const action = createSendTokenAddressAction({
      transaction: {} as MultichainTransaction,
      hash: null,
      network: { id: 'ethereum', name: 'Ethereum', iconUrl: '' } as NetworkInfo,
      sendAsset: { asset_code: 'eth', name: 'Ether', symbol: 'ETH' } as Asset,
      sendAmount: { currency: 'usd', quantity: '1', value: null, usdValue: null },
      address: CONTRACT_ADDRESS,
      receiverAddress: WALLET_ADDRESS,
      explorerUrl: null,
    });
    expect(getLabelLine(action.label)).toStrictEqual({
      kind: 'address',
      caption: 'Recipient',
      address: WALLET_ADDRESS,
      name: null,
      copyOnly: true,
    });
  });
});
