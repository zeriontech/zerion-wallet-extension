import { PersistentStore } from 'src/modules/persistent-store';
import { version as currentVersion } from '../packageVersion';

interface State {
  packageVersion: string;
}

class PackageVersionStore extends PersistentStore<State> {
  static initialState: State = { packageVersion: currentVersion };
  static key = 'package-version';

  previousVersion: null | string = null;

  constructor(
    initialState = PackageVersionStore.initialState,
    key = PackageVersionStore.key
  ) {
    super(initialState, key);
    this.initialize();
  }

  async initialize() {
    const { packageVersion: lastKnownVersion } = await this.getSavedState();

    if (lastKnownVersion !== currentVersion) {
      this.previousVersion = lastKnownVersion;
      this.setState({ packageVersion: currentVersion });
      // TODO: we can emit a "package version update" event here if we need it
    }
  }
}

export const packageVersionStore = new PackageVersionStore();
