import { PersistentStore } from '../persistent-store';

interface State {
  checkedWebsites: Record<string, boolean>;
  ignoredWebsites: Record<string, boolean>;
}

const initialState: State = {
  checkedWebsites: {},
  ignoredWebsites: {},
};

class FishingDefenceStore extends PersistentStore<State> {
  constructor() {
    super(initialState, 'fishing-defence');
  }
}

export const fishingDefenceStore = new FishingDefenceStore();
