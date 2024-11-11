import { emitter } from 'src/background/events';
import { isBareWallet, isSignerContainer } from 'src/shared/types/validators';
import type { Wallet } from 'src/shared/types/Wallet';
import type { WalletContainer } from 'src/shared/types/WalletContainer';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { invariant } from 'src/shared/invariant';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { getError } from 'src/shared/errors/getError';
import { readSavedReferrerData, saveReferrerData } from './shared/storage';

interface Options {
  getWallet: () => Wallet;
}

class ReferralProgramService {
  private options: Options | null = null;

  initialize(options: Options) {
    this.options = options;
    emitter.on('walletCreated', this.applyReferralCodeToWallet.bind(this));
  }

  async signReferralMessage({
    address,
    referralCode,
  }: {
    address: string;
    referralCode: string;
  }) {
    invariant(this.options, "Options aren't expected to become null");

    const walletFacade = this.options.getWallet();

    const normalizedAddress = normalizeAddress(address);
    const message = `${normalizedAddress} -> ${referralCode}`;

    try {
      const signature = await walletFacade.signMessage({
        params: {
          signerAddress: address,
          message,
          messageContextParams: {
            initiator: INTERNAL_ORIGIN,
            clientScope: null,
          },
        },
        context: { origin: INTERNAL_ORIGIN },
      });

      return signature;
    } catch (error) {
      emitter.emit('signingError', getError(error).message);
      throw error;
    }
  }

  async signAndSendReferWalletMessage({
    address,
    referralCode,
  }: {
    address: string;
    referralCode: string;
  }) {
    const signature = await this.signReferralMessage({
      address,
      referralCode,
    });

    try {
      return ZerionAPI.referWallet({
        address,
        referralCode,
        signature,
      });
    } catch (error) {
      emitter.emit('networkError', getError(error).message);
      throw error;
    }
  }

  async applyReferralCodeToAllWallets({
    referralCode,
  }: {
    referralCode: string;
  }) {
    invariant(this.options, "Options aren't expected to become null");
    const walletFacade = this.options.getWallet();

    const checkReferralResponse = await ZerionAPI.checkReferral({
      referralCode,
    });
    const checkedReferrer = checkReferralResponse.data;
    const walletGroups = await walletFacade.uiGetWalletGroups({
      context: INTERNAL_SYMBOL_CONTEXT,
    });

    const signerWalletGroups = walletGroups?.filter((group) =>
      isSignerContainer(group.walletContainer)
    );
    const ownedBareWallets =
      signerWalletGroups?.flatMap(
        (group) =>
          group.walletContainer.wallets.filter(isBareWallet) as BareWallet[]
      ) || [];
    const ownedAddresses = ownedBareWallets.map((wallet) => wallet.address);

    const walletsMetaResponse =
      ownedAddresses.length > 0
        ? await ZerionAPI.getWalletsMeta({ identifiers: ownedAddresses })
        : null;
    const walletsMeta = walletsMetaResponse?.data || [];

    const eligibleAddresses = walletsMeta
      .filter(
        (meta) =>
          meta.membership.referrer === null &&
          meta.membership.referralCode !== referralCode
      )
      .map((meta) => meta.address);

    await Promise.allSettled(
      eligibleAddresses.map((address) =>
        this.signAndSendReferWalletMessage({ address, referralCode })
      )
    );

    await saveReferrerData(checkedReferrer);

    // We need to start watching the referrer wallet
    if (checkedReferrer.address) {
      await walletFacade.uiAddReadonlyAddress({
        context: INTERNAL_SYMBOL_CONTEXT,
        params: {
          address: checkedReferrer.address,
          name: checkedReferrer.handle,
        },
      });
    }

    return checkedReferrer;
  }

  async applyReferralCodeToWallet({
    walletContainer,
  }: {
    walletContainer: WalletContainer;
  }) {
    const currentReferrer = await readSavedReferrerData();
    const referralCode = currentReferrer?.referralCode;

    if (!isSignerContainer(walletContainer) || !referralCode) {
      return;
    }

    await Promise.allSettled(
      walletContainer.wallets.map((wallet) =>
        this.signAndSendReferWalletMessage({
          address: wallet.address,
          referralCode,
        })
      )
    );
  }
}

export const referralProgramService = new ReferralProgramService();
