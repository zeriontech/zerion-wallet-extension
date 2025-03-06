import { isTruthy } from 'is-truthy-ts';
import React, { useMemo, useRef } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type { AssetFullInfo } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { middleTruncate } from 'src/ui/shared/middleTruncate';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import DownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { NetworkId } from 'src/modules/networks/NetworkId';

function AssetImplementationButton({
  network,
  address,
}: {
  network: NetworkConfig;
  address: string | null;
}) {
  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: address || 'null',
  });

  if (!address) {
    return (
      <Button
        as={UnstyledAnchor}
        rel="noopener noreferrer"
        target="_blank"
        href={network.explorer_home_url || ''}
        aria-label="Copy token address"
        size={36}
        kind="neutral"
        className="parent-hover"
        style={{
          ['--parent-content-color' as string]: 'var(--neutral-400)',
          ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
          ['--button-background' as string]: 'var(--neutral-200)',
          ['--button-background-hover' as string]: 'var(--neutral-300)',
          paddingInline: 8,
        }}
      >
        <HStack gap={4} alignItems="center">
          <HStack gap={6} alignItems="center">
            <img
              src={network.icon_url}
              alt={network.name}
              width={24}
              height={24}
            />
            <UIText kind="small/accent">Explorer</UIText>
          </HStack>
          <LinkIcon
            className="content-hover"
            style={{ width: 20, height: 20 }}
          />
        </HStack>
      </Button>
    );
  }
  return (
    <Button
      onClick={handleCopy}
      aria-label="Copy token address"
      size={36}
      kind="neutral"
      className="parent-hover"
      style={{
        paddingInline: 8,
        ['--parent-content-color' as string]: 'var(--neutral-400)',
        ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
        ['--button-background' as string]: 'var(--neutral-200)',
        ['--button-background-hover' as string]: 'var(--neutral-300)',
      }}
    >
      <HStack gap={4} alignItems="center">
        <HStack gap={6} alignItems="center">
          <img
            src={network.icon_url}
            alt={network.name}
            width={24}
            height={24}
          />
          <UIText kind="small/accent">
            {middleTruncate({
              value: address,
              leadingLettersCount: 5,
              trailingLettersCount: 4,
            })}
          </UIText>
        </HStack>
        {isSuccess ? (
          <CheckIcon
            style={{ color: 'var(--positive-500)', width: 20, height: 20 }}
          />
        ) : (
          <CopyIcon
            className="content-hover"
            style={{ width: 20, height: 20 }}
          />
        )}
      </HStack>
    </Button>
  );
}

function CopyAddressButton({ address }: { address: string }) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });

  return (
    <UnstyledButton
      onClick={handleCopy}
      aria-label="Copy token address"
      className="parent-hover"
      style={{
        ['--parent-content-color' as string]: 'var(--neutral-400)',
        ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
      }}
    >
      {isSuccess ? (
        <CheckIcon style={{ color: 'var(--positive-500)' }} />
      ) : (
        <CopyIcon className="content-hover" />
      )}
    </UnstyledButton>
  );
}

function AssetImplementationsDialog({
  implementations,
}: {
  implementations: { address: string | null; network: NetworkConfig }[];
}) {
  const { networks } = useNetworks();
  return (
    <VStack
      gap={14}
      style={{ ['--surface-background-color' as string]: 'var(--white)' }}
    >
      <UIText kind="body/accent" style={{ justifySelf: 'center' }}>
        Explorers
      </UIText>
      <VStack gap={0}>
        {implementations.map(({ address, network }) => (
          <HStack
            key={network.id}
            gap={24}
            justifyContent="space-between"
            alignItems="center"
            style={{ paddingBlock: 12 }}
          >
            <HStack gap={12} alignItems="center">
              <img
                src={network.icon_url}
                alt={network.name}
                width={36}
                height={36}
              />
              <VStack gap={0}>
                <UIText kind="body/accent">{network.name}</UIText>
                {address ? (
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    {middleTruncate({ value: address })}
                  </UIText>
                ) : null}
              </VStack>
            </HStack>
            <HStack gap={0}>
              {address ? <CopyAddressButton address={address} /> : null}
              <UnstyledAnchor
                rel="noopener noreferrer"
                target="_blank"
                href={
                  address && networks
                    ? networks.getExplorerTokenUrlByName(
                        createChain(network.id),
                        address
                      )
                    : network.explorer_home_url || ''
                }
                className="parent-hover"
                style={{
                  ['--parent-content-color' as string]: 'var(--neutral-400)',
                  ['--parent-hovered-content-color' as string]:
                    'var(--neutral-700)',
                }}
              >
                <LinkIcon className="content-hover" />
              </UnstyledAnchor>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}

export function AssetResources({
  assetFullInfo,
}: {
  assetFullInfo: AssetFullInfo;
}) {
  const { networks } = useNetworks();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const implementations = useMemo(
    () =>
      Object.entries(assetFullInfo.fungible.implementations)
        .map(([networkId, config]) => {
          const network = networks?.getNetworkByName(createChain(networkId));
          return network ? { address: config.address, network } : null;
        })
        .filter(isTruthy),
    [assetFullInfo.fungible.implementations, networks]
  );

  const mainImplementation = useMemo(() => {
    return (
      implementations.find(
        (implementation) => implementation.network.id === NetworkId.Ethereum
      ) || implementations[0]
    );
  }, [implementations]);

  return (
    <>
      <HStack gap={8} justifyContent="space-between">
        <HStack gap={8}>
          {assetFullInfo.extra.relevantResources.slice(0, 3).map((resource) => (
            <Button
              key={resource.name}
              as={UnstyledAnchor}
              rel="noopenner noreferrer"
              target="_blank"
              kind="regular"
              size={36}
              href={resource.url}
              style={{
                padding: 6,
                border: '2px solid var(--neutral-200)',
                ['--button-background' as string]: 'var(--white)',
                ['--button-background-hover' as string]: 'var(--neutral-200)',
              }}
              aria-label={resource.displayableName}
            >
              <img src={resource.iconUrl} width={20} height={20} />
            </Button>
          ))}
        </HStack>
        <HStack gap={4}>
          {mainImplementation ? (
            <AssetImplementationButton
              address={mainImplementation.address}
              network={mainImplementation.network}
            />
          ) : null}
          {implementations.length > 1 ? (
            <Button
              kind="regular"
              size={36}
              onClick={() => dialogRef.current?.showModal()}
              style={{
                padding: 8,
                ['--button-background' as string]: 'var(--neutral-200)',
                ['--button-background-hover' as string]: 'var(--neutral-300)',
              }}
            >
              <DownIcon style={{ width: 20, height: 20 }} />
            </Button>
          ) : null}
        </HStack>
      </HStack>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ backgroundColor: 'var(--white)' }}
        renderWhenOpen={() => (
          <>
            <Button
              kind="ghost"
              value="cancel"
              size={40}
              style={{
                width: 40,
                padding: 8,
                position: 'absolute',
                top: 16,
                left: 8,
              }}
              onClick={() => dialogRef.current?.close()}
            >
              <ArrowLeftIcon />
            </Button>
            <AssetImplementationsDialog implementations={implementations} />
          </>
        )}
      />
    </>
  );
}
