import React, { useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animated } from '@react-spring/web';
import { useNavigate, useParams } from 'react-router-dom';
import cn from 'classnames';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import LinkIcon from 'jsx:src/ui/assets/arrow-left-top.svg';
import DisconnectIcon from 'jsx:src/ui/assets/disconnect.svg';
import { NotFoundPage } from 'src/ui/components/NotFoundPage';
import { PageColumn } from 'src/ui/components/PageColumn';
import { getPermissionsWithWallets } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Button } from 'src/ui/ui-kit/Button';
import { PageBottom } from 'src/ui/components/PageBottom';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { GenericPrompt } from 'src/ui/components/GenericPrompt';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { getNameFromOrigin } from 'src/shared/dapps';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { invariant } from 'src/shared/invariant';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import {
  useBackgroundKind,
  whiteBackgroundKind,
} from 'src/ui/components/Background/Background';
import { useRemovePermissionMutation } from '../shared/useRemovePermission';
import { getConnectedSite } from '../shared/getConnectedSite';
import { MetamaskMode } from './MetamaskMode';
import * as styles from './styles.module.css';

function RevokeAllButton({
  origin,
  onSuccess,
}: {
  origin: string;
  onSuccess: () => void;
}) {
  const removePermissionMutation = useRemovePermissionMutation({ onSuccess });
  const removeActionDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  return (
    <>
      <BottomSheetDialog ref={removeActionDialogRef} style={{ height: '30vh' }}>
        <GenericPrompt message="The site will ask for permission next time" />
      </BottomSheetDialog>
      <Button
        kind="danger"
        onClick={() => {
          if (removeActionDialogRef.current) {
            showConfirmDialog(removeActionDialogRef.current).then(() => {
              removePermissionMutation.mutate({ origin });
            });
          }
        }}
      >
        <UIText kind="body/accent">
          {removePermissionMutation.isLoading ? 'Loading...' : 'Disconnect All'}
        </UIText>
      </Button>
    </>
  );
}

function SiteLink({ title, href }: { title: string; href: string }) {
  const { style: iconStyle, trigger: hoverTrigger } = useTransformTrigger({
    x: 2,
  });

  return (
    <UnstyledAnchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(styles.siteLink, 'parent-hover')}
      onMouseEnter={hoverTrigger}
      style={{
        ['--parent-content-color' as string]: 'var(--neutral-500)',
        ['--parent-hovered-content-color' as string]: 'var(--black)',
      }}
    >
      <HStack gap={4} justifyContent="space-between" alignItems="center">
        <Media
          vGap={0}
          image={
            <GlobeIcon style={{ display: 'block', width: 32, height: 32 }} />
          }
          text={<UIText kind="body/accent">{title}</UIText>}
          detailText={
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Open Dapp
            </UIText>
          }
        />
        <animated.div style={{ ...iconStyle, display: 'flex' }}>
          <LinkIcon
            className="content-hover"
            style={{
              display: 'block',
              width: 14,
              height: 14,
            }}
          />
        </animated.div>
      </HStack>
    </UnstyledAnchor>
  );
}

export function ConnectedSite() {
  useBackgroundKind(whiteBackgroundKind);

  const { originName } = useParams();
  invariant(originName, 'originName parameter is required for this view');
  const { data: connectedSites, refetch } = useQuery({
    queryKey: ['getPermissionsWithWallets'],
    queryFn: getPermissionsWithWallets,
    useErrorBoundary: true,
  });
  const connectedSite = useMemo(
    () => getConnectedSite(originName, connectedSites),
    [connectedSites, originName]
  );
  const siteOrigin = connectedSite?.origin;
  const connectedSiteOriginForHref = useMemo(
    () => (siteOrigin ? prepareForHref(siteOrigin) : null),
    [siteOrigin]
  );
  const navigate = useNavigate();
  const handleAllRemoveSuccess = useCallback(() => {
    refetch();
    navigate(-1);
  }, [navigate, refetch]);

  const removeActionDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const removePermissionMutation = useRemovePermissionMutation({
    onSuccess: () => {
      refetch();
      if (connectedSite?.addresses.length === 1) {
        navigate(-1);
      }
    },
  });
  if (!connectedSite) {
    return <NotFoundPage />;
  }

  const title = getNameFromOrigin(connectedSite.origin);
  return (
    <>
      <BottomSheetDialog ref={removeActionDialogRef} style={{ height: '30vh' }}>
        <GenericPrompt message="The site will ask for permission next time" />
      </BottomSheetDialog>
      <NavigationTitle title={title} />
      <PageColumn paddingInline={8}>
        <VStack gap={24}>
          <VStack gap={4}>
            {connectedSiteOriginForHref ? (
              <SiteLink title={title} href={connectedSiteOriginForHref.href} />
            ) : null}
            <label
              style={{
                width: '100%',
                padding: '12px 8px',
                cursor: 'pointer',
              }}
            >
              <MetamaskMode originName={originName} />
            </label>
          </VStack>
          {connectedSite.wallets.length ? (
            <VStack gap={8} style={{ paddingInline: 8 }}>
              <UIText kind="small/regular" color="var(--neutral-500)">
                Connected addresses
              </UIText>
              <SurfaceList
                style={{
                  padding: 0,
                  paddingBlock: 0,
                  backgroundColor: 'none',
                }}
                items={connectedSite.wallets.map((wallet) => {
                  return {
                    key: wallet.address,
                    style: { padding: 0 },
                    component: (
                      <HStack
                        gap={4}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Media
                          image={
                            <WalletAvatar
                              address={wallet.address}
                              active={false}
                              size={32}
                              borderRadius={4}
                            />
                          }
                          text={
                            <UIText
                              kind="body/accent"
                              style={{ wordBreak: 'break-all' }}
                            >
                              <WalletDisplayName wallet={wallet} />
                            </UIText>
                          }
                          detailText={
                            wallet.name ? (
                              <UIText
                                kind="caption/regular"
                                color="var(--neutral-500)"
                              >
                                {truncateAddress(wallet.address)}
                              </UIText>
                            ) : null
                          }
                        />
                        <Button
                          kind="danger"
                          size={36}
                          style={{ padding: 8 }}
                          aria-label="disconnect address"
                          onClick={() => {
                            if (removeActionDialogRef.current) {
                              showConfirmDialog(
                                removeActionDialogRef.current
                              ).then(() => {
                                removePermissionMutation.mutate({
                                  origin: connectedSite.origin,
                                  address: wallet.address,
                                });
                              });
                            }
                          }}
                        >
                          <DisconnectIcon />
                        </Button>
                      </HStack>
                    ),
                  };
                })}
              />
              {connectedSite.wallets.length > 1 ? (
                <RevokeAllButton
                  origin={connectedSite.origin}
                  onSuccess={handleAllRemoveSuccess}
                />
              ) : null}
            </VStack>
          ) : null}
        </VStack>
        <PageBottom />
      </PageColumn>
    </>
  );
}
