import React from 'react';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import ShieldWarningIcon from 'jsx:src/ui/assets/shield-warning.svg';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import * as styles from './UnverifiedWarning.module.css';

export function UnverifiedWarning() {
  const dialog = useDialog2();

  return (
    <>
      <button
        type="button"
        className={styles.banner}
        onClick={dialog.openDialog}
      >
        <UIText
          kind="small/accent"
          color="currentColor"
          className={styles.bannerLabel}
        >
          Transaction Unverified
        </UIText>
        <ChevronDownIcon className={styles.bannerChevron} />
      </button>
      <Dialog2
        open={dialog.open}
        onClose={dialog.closeDialog}
        title="Transaction Unverified"
        size="content"
        autoFocusInput={false}
        style={{
          backgroundImage:
            'linear-gradient(121deg, var(--primary-200) 0%, var(--primary-300) 100%)',
        }}
      >
        <div className={styles.dialogContent}>
          <ShieldWarningIcon
            className={styles.dialogIllustration}
            aria-hidden="true"
          />
          <div className={styles.dialogBody}>
            <UIText kind="body/regular">
              We were unable to simulate the transaction or complete all
              security checks. Please proceed with caution.
            </UIText>
            <UIText kind="body/regular">
              Security checks are powered by Blockaid.
            </UIText>
          </div>
        </div>
      </Dialog2>
    </>
  );
}
