import { createNanoEvents } from 'nanoevents';

export const emitter = createNanoEvents<{
  assetPriceSelected: (formattedPrice: string) => void;
}>();
