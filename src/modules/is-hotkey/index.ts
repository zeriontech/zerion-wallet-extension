/**
 * Adapted from https://github.com/ianstormtaylor/is-hotkey:
 * https://github.com/ianstormtaylor/is-hotkey/blob/730069441246b765d6a06189d0a5f58c8c598ab9/src/index.js
 */

const IS_MAC =
  typeof window != 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);

const MODIFIERS: Record<string, string | undefined> = {
  alt: 'altKey',
  control: 'ctrlKey',
  meta: 'metaKey',
  shift: 'shiftKey',
};

const ALIASES: Record<string, string | undefined> = {
  add: '+',
  break: 'pause',
  cmd: 'meta',
  command: 'meta',
  ctl: 'control',
  ctrl: 'control',
  del: 'delete',
  down: 'arrowdown',
  esc: 'escape',
  ins: 'insert',
  left: 'arrowleft',
  mod: IS_MAC ? 'meta' : 'control',
  opt: 'alt',
  option: 'alt',
  return: 'enter',
  right: 'arrowright',
  space: ' ',
  spacebar: ' ',
  up: 'arrowup',
  win: 'meta',
  windows: 'meta',
};

const CODES: Record<string, number | undefined> = {
  backspace: 8,
  tab: 9,
  enter: 13,
  shift: 16,
  control: 17,
  alt: 18,
  pause: 19,
  capslock: 20,
  escape: 27,
  ' ': 32,
  pageup: 33,
  pagedown: 34,
  end: 35,
  home: 36,
  arrowleft: 37,
  arrowup: 38,
  arrowright: 39,
  arrowdown: 40,
  insert: 45,
  delete: 46,
  meta: 91,
  numlock: 144,
  scrolllock: 145,
  ';': 186,
  '=': 187,
  ',': 188,
  '-': 189,
  '.': 190,
  '/': 191,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222,
};

for (let f = 1; f < 20; f++) {
  CODES['f' + f] = 111 + f;
}

interface Options {
  byKey: boolean;
}

function toKeyName(value: string): string {
  const name = value.toLowerCase() as keyof typeof ALIASES;
  return ALIASES[name] || name;
}

function toKeyCode(value: string) {
  const name = toKeyName(value);
  const code = CODES[name] || name.toUpperCase().charCodeAt(0);
  return code;
}

type Parsed = Record<string, boolean | string | number | null>;

function compareHotkey(object: Parsed, event: KeyboardEvent) {
  for (const key in object) {
    const expected = object[key];
    let actual;

    if (expected == null) {
      continue;
    }

    if (key === 'key' && event.key != null) {
      actual = event.key.toLowerCase();
    } else if (key === 'which') {
      actual = expected === 91 && event.which === 93 ? 91 : event.which;
    } else {
      actual = event[key as keyof typeof event];
    }

    if (actual == null && expected === false) {
      continue;
    }

    if (actual !== expected) {
      return false;
    }
  }

  return true;
}

function parseHotkey(value: string, options: null | Options) {
  const byKey = options && options.byKey;
  const ret: Parsed = {};

  // Special case to handle the `+` key since we use it as a separator.
  const hotkey = value.replace('++', '+add');
  const values = hotkey.split('+');
  const { length } = values;

  // Ensure that all the modifiers are set to false unless the hotkey has them.
  for (const k in MODIFIERS) {
    ret[MODIFIERS[k] as string] = false;
  }

  for (let value of values) {
    const optional = value.endsWith('?') && value.length > 1;

    if (optional) {
      value = value.slice(0, -1);
    }

    const name = toKeyName(value);
    const modifier = MODIFIERS[name];

    if (value.length > 1 && !modifier && !ALIASES[value] && !CODES[name]) {
      throw new TypeError(`Unknown modifier: "${value}"`);
    }

    if (length === 1 || !modifier) {
      if (byKey) {
        ret.key = name;
      } else {
        ret.which = toKeyCode(value);
      }
    }

    if (modifier) {
      ret[modifier] = optional ? null : true;
    }
  }

  return ret;
}

function isHotkey(
  hotkey: string | string[],
  event: KeyboardEvent,
  options?: Options
) {
  if (!Array.isArray(hotkey)) {
    hotkey = [hotkey];
  }

  const array = hotkey.map((string) => parseHotkey(string, options ?? null));
  const check = (e: KeyboardEvent) =>
    array.some((object) => compareHotkey(object, e));
  return check(event);
}

export { isHotkey, parseHotkey, compareHotkey, toKeyCode, toKeyName };
