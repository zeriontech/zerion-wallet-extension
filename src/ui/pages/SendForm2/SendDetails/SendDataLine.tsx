import React, { useEffect, useState } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Button } from 'src/ui/ui-kit/Button';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { noValueDash } from 'src/ui/shared/typography';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import * as styles from './SendDetails.module.css';

/** First 5 characters of the stored value, with an ellipsis when truncated. */
function truncateData(value: string): string {
  return value.length > 5 ? `${value.slice(0, 5)}…` : value;
}

export function SendDataLine({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | undefined) => void;
}) {
  const dialog = useDialog2();
  const [draft, setDraft] = useState(value ?? '');

  // Start the editor from the persisted value each time it opens, discarding
  // any edits left over from a previous (closed-without-save) session.
  useEffect(() => {
    if (dialog.open) {
      setDraft(value ?? '');
    }
  }, [dialog.open, value]);

  return (
    <>
      <UnstyledButton
        type="button"
        className={styles.detailLinkRow}
        onClick={dialog.openDialog}
      >
        <HStack gap={8} justifyContent="space-between" alignItems="center">
          <UIText kind="small/regular">Data</UIText>
          <HStack gap={4} alignItems="center">
            <UIText kind="small/accent">
              {value ? truncateData(value) : noValueDash}
            </UIText>
            <ChevronRightIcon className={styles.detailLinkChevron} />
          </HStack>
        </HStack>
      </UnstyledButton>
      <Dialog2
        open={dialog.open}
        onClose={dialog.closeDialog}
        title="Data"
        size="content"
      >
        <form
          style={{ padding: 16, paddingTop: 0 }}
          onSubmit={(event) => {
            event.preventDefault();
            onChange(draft ? draft : undefined);
            dialog.closeDialog();
          }}
        >
          <VStack gap={16}>
            <UIText kind="small/accent" color="var(--neutral-600)">
              Advanced Feature: Use with Caution
            </UIText>
            <textarea
              name="data"
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              className={styles.dataInput}
              rows={3}
              placeholder="0x..."
              spellCheck={false}
              autoComplete="off"
            />
            <HStack gap={8} style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Button
                kind="regular"
                type="button"
                onClick={() => {
                  onChange(undefined);
                  dialog.closeDialog();
                }}
              >
                Reset
              </Button>
              <Button kind="primary">Save</Button>
            </HStack>
          </VStack>
        </form>
      </Dialog2>
    </>
  );
}
