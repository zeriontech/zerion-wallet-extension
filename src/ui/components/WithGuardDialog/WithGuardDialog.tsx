import React, { useRef } from 'react';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Button } from 'src/ui/ui-kit/Button';
import { focusNode } from 'src/ui/shared/focusNode';
import { UIText } from 'src/ui/ui-kit/UIText';
import { invariant } from 'src/shared/invariant';
import { WarningIcon } from 'src/ui/components/WarningIcon';

const GuardDialog = React.forwardRef<
  HTMLDialogElementInterface,
  { title: React.ReactNode; message: React.ReactNode }
>(({ title, message }, ref) => {
  return (
    <BottomSheetDialog
      ref={ref}
      containerStyle={{ padding: 16 }}
      height="fit-content"
      renderWhenOpen={() => (
        <div style={{ textAlign: 'start' }}>
          <UIText kind="headline/h3">
            <DialogTitle title={null} alignTitle="start" closeKind="icon" />
          </UIText>
          <Spacer height={8} />
          <WarningIcon
            kind="neutral"
            size={44}
            glow={true}
            outlineStrokeWidth={7}
          />
          <Spacer height={16} />
          <UIText kind="headline/h3">{title}</UIText>
          <Spacer height={8} />
          <UIText kind="body/regular">{message}</UIText>
          <Spacer height={24} />
          <form method="dialog" style={{ display: 'grid' }}>
            <Button kind="primary" ref={focusNode} value="cancel">
              Ok
            </Button>
          </form>
        </div>
      )}
    />
  );
});

type ClickHandler<T extends 'button' | 'a'> = T extends 'a'
  ? React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick']
  : React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];

type ClickEvent<T extends 'button' | 'a'> = Parameters<
  NonNullable<ClickHandler<T>>
>[0];

export function WithGuardDialog<T extends 'button' | 'a'>({
  onClick,
  message,
  title,
  isWarning,
  render,
}: {
  onClick?: ClickHandler<T>;
  message: React.ReactNode;
  title: React.ReactNode;
  isWarning: boolean;
  render: (props: {
    handleClick: NonNullable<ClickHandler<T>>;
  }) => React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  return (
    <>
      {isWarning ? (
        <GuardDialog ref={dialogRef} message={message} title={title} />
      ) : null}
      {render({
        handleClick: (event: ClickEvent<T>) => {
          if (isWarning) {
            invariant(dialogRef.current, 'Dialog not mounted');
            event.preventDefault();
            dialogRef.current.showModal();
          } else {
            // @ts-ignore
            onClick?.(event);
          }
        },
      })}
    </>
  );
}
