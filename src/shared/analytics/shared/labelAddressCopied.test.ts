import type { ActionLabel } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getLabelAddressCopiedParams } from './labelAddressCopied';

const ADDRESS = '0xabcdef0000000000000000000000000000000001';
const contract = {
  address: '0x2222222222222222222222222222222222222222',
  dapp: { id: 'uniswap', name: 'Uniswap', iconUrl: null, url: null },
} as unknown as NonNullable<ActionLabel['contract']>;

type Shape = 'W' | 'C' | 'neither';
type Title = 'application' | 'to' | 'from' | undefined;

const TRACKABLES = [true, false, undefined];
const OWN_WALLET = [true, false];
const SHAPES: Shape[] = ['W', 'C', 'neither'];
const TITLES: Title[] = ['application', 'to', 'from', undefined];

const CASES = TRACKABLES.flatMap((trackable) =>
  OWN_WALLET.flatMap((isOwnWallet) =>
    SHAPES.flatMap((shape) =>
      TITLES.map((title) => ({
        trackable,
        isOwnWallet,
        shape,
        title,
        expectsEvent: shape === 'W' && trackable !== true && !isOwnWallet,
      })),
    ),
  ),
);

function makeLabel(shape: Shape, title: Title, trackable: boolean | undefined): ActionLabel {
  return {
    ...(title !== undefined ? { title } : null),
    wallet:
      shape === 'W'
        ? {
            address: ADDRESS,
            name: null,
            iconUrl: null,
            ...(trackable !== undefined ? { trackable } : null),
          }
        : null,
    contract: shape === 'C' ? contract : null,
  };
}

describe('getLabelAddressCopiedParams', () => {
  test('the cross-product has 72 cases, 8 of which send the event', () => {
    expect(CASES).toHaveLength(72);
    expect(CASES.filter((c) => c.expectsEvent)).toHaveLength(8);
  });

  test.each(CASES)(
    'trackable=$trackable isOwnWallet=$isOwnWallet shape=$shape title=$title',
    ({ trackable, isOwnWallet, shape, title, expectsEvent }) => {
      const params = getLabelAddressCopiedParams({
        label: makeLabel(shape, title, trackable),
        chain: 'ethereum',
        actType: 'trade',
        screen: 'signing_preview',
        isOwnWallet,
      });
      if (expectsEvent) {
        expect(params).toStrictEqual({
          address: ADDRESS,
          chain: 'ethereum',
          label_title: title ?? null,
          act_type: 'trade',
          screen: 'signing_preview',
          platform: 'extension',
        });
      } else {
        expect(params).toBeNull();
      }
    },
  );

  test('lowercases a mixed-case 0x address', () => {
    const params = getLabelAddressCopiedParams({
      label: {
        title: 'to',
        wallet: {
          address: '0xAbCdEf0000000000000000000000000000000001',
          name: null,
          iconUrl: null,
        },
        contract: null,
      },
      chain: 'ethereum',
      actType: 'send',
      screen: 'history_details',
      isOwnWallet: false,
    });
    expect(params?.address).toBe('0xabcdef0000000000000000000000000000000001');
  });

  test('keeps a Solana base58 address unchanged', () => {
    const params = getLabelAddressCopiedParams({
      label: {
        title: 'to',
        displayTitle: 'To',
        wallet: {
          address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          name: null,
          iconUrl: null,
        },
        contract: null,
      },
      chain: 'solana',
      actType: 'send',
      screen: 'signing_advanced',
      isOwnWallet: false,
    });
    expect(params?.address).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
  });

  test('the local send label sends the event with label_title null', () => {
    // Shape built by createSendTokenAddressAction in addressActionMain.ts.
    const params = getLabelAddressCopiedParams({
      label: {
        contract: null,
        wallet: { address: ADDRESS, name: null, iconUrl: null },
      },
      chain: 'base',
      actType: 'send',
      screen: 'signing_preview',
      isOwnWallet: false,
    });
    expect(params).toStrictEqual({
      address: ADDRESS,
      chain: 'base',
      label_title: null,
      act_type: 'send',
      screen: 'signing_preview',
      platform: 'extension',
    });
  });
});
