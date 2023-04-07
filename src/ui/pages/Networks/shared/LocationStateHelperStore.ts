import { Store } from 'store-unit';
import type { Chain } from 'src/modules/networks/Chain';

interface LocationStateHelper {
  itemCreateSuccess: Chain | null;
}

export class LocationStateHelperStore extends Store<LocationStateHelper> {}
