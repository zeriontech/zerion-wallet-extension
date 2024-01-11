export class Disposable {
  private disposables: Array<() => void> = [];

  add(disposable: () => void) {
    this.disposables.push(disposable);
  }

  clearAll() {
    this.disposables.forEach((disposable) => disposable());
    this.disposables.length = 0;
  }
}
