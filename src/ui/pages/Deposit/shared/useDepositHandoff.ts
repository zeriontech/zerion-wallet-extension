import { useMutation } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import type { DepositQuote } from 'src/modules/zerion-api/types/DepositFlow';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { openUrl } from 'src/ui/shared/openUrl';
import type { DepositFormState } from './types';

/**
 * The domain providers have on file for Zerion. It is an attribution key on
 * their side rather than a description of where the user is, so the extension
 * reports the same value the web app does instead of inventing one.
 */
const REFERRER_DOMAIN = 'https://app.zerion.io';

/**
 * Providers redirect through a normal browser tab when the purchase completes,
 * and they cannot redirect to a `chrome-extension://` URL — so the landing spot
 * is the web app's overview for the same wallet.
 */
function getRedirectUrl(address: string) {
  return `${REFERRER_DOMAIN}/${address}/overview`;
}

/**
 * Exchanges the form's state for a signed, single-use provider checkout URL and
 * opens it in a tab. Nothing is signed here — this is where the extension stops
 * being involved.
 */
export function useDepositHandoff({
  address,
  formState,
}: {
  address: string;
  formState: DepositFormState;
}) {
  return useMutation({
    mutationFn: async ({
      quote,
      paymentMethodId,
    }: {
      quote: DepositQuote;
      paymentMethodId: string;
    }) => {
      const { outputFungibleId, outputChain, currency, fiatValue, countryId } =
        formState;
      invariant(outputFungibleId, 'outputFungibleId is required');
      invariant(outputChain, 'outputChain is required');
      invariant(currency, 'currency is required');
      invariant(fiatValue, 'fiatValue is required');
      invariant(countryId, 'countryId is required');
      const response = await ZerionAPI.depositGetPaymentLink({
        address,
        assetId: outputFungibleId,
        chainId: outputChain,
        countryId,
        currency,
        fiatAmount: fiatValue,
        providerId: quote.provider.id,
        paymentMethodId,
        referrerDomain: REFERRER_DOMAIN,
        redirectUrl: getRedirectUrl(address),
      });
      // Deliberately not passed through `setUrlContext`: that appends the
      // extension's own params, and this URL belongs to a third party
      await openUrl(new URL(response.data.url));
      return response.data.url;
    },
  });
}
