import React, { useRef } from 'react';
import { useMutation } from 'react-query';
import { useSelect } from 'downshift';
import { profileManager } from 'src/shared/profileSevice';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import EditIcon from 'jsx:src/ui/assets/edit.svg';
import PersonIcon from 'jsx:src/ui/assets/person.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { NFTSelector } from '../NFTSelector';
import * as styles from './styles.module.css';

type AvatarMenuItem = 'edit' | 'remove';
const MENU_ITEMS: AvatarMenuItem[] = ['edit', 'remove'];
const MENU_ITEM_TO_TITLE: Record<AvatarMenuItem, string> = {
  edit: 'Set New NFT',
  remove: 'Remove Avatar',
};

function SetNFTAsAvatarMenu({
  children,
  onEdit,
  onRemove,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onEdit(): void;
  onRemove(): void;
}) {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    highlightedIndex,
  } = useSelect<AvatarMenuItem>({
    items: MENU_ITEMS,
    selectedItem: null,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem === 'edit') {
        onEdit();
      }
      if (selectedItem === 'remove') {
        onRemove();
      }
      return;
    },
  });

  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <UnstyledButton
        {...props}
        className={styles.wrapper}
        {...getToggleButtonProps({})}
      >
        {children}
        <div className={styles.overlay}>
          <div className={styles.edit}>
            <EditIcon />
          </div>
        </div>
      </UnstyledButton>
      <div
        {...getMenuProps()}
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'absolute',
          top: 'calc(100% - 12px)',
          left: 16,
          background: 'var(--white)',
          boxShadow: '0px 8px 16px rgba(22, 22, 26, 0.16)',
          borderRadius: 8,
          width: 180,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <SurfaceList
          items={MENU_ITEMS.map((item, index) => ({
            key: item,
            isInteractive: true,
            pad: false,
            separatorTop: false,
            component: (
              <SurfaceItemButton
                style={{
                  backgroundColor:
                    highlightedIndex === index
                      ? 'var(--neutral-200)'
                      : undefined,
                }}
                {...getItemProps({ item, index })}
              >
                <HStack gap={8} alignItems="center">
                  {item === 'edit' ? <PersonIcon /> : <CloseIcon />}
                  <span>{MENU_ITEM_TO_TITLE[item]}</span>
                </HStack>
              </SurfaceItemButton>
            ),
          }))}
        />
      </div>
    </div>
  );
}

export function SetNFTAsAvatarWrapper({
  children,
  value,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }) {
  const ref = useRef<HTMLDialogElementInterface | null>(null);
  const { singleAddress } = useAddressParams();
  const { mutate: updateAvatar, isLoading: isUpdating } = useMutation(
    async (asset_code?: string) => {
      if (!asset_code) {
        return;
      }
      return profileManager.updateProfileAvatar(singleAddress, asset_code);
    }
  );

  const { mutate: removeAvatar, isLoading: isRemoving } = useMutation(
    async () => {
      return profileManager.removeProfileAvatar(singleAddress);
    }
  );

  if (disabled) {
    return children as JSX.Element;
  }

  if (isUpdating || isRemoving) {
    return (
      <UnstyledButton {...props} className={styles.wrapper}>
        {children}
        <div className={styles.overlay} style={{ display: 'flex' }}>
          <CircleSpinner />
        </div>
      </UnstyledButton>
    );
  }

  return (
    <>
      <CenteredDialog
        ref={ref}
        style={{
          backgroundColor: 'var(--neutral-100)',
          padding: '16px 16px 0',
        }}
      >
        <DialogTitle
          title={<UIText kind="subtitle/m_med">Set New NFT as Avatar</UIText>}
        />
        <Spacer height={24} />
        <NFTSelector
          key={value}
          defaultValue={value}
          onSubmit={(value) => {
            ref.current?.close();
            updateAvatar(value);
          }}
          onDismiss={() => ref.current?.close()}
        />
      </CenteredDialog>

      {value ? (
        <SetNFTAsAvatarMenu
          {...props}
          onEdit={() => {
            if (ref.current) {
              showConfirmDialog(ref.current);
            }
          }}
          onRemove={() => removeAvatar()}
        >
          {children}
        </SetNFTAsAvatarMenu>
      ) : (
        <UnstyledButton
          {...props}
          className={styles.wrapper}
          onClick={() => {
            if (ref.current) {
              showConfirmDialog(ref.current);
            }
          }}
        >
          {children}
          <div className={styles.overlay}>
            <div className={styles.edit}>
              <EditIcon />
            </div>
          </div>
        </UnstyledButton>
      )}
    </>
  );
}
