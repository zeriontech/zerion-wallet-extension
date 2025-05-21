import { PersistentStore } from 'src/modules/persistent-store';
import { invariant } from 'src/shared/invariant';

export class DeviceIdStore extends PersistentStore<string | undefined> {
  constructor() {
    super(undefined, 'deviceUUID');
    this.ready().then(() => {
      const value = this.getState();
      if (!value) {
        this.setState(crypto.randomUUID());
      }
    });
  }

  async getSavedState() {
    const value = await super.getSavedState();
    invariant(value, 'value must be generated upon initialization');
    return value;
  }
}

export const deviceIdStore = new DeviceIdStore();
