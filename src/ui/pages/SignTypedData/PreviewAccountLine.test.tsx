import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getPreviewAccount, PreviewAccountLine } from './PreviewAccountLine';

// The blockie canvas needs `window`; the account selection is what is under test.
vi.mock('src/ui/components/BlockieImg', () => ({ BlockieImg: () => null }));

const SIGNER = '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1';
const SAFE = '0x4a183b7ED67B9E14b3f45Abfb2Cf44ed22c29E54';

function render(signerAddress: string, actionAddress?: string | null) {
  return renderToStaticMarkup(
    <PreviewAccountLine signerAddress={signerAddress} actionAddress={actionAddress} />,
  );
}

describe('getPreviewAccount', () => {
  test('a Safe action belongs to the Safe, not to the signer', () => {
    expect(getPreviewAccount({ signerAddress: SIGNER, actionAddress: SAFE })).toEqual({
      address: SAFE,
      isOtherAccount: true,
    });
  });

  test('an action for the signer stays with the signer regardless of case', () => {
    expect(
      getPreviewAccount({ signerAddress: SIGNER, actionAddress: SIGNER.toLowerCase() }),
    ).toEqual({ address: SIGNER, isOtherAccount: false });
  });

  test.each([undefined, null])(
    'a missing action address falls back to the signer',
    (actionAddress) => {
      expect(getPreviewAccount({ signerAddress: SIGNER, actionAddress })).toEqual({
        address: SIGNER,
        isOtherAccount: false,
      });
    },
  );
});

describe('PreviewAccountLine', () => {
  test('names and copies the Safe when it differs from the signer', () => {
    const markup = render(SIGNER, SAFE);
    expect(markup).toContain('Balance changes shown for Safe');
    expect(markup).toContain('0x4a18…9E54');
    expect(markup).toContain(`title="${SAFE}"`);
    expect(markup).toContain('<button');
  });

  test('renders nothing for the signer', () => {
    expect(render(SIGNER, SIGNER)).toBe('');
  });

  test('renders nothing without an action address', () => {
    expect(render(SIGNER, undefined)).toBe('');
  });
});
