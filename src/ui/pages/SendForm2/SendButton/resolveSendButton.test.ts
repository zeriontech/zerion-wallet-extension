import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SendFormState2 } from '../types';
import type { SendSlotButton } from '../resolveSendSlot';
import { resolveSendButton } from './resolveSendButton';

const transaction: MultichainTransaction = {
  evm: { chainId: '0x1', from: '0xfrom', to: '0xto', value: '0x0' },
};

const withAmount: SendFormState2 = {
  inputChain: 'ethereum',
  inputFungibleId: 'eth',
  inputAmount: '1',
};

const base = {
  formState: withAmount,
  transaction: null,
  state: 'idle' as const,
  simulated: false,
  signing: false,
  isPreparingTransaction: false,
  slotButton: null,
  exceedsBalance: false,
};

describe('resolveSendButton', () => {
  describe('slotButton null keeps the existing outcomes', () => {
    it.each([
      [
        'no token',
        { formState: { inputChain: 'ethereum', inputFungibleId: '' } },
        'Select Token',
        true,
      ],
      [
        'no amount',
        { formState: { inputChain: 'ethereum', inputFungibleId: 'eth' } },
        'Enter an Amount',
        true,
      ],
      [
        'no NFT amount',
        {
          formState: {
            inputChain: 'ethereum',
            inputFungibleId: '',
            nftId: 'ethereum:0xc:1',
          },
        },
        'Enter an Amount',
        true,
      ],
      ['preparing', { isPreparingTransaction: true }, 'Preparing Transaction', true],
      ['no transaction, not preparing', {}, 'Send Now', true],
      [
        'typed zero with a transaction',
        {
          formState: { ...withAmount, inputAmount: '0' },
          transaction,
        },
        'Send Now',
        false,
      ],
      ['transaction ready', { transaction }, 'Send Now', false],
      ['simulating', { transaction, state: 'simulating' as const }, 'Verifying Transaction', true],
      ['simulated', { transaction, simulated: true }, 'Confirm Send', false],
      ['signing', { transaction, simulated: true, signing: true }, 'Confirm Send', true],
    ])('%s', (_name, overrides, label, disabled) => {
      expect(resolveSendButton({ ...base, ...overrides })).toEqual({
        label,
        disabled,
      });
    });
  });

  it('shows a disabled Send Now for send-disabled', () => {
    expect(resolveSendButton({ ...base, slotButton: 'send-disabled' })).toEqual({
      label: 'Send Now',
      disabled: true,
    });
  });

  it('shows a disabled Preparing Transaction while the current request is pending', () => {
    expect(
      resolveSendButton({
        ...base,
        transaction: null,
        isPreparingTransaction: true,
      }),
    ).toEqual({ label: 'Preparing Transaction', disabled: true });
  });

  it('shows a disabled Insufficient balance when the amount exceeds the balance', () => {
    expect(resolveSendButton({ ...base, exceedsBalance: true })).toEqual({
      label: 'Insufficient balance',
      disabled: true,
    });
  });

  it.each<SendSlotButton>(['top-up', 'send-disabled', null])(
    'never enables signing without a transaction (slotButton %p)',
    (slotButton) => {
      for (const isPreparingTransaction of [true, false]) {
        expect(
          resolveSendButton({
            ...base,
            slotButton,
            isPreparingTransaction,
            transaction: null,
            simulated: false,
          }).disabled,
        ).toBe(true);
      }
    },
  );
});
