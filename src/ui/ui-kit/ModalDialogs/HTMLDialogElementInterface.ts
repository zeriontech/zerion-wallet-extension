export interface HTMLDialogElementInterface extends HTMLElement {
  showModal(): void;
  close(): void;
  show(): void;
  open: boolean;
  returnValue: string;
}
