import React, { useId, useRef, useState } from 'react';
import { HTTPError } from 'ky';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  useBackgroundKind,
  whiteBackgroundKind,
} from 'src/ui/components/Background/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { useNavigate } from 'react-router-dom';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { useCustomValidity } from 'src/ui/shared/forms/useCustomValidity';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { getError } from 'src/shared/errors/getError';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { hasChecksumError } from 'src/modules/ethereum/toChecksumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';

function isValidAddress(address: string) {
  return isEthereumAddress(address) || isSolanaAddress(address);
}
async function submitReadonlyAddress({ address }: { address: string }) {
  await walletPort.request('uiImportReadonlyAddress', {
    address,
    name: null,
  });
  await accountPublicRPCPort.request('saveUserAndWallet');
  await setCurrentAddress({ address });
}

function getHints(
  query: string,
  data: undefined | Awaited<ReturnType<(typeof ZerionAPI)['getWalletsMeta']>>
): { address: string | null; domains: string[] | null } {
  if (!data || !data.data?.length) {
    return { address: null, domains: null };
  }

  const domains = data.data[0]?.identities.map((value) => value.handle) || null;
  if (isValidAddress(query)) {
    return { address: null, domains };
  } else {
    return { address: data.data[0]?.address ?? null, domains };
  }
}

async function lookup(value: string) {
  const result = await ZerionAPI.getWalletsMeta({ identifiers: [value] });
  if (result.data?.length === 0) {
    const message = result.errors?.[0]?.title;
    throw new Error(message || 'No resolved identities');
  } else {
    return result;
  }
}

async function lookupAddressByQuery(query: string) {
  try {
    const addressIsEthereum = isEthereumAddress(query);
    const addressIsSolana = isSolanaAddress(query);
    const promises = [lookup(query)];
    if (
      !addressIsEthereum &&
      !addressIsSolana &&
      !query.endsWith('.eth') &&
      !query.endsWith('.lens')
    ) {
      promises.push(lookup(`${query}.eth`));
      promises.push(lookup(`${query}.lens`));
    }
    return await Promise.any(promises);
  } catch (unknownError) {
    const error =
      unknownError instanceof AggregateError
        ? unknownError.errors[0]
        : unknownError;
    if (error instanceof HTTPError) {
      const payload = await (error as HTTPError).response.json();
      const message = payload.errors?.[0]?.title;
      if (message) {
        throw new Error(message);
      }
    }
    throw error;
  }
}

export function AddReadonlyAddress() {
  useBackgroundKind(whiteBackgroundKind);
  const formId = useId();
  const navigate = useNavigate();

  const { mutate, isLoading: isSubmitting } = useMutation({
    mutationFn: submitReadonlyAddress,
    onSuccess: () => navigate('/overview'),
  });

  const [debouncedValue, setDebouncedValue] = useState('');
  const query = debouncedValue.trim();
  const isSupportedAddress = isValidAddress(query);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data, isInitialLoading, isError, error } = useQuery({
    queryKey: ['lookupAddressByQuery', query],
    queryFn: async () => lookupAddressByQuery(query),
    staleTime: 20000,
    retry: 0,
    enabled: Boolean(query),
    suspense: false,
  });

  const isDomainResolving = query && isInitialLoading && !isSupportedAddress;
  const resolveError = isError && !isSupportedAddress;

  useCustomValidity({
    ref: inputRef,
    customValidity: isSupportedAddress
      ? '' // Form MUST be valid for valid eth address regardless of the getWalletsMeta request state
      : isDomainResolving
      ? 'Wait until address is resolved'
      : resolveError
      ? 'Address not recognized'
      : '',
  });

  // Do not _display_ error for input like {hello},
  // only show for inputs like {hello.}, {hello.eth}, etc
  // NOTE: form error (custom validity) must still be set
  const errorMessage =
    isError && query.includes('.') ? getError(error).message : null;
  const hints = getHints(query, data);

  const title = 'Watch Address';
  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle title={null} documentTitle={title} />
      <PageHeading>{title}</PageHeading>
      <Spacer height={4} />
      <UIText kind="body/regular">
        Search or paste an address, domain or identity to start watching a
        wallet
      </UIText>
      <Spacer height={32} />
      <form
        id={formId}
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          if (form.checkValidity()) {
            const address = data.get('address') as string | null;
            if (!address) {
              throw new Error('No address value found on form');
            }
            mutate({ address });
          }
        }}
      >
        <input
          type="hidden"
          name="address"
          value={isSupportedAddress ? query : hints.address ?? ''}
          required={true}
        />
        <VStack gap={4}>
          <ZStack>
            <DebouncedInput
              value={debouncedValue}
              onChange={(value) => {
                setDebouncedValue(value);
              }}
              render={({ value, handleChange }) => (
                <Input
                  ref={inputRef}
                  name="addressOrDomain"
                  placeholder="Address, domain or identity"
                  style={{ paddingRight: 40 }}
                  value={value}
                  onChange={(event) => handleChange(event.currentTarget.value)}
                  required={true}
                />
              )}
            />
            {isInitialLoading ? (
              <CircleSpinner
                style={{
                  pointerEvents: 'none',
                  placeSelf: 'center end',
                  marginRight: 12,
                }}
              />
            ) : (
              <SearchIcon
                role="presentation"
                style={{
                  pointerEvents: 'none',
                  placeSelf: 'center end',
                  marginRight: 12,
                  width: 24,
                  height: 24,
                  color: 'var(--neutral-500)',
                }}
              />
            )}
          </ZStack>
          {isSupportedAddress && hasChecksumError(query) ? (
            <UIText kind="caption/regular" color="var(--notice-500)">
              Warning: address might have an error
            </UIText>
          ) : null}
          {errorMessage ? (
            <UIText
              kind="caption/regular"
              color={isError ? 'var(--negative-500)' : undefined}
            >
              {errorMessage}
            </UIText>
          ) : hints.address ? (
            <div>
              <UIText kind="caption/regular">{hints.address}</UIText>
              {hints.domains && !hints.domains.includes(query) ? (
                <UIText kind="caption/regular">
                  {hints.domains.join(', ')}
                </UIText>
              ) : null}
            </div>
          ) : hints.domains?.length ? (
            <UIText kind="caption/regular">{hints.domains.join(', ')}</UIText>
          ) : null}
        </VStack>
        <Button
          style={{ marginTop: 'auto' }}
          kind="primary"
          disabled={isSubmitting}
        >
          Continue
        </Button>
      </form>
      <PageBottom />
    </PageColumn>
  );
}
