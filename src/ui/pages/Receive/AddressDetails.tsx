import React, { useMemo, useRef } from 'react';
import cx from 'classnames';
import { motion } from 'motion/react';
import { QRCode } from 'react-qrcode-logo';
import ZerionLogoUrl from 'url:src/ui/assets/zerion-logo.svg';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import { useNetworks } from 'src/modules/networks/useNetworks';
import {
  getAddressType,
  type BlockchainType,
} from 'src/shared/wallet/classifiers';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { middleTruncate } from 'src/ui/shared/middleTruncate';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { useProfileName, WalletNameType } from 'src/ui/shared/useProfileName';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

const ZERION_ORIGIN = 'https://app.zerion.io';
const ZERION_HOST = new URL(ZERION_ORIGIN).host;

const VISIBLE_NETWORKS_COUNT = 6;

// The code is 29 modules wide for a 42-character address at error-correction
// level M; 176px leaves a little over 6px per module, and the quiet zone the
// spec asks for is drawn by the plate around it.
const QR_SIZE = 176;
const QR_QUIET_ZONE = 16;

function NetworkList({ standard }: { standard: BlockchainType }) {
  const { networks } = useNetworks();
  const allNetworks = useMemo(() => {
    return networks
      ?.getDefaultNetworks(standard)
      .filter((item) => !item.is_testnet && !isCustomNetworkId(item.id));
  }, [networks, standard]);

  return (
    <VStack gap={0}>
      {allNetworks?.map((network) => (
        <HStack key={network.id} gap={12} style={{ paddingBlock: 12 }}>
          <NetworkIcon name={network.name} src={network.icon_url} size={24} />
          <UIText kind="body/regular">{network.name}</UIText>
        </HStack>
      ))}
    </VStack>
  );
}

function SupportedNetworks({ address }: { address: string }) {
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
  const standard = getAddressType(address);
  const { networks } = useNetworks();

  const supportedNetworks = useMemo(() => {
    return (
      networks
        ?.getDefaultNetworks(standard)
        .filter((item) => !item.is_testnet && !isCustomNetworkId(item.id)) ?? []
    );
  }, [networks, standard]);

  const visibleNetworks = supportedNetworks.slice(0, VISIBLE_NETWORKS_COUNT);

  return (
    <>
      <UnstyledButton
        className={styles.networksButton}
        onClick={() => {
          dialogRef.current?.showModal();
        }}
      >
        <HStack gap={8} alignItems="center">
          {/* Spaced rather than overlapped: the app's usual overlap needs a
              `--white` ring to separate the icons, which would punch six white
              holes in the tint. */}
          <HStack gap={4} alignItems="center">
            {visibleNetworks.map((network) => (
              <NetworkIcon
                key={network.id}
                size={20}
                src={network.icon_url}
                name={network.name}
                style={{ borderRadius: 6 }}
              />
            ))}
          </HStack>
          <UIText kind="caption/regular" color="var(--neutral-600)">
            {supportedNetworks.length === 1
              ? `${supportedNetworks[0].name} network`
              : `${supportedNetworks.length} networks supported`}
          </UIText>
        </HStack>
      </UnstyledButton>
      <BottomSheetDialog
        ref={dialogRef}
        containerStyle={{
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
        renderWhenOpen={() => (
          <>
            <VStack gap={16} style={{ padding: 16 }}>
              <DialogTitle
                alignTitle="start"
                title={<UIText kind="headline/h3">Supported Networks</UIText>}
              />
              <UIText kind="body/regular">
                These are the blockchains Zerion supports for sending,
                receiving, and managing assets.
              </UIText>
              <HStack
                gap={12}
                style={{
                  backgroundColor: 'var(--neutral-100)',
                  paddingBlock: 8,
                  paddingInline: 12,
                  borderRadius: 16,
                }}
                alignItems="center"
              >
                {standard === 'solana' ? (
                  <>
                    <EcosystemEthereumIcon style={{ width: 36, height: 36 }} />
                    <UIText kind="small/regular">
                      To use the Ethereum ecosystem, choose an Ethereum wallet.
                    </UIText>
                  </>
                ) : (
                  <>
                    <EcosystemSolanaIcon style={{ width: 36, height: 36 }} />
                    <UIText kind="small/regular">
                      To use the Solana ecosystem, choose a Solana wallet.
                    </UIText>
                  </>
                )}
              </HStack>
              <NetworkList standard={standard} />
            </VStack>
            {/* The frosted band SendForm2 and the Perps forms put under their
                primary action. Also the reason the footer doesn't fall back to
                `PageStickyFooter`'s `var(--background)`: the receive page runs
                on a transparent background kind, so that variable is
                `transparent` here and the list would scroll clean through the
                footer instead of behind it. */}
            <PageStickyFooter
              lineColor="transparent"
              style={{
                marginTop: 'auto',
                paddingTop: 16,
                paddingBottom: 24,
                backgroundColor: 'var(--light-background-transparent)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <Button
                kind="primary"
                onClick={() => {
                  dialogRef.current?.close();
                }}
              >
                Got it!
              </Button>
            </PageStickyFooter>
          </>
        )}
      />
    </>
  );
}

const COPY_ICON_VARIANTS = {
  shown: { opacity: 1, filter: 'blur(0px)', scale: 1 },
  hidden: { opacity: 0, filter: 'blur(3px)', scale: 0.85 },
};

const COPY_ICON_TRANSITION = { duration: 0.18, ease: 'easeOut' } as const;

// Both icons stay mounted and cross-fade in place instead of swapping through
// `AnimatePresence`: the row can be clicked again while the previous fade is
// still running, and an exiting node would linger on top of the new one.
function CopyStateIcon({ isCopied }: { isCopied: boolean }) {
  return (
    <span className={styles.copyIcon}>
      <motion.span
        className={styles.copyIconLayer}
        variants={COPY_ICON_VARIANTS}
        initial={false}
        animate={isCopied ? 'hidden' : 'shown'}
        transition={COPY_ICON_TRANSITION}
        style={{ color: 'var(--neutral-600)' }}
      >
        <CopyIcon style={{ display: 'block', width: 20, height: 20 }} />
      </motion.span>
      <motion.span
        className={styles.copyIconLayer}
        variants={COPY_ICON_VARIANTS}
        initial={false}
        animate={isCopied ? 'shown' : 'hidden'}
        transition={COPY_ICON_TRANSITION}
        style={{ color: 'var(--positive-500)' }}
      >
        <CheckIcon style={{ display: 'block', width: 20, height: 20 }} />
      </motion.span>
    </span>
  );
}

function PayloadRow({
  label,
  title,
  value,
  copyText,
  /** Full addresses are never abbreviated — they fold onto a second line
      instead of being clipped. */
  wrapValue = false,
}: {
  label: string;
  title: string;
  value: string;
  copyText: string;
  wrapValue?: boolean;
}) {
  // The copy state lives on the row rather than in the parent so the tick only
  // ever appears on the control that was actually pressed.
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: copyText });

  return (
    <UnstyledButton
      className={styles.payloadRow}
      title={title}
      onClick={handleCopy}
    >
      <VStack gap={2} style={{ minWidth: 0 }}>
        <UIText kind="caption/regular" color="var(--neutral-600)">
          {label}
        </UIText>
        <UIText
          kind="caption/accent"
          style={
            wrapValue
              ? { wordBreak: 'break-all' }
              : {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }
          }
        >
          {value}
        </UIText>
      </VStack>
      <CopyStateIcon isCopied={isSuccess} />
    </UnstyledButton>
  );
}

// `useProfileName` can return a locally saved nickname or a truncated address,
// and neither of those resolves as a profile URL — only a domain-shaped handle
// (ENS, Lens, …) is safe to put in the path.
//
// Spelled out rather than written as one pattern: the obvious
// `/^[a-z0-9-]+(\.[a-z0-9-]+)+$/` nests quantifiers, which is a ReDoS shape.
const PATH_SAFE_HANDLE = /^[a-z0-9.-]+$/i;

function isDomainHandle(name: string) {
  return (
    PATH_SAFE_HANDLE.test(name) &&
    name.includes('.') &&
    !name.startsWith('.') &&
    !name.endsWith('.')
  );
}

export function AddressDetails({
  address,
  walletName,
}: {
  address: string;
  /** The wallet's locally saved nickname, when it has one. */
  walletName?: string | null;
}) {
  const checksumAddress =
    getAddressType(address) === 'evm' ? toChecksumAddress(address) : address;

  // No `maxCharacters`: that middle-truncates by character count, which has no
  // idea how much room the heading actually has — a 28-character nickname loses
  // its middle while two thirds of the column sit empty. The name is passed
  // through whole and the row below ellipsises it only when it really overflows.
  const profileName = useProfileName(
    { address, name: walletName ?? null },
    { padding: 6 }
  );

  const truncatedAddress = middleTruncate({
    value: checksumAddress,
    leadingLettersCount: 6,
    trailingLettersCount: 4,
  });
  const profileHandle =
    profileName.type === WalletNameType.domain &&
    isDomainHandle(profileName.value)
      ? profileName.value
      : null;
  const profilePath = profileHandle ?? checksumAddress;
  const profileLabel = `${ZERION_HOST}/${profileHandle ?? truncatedAddress}`;

  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: checksumAddress,
  });

  return (
    // No `textAlign: 'center'`: `justifyItems` already centres every row, and
    // the supported-networks dialog is a child of this stack — it would inherit
    // the alignment and centre its own left-aligned copy.
    <VStack gap={20} style={{ justifyItems: 'center' }}>
      {/* `minmax(0, max-content)` rather than the HStack's default
          `minmax(min-content, max-content)`: min-content for a nowrap string is
          the whole string, so the default column can't shrink and the row would
          overflow the page instead of ellipsising. Capped at the full width, so
          a short name still sizes to its content and stays centred. */}
      <HStack
        gap={12}
        alignItems="center"
        style={{
          maxWidth: '100%',
          gridTemplateColumns: 'auto minmax(0, max-content)',
        }}
      >
        <div className={styles.avatarRing}>
          <WalletAvatar
            active={false}
            address={address}
            size={32}
            borderRadius={8}
          />
        </div>
        <UIText kind="headline/h3" className={styles.walletName}>
          {profileName.value}
        </UIText>
      </HStack>

      <div className={styles.qrPlate}>
        <QRCode
          key={checksumAddress}
          value={checksumAddress}
          removeQrCodeBehindLogo={true}
          quietZone={QR_QUIET_ZONE}
          qrStyle="dots"
          eyeRadius={8}
          size={QR_SIZE}
          logoImage={ZerionLogoUrl}
          logoWidth={36}
          logoHeight={36}
          logoPadding={5}
          logoPaddingStyle="circle"
        />
      </div>

      <VStack gap={0} className={cx(styles.glass, styles.payloadPanel)}>
        <PayloadRow
          label="Wallet address"
          title="Copy address"
          value={checksumAddress}
          wrapValue={true}
          copyText={checksumAddress}
        />
        <div className={styles.payloadDivider} />
        <PayloadRow
          label="Zerion profile"
          title="Copy profile link"
          value={profileLabel}
          copyText={`${ZERION_ORIGIN}/${profilePath}`}
        />
      </VStack>

      <SupportedNetworks address={address} />

      <Button
        kind="primary"
        onClick={handleCopy}
        style={{ width: '100%', paddingInline: 16 }}
      >
        <HStack gap={8} alignItems="center" justifyContent="center">
          {isSuccess ? (
            <CheckIcon style={{ display: 'block', width: 20, height: 20 }} />
          ) : (
            <CopyIcon style={{ display: 'block', width: 20, height: 20 }} />
          )}
          <span>{isSuccess ? 'Copied' : 'Copy Address'}</span>
        </HStack>
      </Button>
    </VStack>
  );
}
