/**
 * NOTE:
 * Adapted from: https://github.com/lancedikson/bowser
 */

function getFirstMatch(regexp: RegExp, ua: string) {
  const match = ua.match(regexp);
  return (match && match.length > 0 && match[1]) || '';
}

function getSecondMatch(regexp: RegExp, ua: string) {
  const match = ua.match(regexp);
  return (match && match.length > 1 && match[2]) || '';
}

const commonVersionIdentifier = /version\/(\d+(\.?_?\d+)+)/i;

type BrowserInfo = {
  name: string;
  version?: string;
};

type BrowserParser = {
  test: RegExp[] | ((ua: string) => boolean);
  describe(ua: string): BrowserInfo;
};

const browsersList: BrowserParser[] = [
  /* Googlebot */
  {
    test: [/googlebot/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Googlebot',
      };
      const version =
        getFirstMatch(/googlebot\/(\d+(\.\d+))/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },

  /* Opera < 13.0 */
  {
    test: [/opera/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Opera',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:opera)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },

  /* Opera > 13.0 */
  {
    test: [/opr\/|opios/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Opera',
      };
      const version =
        getFirstMatch(/(?:opr|opios)[\s/](\S+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/SamsungBrowser/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Samsung Internet for Android',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:SamsungBrowser)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/Whale/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'NAVER Whale Browser',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:whale)[\s/](\d+(?:\.\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/MZBrowser/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'MZ Browser',
      };
      const version =
        getFirstMatch(/(?:MZBrowser)[\s/](\d+(?:\.\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/focus/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Focus',
      };
      const version =
        getFirstMatch(/(?:focus)[\s/](\d+(?:\.\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/swing/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Swing',
      };
      const version =
        getFirstMatch(/(?:swing)[\s/](\d+(?:\.\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/coast/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Opera Coast',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:coast)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/opt\/\d+(?:.?_?\d+)+/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Opera Touch',
      };
      const version =
        getFirstMatch(/(?:opt)[\s/](\d+(\.?_?\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/yabrowser/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Yandex Browser',
      };
      const version =
        getFirstMatch(/(?:yabrowser)[\s/](\d+(\.?_?\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/ucbrowser/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'UC Browser',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:ucbrowser)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/Maxthon|mxios/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Maxthon',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:Maxthon|mxios)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/epiphany/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Epiphany',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:epiphany)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/puffin/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Puffin',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:puffin)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/sleipnir/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Sleipnir',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:sleipnir)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/k-meleon/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'K-Meleon',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/(?:k-meleon)[\s/](\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/micromessenger/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'WeChat',
      };
      const version =
        getFirstMatch(/(?:micromessenger)[\s/](\d+(\.?_?\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/qqbrowser/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: /qqbrowserlite/i.test(ua) ? 'QQ Browser Lite' : 'QQ Browser',
      };
      const version =
        getFirstMatch(/(?:qqbrowserlite|qqbrowser)[/](\d+(\.?_?\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/msie|trident/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Internet Explorer',
      };
      const version = getFirstMatch(/(?:msie |rv:)(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/\sedg\//i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Microsoft Edge',
      };

      const version = getFirstMatch(/\sedg\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/edg([ea]|ios)/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Microsoft Edge',
      };

      const version = getSecondMatch(/edg([ea]|ios)\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/vivaldi/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Vivaldi',
      };
      const version = getFirstMatch(/vivaldi\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/seamonkey/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'SeaMonkey',
      };
      const version = getFirstMatch(/seamonkey\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/sailfish/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Sailfish',
      };

      const version = getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/silk/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Amazon Silk',
      };
      const version = getFirstMatch(/silk\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/phantom/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'PhantomJS',
      };
      const version = getFirstMatch(/phantomjs\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/slimerjs/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'SlimerJS',
      };
      const version = getFirstMatch(/slimerjs\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/blackberry|\bbb\d+/i, /rim\stablet/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'BlackBerry',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/blackberry[\d]+\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/(web|hpw)[o0]s/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'WebOS Browser',
      };
      const version =
        getFirstMatch(commonVersionIdentifier, ua) ||
        getFirstMatch(/w(?:eb)?[o0]sbrowser\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/bada/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Bada',
      };
      const version = getFirstMatch(/dolfin\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/tizen/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Tizen',
      };
      const version =
        getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.?_?\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/qupzilla/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'QupZilla',
      };
      const version =
        getFirstMatch(/(?:qupzilla)[\s/](\d+(\.?_?\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/firefox|iceweasel|fxios/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Firefox',
      };
      const version = getFirstMatch(
        /(?:firefox|iceweasel|fxios)[\s/](\d+(\.?_?\d+)+)/i,
        ua
      );

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/electron/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Electron',
      };
      const version = getFirstMatch(/(?:electron)\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/MiuiBrowser/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Miui',
      };
      const version = getFirstMatch(
        /(?:MiuiBrowser)[\s/](\d+(\.?_?\d+)+)/i,
        ua
      );

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/chromium/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Chromium',
      };
      const version =
        getFirstMatch(/(?:chromium)[\s/](\d+(\.?_?\d+)+)/i, ua) ||
        getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/chrome|crios|crmo/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Chrome',
      };
      const version = getFirstMatch(
        /(?:chrome|crios|crmo)\/(\d+(\.?_?\d+)+)/i,
        ua
      );

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },
  {
    test: [/GSA/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Google Search',
      };
      const version = getFirstMatch(/(?:GSA)\/(\d+(\.?_?\d+)+)/i, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },

  /* Android Browser */
  {
    test(ua) {
      const notLikeAndroid = !/like android/i.test(ua);
      const butAndroid = /android/i.test(ua);
      return notLikeAndroid && butAndroid;
    },
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Android Browser',
      };
      const version = getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },

  /* PlayStation 4 */
  {
    test: [/playstation 4/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'PlayStation 4',
      };
      const version = getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },

  /* Safari */
  {
    test: [/safari|applewebkit/i],
    describe(ua) {
      const browser: BrowserInfo = {
        name: 'Safari',
      };
      const version = getFirstMatch(commonVersionIdentifier, ua);

      if (version) {
        browser.version = version;
      }

      return browser;
    },
  },

  /* Something else */
  {
    test: [/.*/i],
    describe(ua) {
      /* Here we try to make sure that there are explicit details about the device
       * in order to decide what regexp exactly we want to apply
       * (as there is a specific decision based on that conclusion)
       */
      const regexpWithoutDeviceSpec = /^(.*)\/(.*) /;
      const regexpWithDeviceSpec = /^(.*)\/(.*)[ \t]\((.*)/;
      const hasDeviceSpec = ua.search('\\(') !== -1;
      const regexp = hasDeviceSpec
        ? regexpWithDeviceSpec
        : regexpWithoutDeviceSpec;
      return {
        name: getFirstMatch(regexp, ua),
        version: getSecondMatch(regexp, ua),
      };
    },
  },
];

export function detectBrowser(userAgent: string) {
  const browserParser = browsersList.find((_browser) => {
    if (typeof _browser.test === 'function') {
      return _browser.test(userAgent);
    }

    if (_browser.test instanceof Array) {
      return _browser.test.some((condition) => condition.test(userAgent));
    }
  });
  return browserParser?.describe(userAgent) || { name: 'Unknown browser' };
}
