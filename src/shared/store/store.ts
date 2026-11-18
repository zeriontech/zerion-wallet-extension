import { createNanoEvents, type Emitter } from 'nanoevents';

interface Events<State> {
  change: (state: State, prevState: State) => void;
}

export interface SetStateAction<S> {
  (state: S): S;
}

function isSetStateAction<S>(x: S | SetStateAction<S>): x is SetStateAction<S> {
  return typeof x === 'function';
}

/**
 * Minimal observable store, vendored from store-unit 1.1 (MIT).
 * Kept local because the package has very low usage and is a core primitive.
 */
export class Store<S> {
  state: S;
  private emitter: Emitter<Events<S>>;

  constructor(initialState: S) {
    this.state = initialState;
    this.emitter = createNanoEvents<Events<S>>();
  }

  on<K extends keyof Events<S>>(event: K, cb: Events<S>[K]) {
    return this.emitter.on(event, cb);
  }

  getState() {
    return this.state;
  }

  setState(stateOrStateSetter: S | SetStateAction<S>) {
    const newState = isSetStateAction(stateOrStateSetter)
      ? stateOrStateSetter(this.state)
      : stateOrStateSetter;
    if (newState === this.state) {
      return;
    }
    const prevState = this.state;
    this.state = newState;
    this.emitter.emit('change', this.state, prevState);
  }

  setStateSilent(state: S) {
    this.state = state;
  }
}

export class FormDataStore<
  FormDataObject extends { [key: string]: unknown },
> extends Store<FormDataObject> {
  initialState: FormDataObject;

  constructor(initialState: FormDataObject) {
    super(initialState);
    this.initialState = initialState;
  }

  setValue = (key: keyof FormDataObject, value: FormDataObject[keyof FormDataObject]) => {
    this.setState((state) => (state[key] === value ? state : { ...state, [key]: value }));
  };

  handleChange = (event: Event) => {
    if (event.currentTarget) {
      const target = event.currentTarget as HTMLInputElement | HTMLSelectElement;
      this.setValue(
        target.name as keyof FormDataObject,
        target.value as FormDataObject[keyof FormDataObject],
      );
    }
  };

  reset = () => {
    this.setState(this.initialState);
  };
}
