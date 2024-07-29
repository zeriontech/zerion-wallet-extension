import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import SettingsIcon from 'jsx:src/ui/assets/filters.svg';
import { invariant } from 'src/shared/invariant';
import { PauseInjectionControl } from 'src/ui/components/PauseInjection';
import { PausedHeader, usePausedData } from 'src/ui/components/PauseInjection';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { walletPort } from 'src/ui/shared/channels';
import { requestChainForOrigin } from 'src/ui/shared/requests/requestChainForOrigin';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { createChain } from 'src/modules/networks/Chain';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import {
  useMainnetNetwork,
  useNetworks,
} from 'src/modules/networks/useNetworks';
import { usePreferences } from 'src/ui/features/preferences';
import { capitalize } from 'capitalize-ts';
import { ConnectedSiteDialog } from '../../ConnectedSites/ConnectedSite';
import { NetworkSelect } from '../../Networks/NetworkSelect';
import { isConnectableDapp } from '../../ConnectedSites/shared/isConnectableDapp';
import { offsetValues } from '../getTabsOffset';

const COMPONENT_HEIGHT = 68;

function NetworksDisclosureButton({
  value,
  openDialog,
}: {
  value: string;
  openDialog: () => void;
}) {
  const { networks, isLoading } = useNetworks();
  const { preferences } = usePreferences();
  const selectedNetwork = networks?.getNetworkByName(createChain(value));

  const { data: mainnetNetwork } = useMainnetNetwork({
    chain: value,
    enabled: preferences?.testnetMode?.on && !isLoading && !selectedNetwork,
  });
  const chain = createChain(value);
  const network = selectedNetwork || mainnetNetwork;

  if (isLoading) {
    return null;
  }

  return (
    <Button
      size={36}
      kind="neutral"
      onClick={openDialog}
      style={{
        paddingInline: '8px 4px',
        ['--button-background' as string]: 'var(--white)',
        ['--button-background-hover' as string]: 'var(--white)',
        ['--button-text-hover' as string]: 'var(--neutral-800)',
        ['--parent-content-color' as string]: 'var(--neutral-500)',
        ['--parent-hovered-content-color' as string]: 'var(--black)',
      }}
      className="parent-hover"
    >
      <HStack gap={8} alignItems="center">
        {network ? (
          <NetworkIcon size={24} src={network.icon_url} name={network.name} />
        ) : null}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              maxWidth: 90,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {network?.name || capitalize(String(chain))}
          </span>
          <ArrowDownIcon
            className="content-hover"
            style={{ width: 20, height: 20 }}
          />
        </span>
      </HStack>
    </Button>
  );
}

export function ConnectionHeader() {
  const { isPaused, globalPreferences } = usePausedData();
  const showPausedHeader = isPaused && globalPreferences;
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogDismiss = useCallback(() => {
    dialogRef.current?.close();
    setShowConnectionDialog(false);
  }, []);

  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
    useErrorBoundary: true,
  });
  const activeTabOrigin = tabData?.tabOrigin;
  const activeTabHostname = tabData?.url.hostname;
  const { singleAddressNormalized } = useAddressParams();
  const { data: isConnected } = useIsConnectedToActiveTab(
    singleAddressNormalized
  );

  const { data: siteChain, ...chainQuery } = useQuery({
    queryKey: ['requestChainForOrigin', activeTabOrigin],
    queryFn: () => requestChainForOrigin(activeTabOrigin),
    enabled: Boolean(activeTabOrigin),
    useErrorBoundary: true,
    suspense: false,
  });

  const switchChainMutation = useMutation({
    mutationFn: ({ chain, origin }: { chain: string; origin: string }) =>
      walletPort.request('switchChainForOrigin', { chain, origin }),
    useErrorBoundary: true,
    onSuccess: () => chainQuery.refetch(),
  });

  const isConnectableSite = activeTabOrigin
    ? isConnectableDapp(new URL(activeTabOrigin))
    : false;

  const isHidden = !isConnectableSite && !showPausedHeader;
  useEffect(() => {
    offsetValues.setState({
      connectionHeaderHeight: isHidden ? 0 : COMPONENT_HEIGHT,
    });
  }, [isHidden]);

  if (isHidden) {
    return null;
  }
  return (
    <div style={{ backgroundColor: 'var(--background)', padding: 16 }}>
      <BottomSheetDialog
        ref={dialogRef}
        height="fit-content"
        onClosed={handleDialogDismiss}
        containerStyle={{ backgroundColor: 'var(--z-index-0)' }}
      >
        {showConnectionDialog && activeTabOrigin ? (
          <>
            <ConnectedSiteDialog
              originName={activeTabOrigin}
              onDismiss={handleDialogDismiss}
            />
            <DialogCloseButton
              onClick={handleDialogDismiss}
              style={{ position: 'absolute', top: 8, right: 8 }}
            />
          </>
        ) : null}
      </BottomSheetDialog>
      <HStack
        gap={8}
        alignItems="center"
        style={{ gridTemplateColumns: '1fr auto' }}
      >
        {showPausedHeader ? (
          <PausedHeader />
        ) : (
          <HStack
            gap={12}
            alignItems="center"
            style={{
              gridTemplateColumns: isConnectableSite ? 'auto 1fr' : '1fr',
            }}
          >
            {isConnectableSite ? (
              <Button
                kind="neutral"
                size={36}
                title="Open Dapp connection menu"
                style={{
                  padding: 8,
                  ['--button-background' as string]: 'var(--white)',
                  ['--button-background-hover' as string]: 'var(--white)',
                  ['--button-text-hover' as string]: 'var(--neutral-800)',
                }}
                onClick={() => {
                  invariant(
                    dialogRef.current,
                    'Dialog element must be mounted'
                  );
                  dialogRef.current.showModal();
                  setShowConnectionDialog(true);
                }}
                disabled={!tabData}
              >
                <SettingsIcon
                  style={{
                    display: 'block',
                    width: 20,
                    height: 20,
                  }}
                />
              </Button>
            ) : null}
            {isConnected && activeTabOrigin ? (
              <HStack
                gap={8}
                alignItems="center"
                style={{
                  gridTemplateColumns: '1fr auto',
                }}
              >
                <VStack
                  gap={0}
                  style={{
                    textAlign: 'start',
                    justifyItems: 'start',
                    height: 36,
                  }}
                >
                  <UIText
                    kind="body/accent"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}
                  >
                    {activeTabHostname}
                  </UIText>
                  <UIText kind="caption/regular" color="var(--positive-500)">
                    Connected
                  </UIText>
                </VStack>
                {siteChain ? (
                  <NetworkSelect
                    value={siteChain.toString()}
                    onChange={(value) => {
                      switchChainMutation.mutate({
                        chain: value,
                        origin: activeTabOrigin,
                      });
                    }}
                    renderButton={({ openDialog, value }) => (
                      <NetworksDisclosureButton
                        value={value}
                        openDialog={openDialog}
                      />
                    )}
                  />
                ) : null}
              </HStack>
            ) : (
              <VStack
                gap={0}
                style={{
                  textAlign: 'start',
                  height: 36,
                  justifyItems: 'start',
                  alignItems: 'center',
                }}
              >
                {isConnectableSite || activeTabOrigin === INTERNAL_ORIGIN ? (
                  <UIText
                    kind="body/accent"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}
                  >
                    {activeTabOrigin === INTERNAL_ORIGIN
                      ? 'Zerion Extension'
                      : activeTabHostname}
                  </UIText>
                ) : null}
                <UIText kind="caption/regular" color="var(--neutral-500)">
                  {isConnectableSite ? 'Not Connected' : 'Not a Website'}
                </UIText>
              </VStack>
            )}
          </HStack>
        )}
        <PauseInjectionControl />
      </HStack>
    </div>
  );
}
