import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import IconClose from 'jsx:src/ui/assets/close.svg';

export enum DialogButtonValue {
  cancel = 'cancel',
}

export function DialogTitle({
  title,
  alignTitle = 'center',
  closeKind = 'icon',
}: {
  title: React.ReactNode;
  alignTitle?: 'start' | 'center';
  closeKind?: 'text' | 'icon';
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns:
          alignTitle === 'center' ? '1fr 4fr 1fr' : 'max-content 1fr',
      }}
    >
      <div
        style={{
          gridColumnStart: alignTitle === 'center' ? 2 : 1,
          placeSelf: 'center',
        }}
      >
        {title}
      </div>
      <form
        method="dialog"
        style={{ placeSelf: 'end' }}
        onSubmit={(event) => {
          /**
           * We have to call stopPropagation() for cases where the dialog is rendered inside another form
           * using a portal, e.g.:
            <form>
              <Portal>
                <dialog>
                  <form>
                    <button value="cancel">Close</button>
                  </form>
                </dialog>
              </Portal>
            </form>
           * The submit event of the inner form propagates to the outer form
           * which is intended React behavior: https://legacy.reactjs.org/docs/portals.html#event-bubbling-through-portals
           * But that's exactly the behavior we're trying to avoid by using a portal: we need a dialog form
           * to be unrelated to the outer form.
           */
          event.stopPropagation();
        }}
      >
        <Button
          kind="ghost"
          value={DialogButtonValue.cancel}
          aria-label="Close"
          style={
            closeKind === 'text'
              ? { color: 'var(--primary)', fontWeight: 400 }
              : { padding: 4, position: 'absolute', top: -8, right: -8 }
          }
          size={32}
        >
          {closeKind === 'text' ? (
            'Close'
          ) : (
            <IconClose
              role="presentation"
              style={{ display: 'block', marginInline: 'auto' }}
            />
          )}
        </Button>
      </form>
    </div>
  );
}
