/** `(key, value) => void` for one field of a form's state, with the value typed by the key */
export type FormChangeHandler<State> = <K extends keyof State>(key: K, value: State[K]) => void;
