import { describe, expect, it } from 'vitest';
import { isClassProperty } from './isClassProperty';

describe('isClassProperty', () => {
  class Hello {
    world() {
      return 1;
    }

    doSomething() {
      return 1;
    }
  }

  class HelloShadow {
    toString() {
      return 'shadowed toString';
    }
  }

  class HelloInstanceMethod {
    boundMethod: () => number;
    getColor?: () => string;

    constructor() {
      this.boundMethod = () => 42;
    }
  }

  it('should return true for class methods', () => {
    const hello = new Hello();
    expect(isClassProperty(hello, 'world')).toBe(true);
    expect(isClassProperty(hello, 'doSomething')).toBe(true);
  });

  it('should return false for Object.prototype methods', () => {
    const hello = new Hello();
    expect(isClassProperty(hello, 'toString')).toBe(false);
    expect(isClassProperty(hello, 'hasOwnProperty')).toBe(false);
  });

  it('should return true for class methods which shadow built in methods', () => {
    const helloShadow = new HelloShadow();
    expect(isClassProperty(helloShadow, 'toString')).toBe(true);
    expect(isClassProperty(helloShadow, 'hasOwnProperty')).toBe(false);
  });

  it('should return true for instance methods', () => {
    const helloInstanceMethod = new HelloInstanceMethod();
    helloInstanceMethod.getColor = () => 'magenta';
    expect(isClassProperty(helloInstanceMethod, 'boundMethod')).toBe(true);
    // @ts-ignore
    expect(isClassProperty(helloInstanceMethod, 'getColor')).toBe(true);
  });
});
