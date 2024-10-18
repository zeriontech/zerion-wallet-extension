import { emitter } from 'src/background/events';
import { isReadonlyContainer } from 'src/shared/types/validators';
import type { Wallet } from 'src/shared/types/Wallet';
import type { WalletContainer } from 'src/shared/types/WalletContainer';
import { INTERNAL_SYMBOL_CONTEXT } from 'src/background/Wallet/Wallet';
import { invariant } from 'src/shared/invariant';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { readReferrer, saveReferrer } from './shared/storage';

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

    const signer = walletFacade.getOfflineSigner();
    const normalizedAddress = normalizeAddress(address);
    const message = `${normalizedAddress} -> ${referralCode}`;
    const signature = await signer.signMessage(message);
    return signature;
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
    return ZerionAPI.referWallet({ address, referralCode, signature });
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

    const ownedAddresses = walletGroups
      ?.filter((group) => !isReadonlyContainer(group.walletContainer))
      .flatMap((group) =>
        group.walletContainer.wallets.map((wallet) => wallet.address)
      );
    const walletsMetaResponse = ownedAddresses
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

    await saveReferrer(checkedReferrer);

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
    const currentReferrer = await readReferrer();
    const referralCode = currentReferrer?.referralCode;

    if (isReadonlyContainer(walletContainer) || !referralCode) {
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
