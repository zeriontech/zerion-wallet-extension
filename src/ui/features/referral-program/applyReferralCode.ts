import { getReferralSignerAddresses } from 'src/modules/referral-program/getReferralSignerAddresses';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { walletPort } from 'src/ui/shared/channels';

export async function applyReferralCodeToAllWallets(referralCode: string) {
  const walletGroups = await walletPort.request('uiGetWalletGroups');
  const addresses = getReferralSignerAddresses(walletGroups);
  const walletsMeta = addresses.length
    ? (await ZerionAPI.getWalletsMeta({ identifiers: addresses })).data
    : [];
  const eligibleAddresses = (walletsMeta ?? [])
    .filter(
      ({ membership }) => membership.referrer === null && membership.referralCode !== referralCode,
    )
    .map(({ address }) => address);

  return walletPort.request('uiApplyReferralCodeToAllWallets', { referralCode, eligibleAddresses });
}
