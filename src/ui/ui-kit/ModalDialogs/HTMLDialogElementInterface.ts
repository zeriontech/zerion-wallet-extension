export interface HTMLDialogElementInterface extends HTMLElement {
  showModal(): void;
  close(): void;
  show(): void;
  requestClose(): void;
  open: boolean;
  returnValue: string;
}
