import React, { useRef } from 'react';
import { invariant } from 'src/shared/invariant';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import type { UITextProps } from 'src/ui/ui-kit/UIText';
import { UIText } from 'src/ui/ui-kit/UIText';
import { maybeOpenOboarding } from 'src/ui/Onboarding/initialization';
import { templateData } from 'src/ui/shared/getPageTemplateName';
import { emitter } from 'src/ui/shared/events';
import { EraseDataConfirmationDialog } from './EraseDataConfirmationDialog';
import { EraseDataInProgress } from './EraseDataInProgress';
import { useEraseDataMutation } from './useEraseDataMutation';

export function EraseDataListButton({
  textKind,
}: {
  textKind: UITextProps['kind'];
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const eraseAllData = useEraseDataMutation({
    onSuccess: () => {
      if (templateData.windowContext === 'tab') {
        emitter.emit('reloadExtension');
      } else {
        maybeOpenOboarding();
      }
    },
  });
  if (eraseAllData.isLoading) {
    return (
      <CenteredDialog
        open={true}
        style={{
          // When ManageWallets View is long, we see its bottom part peeking under
          // this dialog. Fixed positioning fixes this.
          position: 'fixed',
        }}
      >
        <EraseDataInProgress />
      </CenteredDialog>
    );
  }
  return (
    <>
      <EraseDataConfirmationDialog ref={dialogRef} />
      <SurfaceList
        items={[
          {
            key: 0,
            onClick: () => {
              invariant(dialogRef.current, 'dialog element must be mounted');
              showConfirmDialog(dialogRef.current).then(() => {
                eraseAllData.mutate();
              });
            },
            component: (
              <UIText kind={textKind} color="var(--negative-500)">
                Erase All Data
              </UIText>
            ),
          },
        ]}
      />
    </>
  );
}
