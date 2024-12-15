import { invariant } from './invariant';

/** TODO: Write Type Tests */
export function assertProp<T extends object, K extends keyof T>(
  value: T,
  prop: K
): asserts value is T & { [P in K]-?: NonNullable<T[P]> } {
  invariant(
    prop in value && value[prop] != null,
    `Missing property: ${String(prop)}`
  );
}

// Test Cases:
// interface SomeObj {
//   prop0?: string | null;
//   prop1?: string;
//   prop2: number;
//   prop3?: boolean;
//   prop4: number;
// }

// const obj: SomeObj = { prop2: 2, prop4: 4 };

// assertProp(obj, 'prop1'); // make prop1 required

// obj.prop0; // expected: string | null |undefined
// obj.prop1; // expected: string
// obj.prop2; // expected: number
// obj.prop3; // expected: boolean | undefined
// obj.prop4; // expected: number
