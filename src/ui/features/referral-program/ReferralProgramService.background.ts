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
import { toEthersWallet } from 'src/background/Wallet/helpers/toEthersWallet';
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
    wallet,
    referralCode,
  }: {
    wallet: BareWallet;
    referralCode: string;
  }) {
    invariant(this.options, "Options aren't expected to become null");

    const walletFacade = this.options.getWallet();

    const signer = toEthersWallet(wallet);
    const normalizedAddress = normalizeAddress(wallet.address);
    const message = `${normalizedAddress} -> ${referralCode}`;

    await walletFacade.signMessage({
      signer,
      message,
      messageContextParams: {
        initiator: INTERNAL_ORIGIN,
        clientScope: null,
      },
    });

    const signature = await signer.signMessage(message);
    return signature;
  }

  async signAndSendReferWalletMessage({
    wallet,
    referralCode,
  }: {
    wallet: BareWallet;
    referralCode: string;
  }) {
    const signature = await this.signReferralMessage({
      wallet,
      referralCode,
    });
    return ZerionAPI.referWallet({
      address: wallet.address,
      referralCode,
      signature,
    });
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

    const eligibleWalletsAddresses = walletsMeta
      .filter(
        (meta) =>
          meta.membership.referrer === null &&
          meta.membership.referralCode !== referralCode
      )
      .map((meta) => meta.address);

    const eligibleWallets = [];
    for (const eligibleAddress of eligibleWalletsAddresses) {
      const ownedWallet = ownedBareWallets.find(
        (wallet) =>
          normalizeAddress(wallet.address) === normalizeAddress(eligibleAddress)
      );
      if (ownedWallet) {
        eligibleWallets.push(ownedWallet);
      }
    }

    await Promise.allSettled(
      eligibleWallets.map((wallet) =>
        this.signAndSendReferWalletMessage({ wallet, referralCode })
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

    if (!isSignerContainer(walletContainer) || !referralCode) {
      return;
    }

    await Promise.allSettled(
      walletContainer.wallets.map((wallet) =>
        this.signAndSendReferWalletMessage({ wallet, referralCode })
      )
    );
  }
}

export const referralProgramService = new ReferralProgramService();
