// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"iRTcc":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
var _nanoid = require("nanoid");
var _webextensionPolyfill = require("webextension-polyfill");
var _webextensionPolyfillDefault = parcelHelpers.interopDefault(_webextensionPolyfill);
var _utils = require("@json-rpc-tools/utils");
// @ts-ignore parcel syntax for inlining: https://parceljs.org/features/bundle-inlining/#inlining-a-bundle-as-text
var _inPage = require("bundle-text:./in-page");
var _inPageDefault = parcelHelpers.interopDefault(_inPage);
const id = (0, _nanoid.nanoid)();
const broadcastChannel = new BroadcastChannel(id);
const port = (0, _webextensionPolyfillDefault.default).runtime.connect({
    name: `${(0, _webextensionPolyfillDefault.default).runtime.id}/ethereum`
});
port.onMessage.addListener((msg)=>{
    if ((0, _utils.isJsonRpcResponse)(msg)) broadcastChannel.postMessage(msg);
    else if (msg.type === "ethereumEvent") broadcastChannel.postMessage(msg);
    else console.log("ignored message"); // eslint-disable-line no-console
});
broadcastChannel.addEventListener("message", (event)=>{
    const { data  } = event;
    if ((0, _utils.isJsonRpcRequest)(data)) port.postMessage(data);
    else console.log("not a JsonRpcRequest"); // eslint-disable-line no-console
});
// Insert script with ethereum provider _after_ creating a BroadcastChannel
let content = `window.myWalletChannelId = "${id}";;`;
content += (0, _inPageDefault.default);
const script = document.createElement("script");
script.textContent = content;
script.dataset.walletExtension = "true";
const container = document.head || document.documentElement;
container.appendChild(script);

},{"nanoid":"E2pqo","webextension-polyfill":"irfe7","@json-rpc-tools/utils":"h6aFv","bundle-text:./in-page":"9scsm","@parcel/transformer-js/src/esmodule-helpers.js":"boKlo"}],"E2pqo":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "urlAlphabet", ()=>(0, _indexJs.urlAlphabet));
parcelHelpers.export(exports, "random", ()=>random);
parcelHelpers.export(exports, "customRandom", ()=>customRandom);
parcelHelpers.export(exports, "customAlphabet", ()=>customAlphabet);
parcelHelpers.export(exports, "nanoid", ()=>nanoid);
var _indexJs = require("./url-alphabet/index.js");
let random = (bytes)=>crypto.getRandomValues(new Uint8Array(bytes));
let customRandom = (alphabet, defaultSize, getRandom)=>{
    let mask = (2 << Math.log(alphabet.length - 1) / Math.LN2) - 1;
    let step = -~(1.6 * mask * defaultSize / alphabet.length);
    return (size = defaultSize)=>{
        let id = "";
        while(true){
            let bytes = getRandom(step);
            let j = step;
            while(j--){
                id += alphabet[bytes[j] & mask] || "";
                if (id.length === size) return id;
            }
        }
    };
};
let customAlphabet = (alphabet, size = 21)=>customRandom(alphabet, size, random);
let nanoid = (size = 21)=>crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte)=>{
        byte &= 63;
        if (byte < 36) id += byte.toString(36);
        else if (byte < 62) id += (byte - 26).toString(36).toUpperCase();
        else if (byte > 62) id += "-";
        else id += "_";
        return id;
    }, "");

},{"./url-alphabet/index.js":false,"@parcel/transformer-js/src/esmodule-helpers.js":"boKlo"}],"boKlo":[function(require,module,exports) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, "__esModule", {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === "default" || key === "__esModule" || dest.hasOwnProperty(key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}],"irfe7":[function(require,module,exports) {
(function(global, factory) {
    if (typeof define === "function" && define.amd) define("webextension-polyfill", [
        "module"
    ], factory);
    else {
        var mod;
        factory(module);
    }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function(module) {
    /* webextension-polyfill - v0.10.0 - Fri Aug 12 2022 19:42:44 */ /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */ /* vim: set sts=2 sw=2 et tw=80: */ /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */ "use strict";
    if (!globalThis.chrome?.runtime?.id) throw new Error("This script should only be loaded in a browser extension.");
    if (typeof globalThis.browser === "undefined" || Object.getPrototypeOf(globalThis.browser) !== Object.prototype) {
        const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received."; // Wrapping the bulk of this polyfill in a one-time-use function is a minor
        // optimization for Firefox. Since Spidermonkey does not fully parse the
        // contents of a function until the first time it's called, and since it will
        // never actually need to be called, this allows the polyfill to be included
        // in Firefox nearly for free.
        const wrapAPIs = (extensionAPIs)=>{
            // NOTE: apiMetadata is associated to the content of the api-metadata.json file
            // at build time by replacing the following "include" with the content of the
            // JSON file.
            const apiMetadata = {
                "alarms": {
                    "clear": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "clearAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "get": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "getAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    }
                },
                "bookmarks": {
                    "create": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "get": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getChildren": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getRecent": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getSubTree": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getTree": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "move": {
                        "minArgs": 2,
                        "maxArgs": 2
                    },
                    "remove": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeTree": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "search": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "update": {
                        "minArgs": 2,
                        "maxArgs": 2
                    }
                },
                "browserAction": {
                    "disable": {
                        "minArgs": 0,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "enable": {
                        "minArgs": 0,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "getBadgeBackgroundColor": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getBadgeText": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getPopup": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getTitle": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "openPopup": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "setBadgeBackgroundColor": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "setBadgeText": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "setIcon": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "setPopup": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "setTitle": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    }
                },
                "browsingData": {
                    "remove": {
                        "minArgs": 2,
                        "maxArgs": 2
                    },
                    "removeCache": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeCookies": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeDownloads": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeFormData": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeHistory": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeLocalStorage": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removePasswords": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removePluginData": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "settings": {
                        "minArgs": 0,
                        "maxArgs": 0
                    }
                },
                "commands": {
                    "getAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    }
                },
                "contextMenus": {
                    "remove": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "update": {
                        "minArgs": 2,
                        "maxArgs": 2
                    }
                },
                "cookies": {
                    "get": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getAll": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getAllCookieStores": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "remove": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "set": {
                        "minArgs": 1,
                        "maxArgs": 1
                    }
                },
                "devtools": {
                    "inspectedWindow": {
                        "eval": {
                            "minArgs": 1,
                            "maxArgs": 2,
                            "singleCallbackArg": false
                        }
                    },
                    "panels": {
                        "create": {
                            "minArgs": 3,
                            "maxArgs": 3,
                            "singleCallbackArg": true
                        },
                        "elements": {
                            "createSidebarPane": {
                                "minArgs": 1,
                                "maxArgs": 1
                            }
                        }
                    }
                },
                "downloads": {
                    "cancel": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "download": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "erase": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getFileIcon": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "open": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "pause": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeFile": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "resume": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "search": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "show": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    }
                },
                "extension": {
                    "isAllowedFileSchemeAccess": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "isAllowedIncognitoAccess": {
                        "minArgs": 0,
                        "maxArgs": 0
                    }
                },
                "history": {
                    "addUrl": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "deleteAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "deleteRange": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "deleteUrl": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getVisits": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "search": {
                        "minArgs": 1,
                        "maxArgs": 1
                    }
                },
                "i18n": {
                    "detectLanguage": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getAcceptLanguages": {
                        "minArgs": 0,
                        "maxArgs": 0
                    }
                },
                "identity": {
                    "launchWebAuthFlow": {
                        "minArgs": 1,
                        "maxArgs": 1
                    }
                },
                "idle": {
                    "queryState": {
                        "minArgs": 1,
                        "maxArgs": 1
                    }
                },
                "management": {
                    "get": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "getSelf": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "setEnabled": {
                        "minArgs": 2,
                        "maxArgs": 2
                    },
                    "uninstallSelf": {
                        "minArgs": 0,
                        "maxArgs": 1
                    }
                },
                "notifications": {
                    "clear": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "create": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "getAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "getPermissionLevel": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "update": {
                        "minArgs": 2,
                        "maxArgs": 2
                    }
                },
                "pageAction": {
                    "getPopup": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getTitle": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "hide": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "setIcon": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "setPopup": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "setTitle": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    },
                    "show": {
                        "minArgs": 1,
                        "maxArgs": 1,
                        "fallbackToNoCallback": true
                    }
                },
                "permissions": {
                    "contains": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getAll": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "remove": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "request": {
                        "minArgs": 1,
                        "maxArgs": 1
                    }
                },
                "runtime": {
                    "getBackgroundPage": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "getPlatformInfo": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "openOptionsPage": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "requestUpdateCheck": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "sendMessage": {
                        "minArgs": 1,
                        "maxArgs": 3
                    },
                    "sendNativeMessage": {
                        "minArgs": 2,
                        "maxArgs": 2
                    },
                    "setUninstallURL": {
                        "minArgs": 1,
                        "maxArgs": 1
                    }
                },
                "sessions": {
                    "getDevices": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "getRecentlyClosed": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "restore": {
                        "minArgs": 0,
                        "maxArgs": 1
                    }
                },
                "storage": {
                    "local": {
                        "clear": {
                            "minArgs": 0,
                            "maxArgs": 0
                        },
                        "get": {
                            "minArgs": 0,
                            "maxArgs": 1
                        },
                        "getBytesInUse": {
                            "minArgs": 0,
                            "maxArgs": 1
                        },
                        "remove": {
                            "minArgs": 1,
                            "maxArgs": 1
                        },
                        "set": {
                            "minArgs": 1,
                            "maxArgs": 1
                        }
                    },
                    "managed": {
                        "get": {
                            "minArgs": 0,
                            "maxArgs": 1
                        },
                        "getBytesInUse": {
                            "minArgs": 0,
                            "maxArgs": 1
                        }
                    },
                    "sync": {
                        "clear": {
                            "minArgs": 0,
                            "maxArgs": 0
                        },
                        "get": {
                            "minArgs": 0,
                            "maxArgs": 1
                        },
                        "getBytesInUse": {
                            "minArgs": 0,
                            "maxArgs": 1
                        },
                        "remove": {
                            "minArgs": 1,
                            "maxArgs": 1
                        },
                        "set": {
                            "minArgs": 1,
                            "maxArgs": 1
                        }
                    }
                },
                "tabs": {
                    "captureVisibleTab": {
                        "minArgs": 0,
                        "maxArgs": 2
                    },
                    "create": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "detectLanguage": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "discard": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "duplicate": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "executeScript": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "get": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getCurrent": {
                        "minArgs": 0,
                        "maxArgs": 0
                    },
                    "getZoom": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "getZoomSettings": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "goBack": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "goForward": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "highlight": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "insertCSS": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "move": {
                        "minArgs": 2,
                        "maxArgs": 2
                    },
                    "query": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "reload": {
                        "minArgs": 0,
                        "maxArgs": 2
                    },
                    "remove": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "removeCSS": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "sendMessage": {
                        "minArgs": 2,
                        "maxArgs": 3
                    },
                    "setZoom": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "setZoomSettings": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "update": {
                        "minArgs": 1,
                        "maxArgs": 2
                    }
                },
                "topSites": {
                    "get": {
                        "minArgs": 0,
                        "maxArgs": 0
                    }
                },
                "webNavigation": {
                    "getAllFrames": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "getFrame": {
                        "minArgs": 1,
                        "maxArgs": 1
                    }
                },
                "webRequest": {
                    "handlerBehaviorChanged": {
                        "minArgs": 0,
                        "maxArgs": 0
                    }
                },
                "windows": {
                    "create": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "get": {
                        "minArgs": 1,
                        "maxArgs": 2
                    },
                    "getAll": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "getCurrent": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "getLastFocused": {
                        "minArgs": 0,
                        "maxArgs": 1
                    },
                    "remove": {
                        "minArgs": 1,
                        "maxArgs": 1
                    },
                    "update": {
                        "minArgs": 2,
                        "maxArgs": 2
                    }
                }
            };
            if (Object.keys(apiMetadata).length === 0) throw new Error("api-metadata.json has not been included in browser-polyfill");
            /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */ class DefaultWeakMap extends WeakMap {
                constructor(createItem, items){
                    super(items);
                    this.createItem = createItem;
                }
                get(key) {
                    if (!this.has(key)) this.set(key, this.createItem(key));
                    return super.get(key);
                }
            }
            /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */ const isThenable = (value)=>{
                return value && typeof value === "object" && typeof value.then === "function";
            };
            /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.reject
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function}
       *        The generated callback function.
       */ const makeCallback = (promise, metadata)=>{
                return (...callbackArgs)=>{
                    if (extensionAPIs.runtime.lastError) promise.reject(new Error(extensionAPIs.runtime.lastError.message));
                    else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) promise.resolve(callbackArgs[0]);
                    else promise.resolve(callbackArgs);
                };
            };
            const pluralizeArguments = (numArgs)=>numArgs == 1 ? "argument" : "arguments";
            /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */ const wrapAsyncFunction = (name, metadata)=>{
                return function asyncFunctionWrapper(target, ...args) {
                    if (args.length < metadata.minArgs) throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
                    if (args.length > metadata.maxArgs) throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
                    return new Promise((resolve, reject)=>{
                        if (metadata.fallbackToNoCallback) // This API method has currently no callback on Chrome, but it return a promise on Firefox,
                        // and so the polyfill will try to call it with a callback first, and it will fallback
                        // to not passing the callback if the first call fails.
                        try {
                            target[name](...args, makeCallback({
                                resolve,
                                reject
                            }, metadata));
                        } catch (cbError) {
                            console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                            target[name](...args); // Update the API method metadata, so that the next API calls will not try to
                            // use the unsupported callback anymore.
                            metadata.fallbackToNoCallback = false;
                            metadata.noCallback = true;
                            resolve();
                        }
                        else if (metadata.noCallback) {
                            target[name](...args);
                            resolve();
                        } else target[name](...args, makeCallback({
                            resolve,
                            reject
                        }, metadata));
                    });
                };
            };
            /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */ const wrapMethod = (target, method, wrapper)=>{
                return new Proxy(method, {
                    apply (targetMethod, thisObj, args) {
                        return wrapper.call(thisObj, target, ...args);
                    }
                });
            };
            let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
            /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */ const wrapObject = (target, wrappers = {}, metadata = {})=>{
                let cache = Object.create(null);
                let handlers = {
                    has (proxyTarget, prop) {
                        return prop in target || prop in cache;
                    },
                    get (proxyTarget, prop, receiver) {
                        if (prop in cache) return cache[prop];
                        if (!(prop in target)) return undefined;
                        let value1 = target[prop];
                        if (typeof value1 === "function") {
                            // This is a method on the underlying object. Check if we need to do
                            // any wrapping.
                            if (typeof wrappers[prop] === "function") // We have a special-case wrapper for this method.
                            value1 = wrapMethod(target, target[prop], wrappers[prop]);
                            else if (hasOwnProperty(metadata, prop)) {
                                // This is an async method that we have metadata for. Create a
                                // Promise wrapper for it.
                                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                                value1 = wrapMethod(target, target[prop], wrapper);
                            } else // This is a method that we don't know or care about. Return the
                            // original method, bound to the underlying object.
                            value1 = value1.bind(target);
                        } else if (typeof value1 === "object" && value1 !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) // This is an object that we need to do some wrapping for the children
                        // of. Create a sub-object wrapper for it with the appropriate child
                        // metadata.
                        value1 = wrapObject(value1, wrappers[prop], metadata[prop]);
                        else if (hasOwnProperty(metadata, "*")) // Wrap all properties in * namespace.
                        value1 = wrapObject(value1, wrappers[prop], metadata["*"]);
                        else {
                            // We don't need to do any wrapping for this property,
                            // so just forward all access to the underlying object.
                            Object.defineProperty(cache, prop, {
                                configurable: true,
                                enumerable: true,
                                get () {
                                    return target[prop];
                                },
                                set (value) {
                                    target[prop] = value;
                                }
                            });
                            return value1;
                        }
                        cache[prop] = value1;
                        return value1;
                    },
                    set (proxyTarget, prop, value, receiver) {
                        if (prop in cache) cache[prop] = value;
                        else target[prop] = value;
                        return true;
                    },
                    defineProperty (proxyTarget, prop, desc) {
                        return Reflect.defineProperty(cache, prop, desc);
                    },
                    deleteProperty (proxyTarget, prop) {
                        return Reflect.deleteProperty(cache, prop);
                    }
                }; // Per contract of the Proxy API, the "get" proxy handler must return the
                // original value of the target if that value is declared read-only and
                // non-configurable. For this reason, we create an object with the
                // prototype set to `target` instead of using `target` directly.
                // Otherwise we cannot return a custom object for APIs that
                // are declared read-only and non-configurable, such as `chrome.devtools`.
                //
                // The proxy handlers themselves will still use the original `target`
                // instead of the `proxyTarget`, so that the methods and properties are
                // dereferenced via the original targets.
                let proxyTarget = Object.create(target);
                return new Proxy(proxyTarget, handlers);
            };
            /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */ const wrapEvent = (wrapperMap)=>({
                    addListener (target, listener, ...args) {
                        target.addListener(wrapperMap.get(listener), ...args);
                    },
                    hasListener (target, listener) {
                        return target.hasListener(wrapperMap.get(listener));
                    },
                    removeListener (target, listener) {
                        target.removeListener(wrapperMap.get(listener));
                    }
                });
            const onRequestFinishedWrappers = new DefaultWeakMap((listener)=>{
                if (typeof listener !== "function") return listener;
                /**
         * Wraps an onRequestFinished listener function so that it will return a
         * `getContent()` property which returns a `Promise` rather than using a
         * callback API.
         *
         * @param {object} req
         *        The HAR entry object representing the network request.
         */ return function onRequestFinished(req) {
                    const wrappedReq = wrapObject(req, {}, {
                        getContent: {
                            minArgs: 0,
                            maxArgs: 0
                        }
                    });
                    listener(wrappedReq);
                };
            });
            const onMessageWrappers = new DefaultWeakMap((listener)=>{
                if (typeof listener !== "function") return listener;
                /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */ return function onMessage(message1, sender, sendResponse) {
                    let didCallSendResponse = false;
                    let wrappedSendResponse;
                    let sendResponsePromise = new Promise((resolve)=>{
                        wrappedSendResponse = function(response) {
                            didCallSendResponse = true;
                            resolve(response);
                        };
                    });
                    let result;
                    try {
                        result = listener(message1, sender, wrappedSendResponse);
                    } catch (err1) {
                        result = Promise.reject(err1);
                    }
                    const isResultThenable = result !== true && isThenable(result); // If the listener didn't returned true or a Promise, or called
                    // wrappedSendResponse synchronously, we can exit earlier
                    // because there will be no response sent from this listener.
                    if (result !== true && !isResultThenable && !didCallSendResponse) return false;
                     // A small helper to send the message if the promise resolves
                    // and an error if the promise rejects (a wrapped sendMessage has
                    // to translate the message into a resolved promise or a rejected
                    // promise).
                    const sendPromisedResult = (promise)=>{
                        promise.then((msg)=>{
                            // send the message value.
                            sendResponse(msg);
                        }, (error)=>{
                            // Send a JSON representation of the error if the rejected value
                            // is an instance of error, or the object itself otherwise.
                            let message;
                            if (error && (error instanceof Error || typeof error.message === "string")) message = error.message;
                            else message = "An unexpected error occurred";
                            sendResponse({
                                __mozWebExtensionPolyfillReject__: true,
                                message
                            });
                        }).catch((err)=>{
                            // Print an error on the console if unable to send the response.
                            console.error("Failed to send onMessage rejected reply", err);
                        });
                    }; // If the listener returned a Promise, send the resolved value as a
                    // result, otherwise wait the promise related to the wrappedSendResponse
                    // callback to resolve and send it as a response.
                    if (isResultThenable) sendPromisedResult(result);
                    else sendPromisedResult(sendResponsePromise);
                     // Let Chrome know that the listener is replying.
                    return true;
                };
            });
            const wrappedSendMessageCallback = ({ reject , resolve  }, reply)=>{
                if (extensionAPIs.runtime.lastError) {
                    // Detect when none of the listeners replied to the sendMessage call and resolve
                    // the promise to undefined as in Firefox.
                    // See https://github.com/mozilla/webextension-polyfill/issues/130
                    if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) resolve();
                    else reject(new Error(extensionAPIs.runtime.lastError.message));
                } else if (reply && reply.__mozWebExtensionPolyfillReject__) // Convert back the JSON representation of the error into
                // an Error instance.
                reject(new Error(reply.message));
                else resolve(reply);
            };
            const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args)=>{
                if (args.length < metadata.minArgs) throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
                if (args.length > metadata.maxArgs) throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
                return new Promise((resolve, reject)=>{
                    const wrappedCb = wrappedSendMessageCallback.bind(null, {
                        resolve,
                        reject
                    });
                    args.push(wrappedCb);
                    apiNamespaceObj.sendMessage(...args);
                });
            };
            const staticWrappers = {
                devtools: {
                    network: {
                        onRequestFinished: wrapEvent(onRequestFinishedWrappers)
                    }
                },
                runtime: {
                    onMessage: wrapEvent(onMessageWrappers),
                    onMessageExternal: wrapEvent(onMessageWrappers),
                    sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                        minArgs: 1,
                        maxArgs: 3
                    })
                },
                tabs: {
                    sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                        minArgs: 2,
                        maxArgs: 3
                    })
                }
            };
            const settingMetadata = {
                clear: {
                    minArgs: 1,
                    maxArgs: 1
                },
                get: {
                    minArgs: 1,
                    maxArgs: 1
                },
                set: {
                    minArgs: 1,
                    maxArgs: 1
                }
            };
            apiMetadata.privacy = {
                network: {
                    "*": settingMetadata
                },
                services: {
                    "*": settingMetadata
                },
                websites: {
                    "*": settingMetadata
                }
            };
            return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
        }; // The build process adds a UMD wrapper around this file, which makes the
        // `module` variable available.
        module.exports = wrapAPIs(chrome);
    } else module.exports = globalThis.browser;
});

},{}],"h6aFv":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./constants"), exports);
tslib_1.__exportStar(require("./error"), exports);
tslib_1.__exportStar(require("./env"), exports);
tslib_1.__exportStar(require("./format"), exports);
tslib_1.__exportStar(require("./routing"), exports);
tslib_1.__exportStar(require("./types"), exports);
tslib_1.__exportStar(require("./validators"), exports);

},{"tslib":"hdsRu","./constants":"jTADb","./error":"kvTPR","./env":"hTySz","./format":"8Olxe","./routing":"5NgkK","./types":"gyxNo","./validators":"5Lvro"}],"hdsRu":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "__extends", ()=>__extends);
parcelHelpers.export(exports, "__assign", ()=>__assign);
parcelHelpers.export(exports, "__rest", ()=>__rest);
parcelHelpers.export(exports, "__decorate", ()=>__decorate);
parcelHelpers.export(exports, "__param", ()=>__param);
parcelHelpers.export(exports, "__metadata", ()=>__metadata);
parcelHelpers.export(exports, "__awaiter", ()=>__awaiter);
parcelHelpers.export(exports, "__generator", ()=>__generator);
parcelHelpers.export(exports, "__createBinding", ()=>__createBinding);
parcelHelpers.export(exports, "__exportStar", ()=>__exportStar);
parcelHelpers.export(exports, "__values", ()=>__values);
parcelHelpers.export(exports, "__read", ()=>__read);
/** @deprecated */ parcelHelpers.export(exports, "__spread", ()=>__spread);
/** @deprecated */ parcelHelpers.export(exports, "__spreadArrays", ()=>__spreadArrays);
parcelHelpers.export(exports, "__spreadArray", ()=>__spreadArray);
parcelHelpers.export(exports, "__await", ()=>__await);
parcelHelpers.export(exports, "__asyncGenerator", ()=>__asyncGenerator);
parcelHelpers.export(exports, "__asyncDelegator", ()=>__asyncDelegator);
parcelHelpers.export(exports, "__asyncValues", ()=>__asyncValues);
parcelHelpers.export(exports, "__makeTemplateObject", ()=>__makeTemplateObject);
parcelHelpers.export(exports, "__importStar", ()=>__importStar);
parcelHelpers.export(exports, "__importDefault", ()=>__importDefault);
parcelHelpers.export(exports, "__classPrivateFieldGet", ()=>__classPrivateFieldGet);
parcelHelpers.export(exports, "__classPrivateFieldSet", ()=>__classPrivateFieldSet);
parcelHelpers.export(exports, "__classPrivateFieldIn", ()=>__classPrivateFieldIn);
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ /* global Reflect, Promise */ var extendStatics = function(d1, b1) {
    extendStatics = Object.setPrototypeOf || ({
        __proto__: []
    }) instanceof Array && function(d, b) {
        d.__proto__ = b;
    } || function(d, b) {
        for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
    return extendStatics(d1, b1);
};
function __extends(d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function __rest(s, e) {
    var t = {};
    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") {
        for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
}
function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}
function __generator(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, f, y, t, g;
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var __createBinding = Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
        enumerable: true,
        get: function() {
            return m[k];
        }
    };
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
};
function __exportStar(m, o) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}
function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);
    } catch (error) {
        e = {
            error: error
        };
    } finally{
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally{
            if (e) throw e.error;
        }
    }
    return ar;
}
function __spread() {
    for(var ar = [], i = 0; i < arguments.length; i++)ar = ar.concat(__read(arguments[i]));
    return ar;
}
function __spreadArrays() {
    for(var s = 0, i = 0, il = arguments.length; i < il; i++)s += arguments[i].length;
    for(var r = Array(s), k = 0, i = 0; i < il; i++)for(var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)r[k] = a[j];
    return r;
}
function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) {
        for(var i = 0, l = from.length, ar; i < l; i++)if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}
function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;
    function verb(n) {
        if (g[n]) i[n] = function(v) {
            return new Promise(function(a, b) {
                q.push([
                    n,
                    v,
                    a,
                    b
                ]) > 1 || resume(n, v);
            });
        };
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
}
function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function(e) {
        throw e;
    }), verb("return"), i[Symbol.iterator] = function() {
        return this;
    }, i;
    function verb(n, f) {
        i[n] = o[n] ? function(v) {
            return (p = !p) ? {
                value: __await(o[n](v)),
                done: n === "return"
            } : f ? f(v) : v;
        } : f;
    }
}
function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v1) {
        Promise.resolve(v1).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
}
function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) Object.defineProperty(cooked, "raw", {
        value: raw
    });
    else cooked.raw = raw;
    return cooked;
}
var __setModuleDefault = Object.create ? function(o, v) {
    Object.defineProperty(o, "default", {
        enumerable: true,
        value: v
    });
} : function(o, v) {
    o["default"] = v;
};
function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
        for(var k in mod)if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
}
function __importDefault(mod) {
    return mod && mod.__esModule ? mod : {
        default: mod
    };
}
function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldIn(state, receiver) {
    if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"boKlo"}],"jTADb":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.STANDARD_ERROR_MAP = exports.SERVER_ERROR_CODE_RANGE = exports.RESERVED_ERROR_CODES = exports.SERVER_ERROR = exports.INTERNAL_ERROR = exports.INVALID_PARAMS = exports.METHOD_NOT_FOUND = exports.INVALID_REQUEST = exports.PARSE_ERROR = void 0;
exports.PARSE_ERROR = "PARSE_ERROR";
exports.INVALID_REQUEST = "INVALID_REQUEST";
exports.METHOD_NOT_FOUND = "METHOD_NOT_FOUND";
exports.INVALID_PARAMS = "INVALID_PARAMS";
exports.INTERNAL_ERROR = "INTERNAL_ERROR";
exports.SERVER_ERROR = "SERVER_ERROR";
exports.RESERVED_ERROR_CODES = [
    -32700,
    -32600,
    -32601,
    -32602,
    -32603
];
exports.SERVER_ERROR_CODE_RANGE = [
    -32000,
    -32099
];
exports.STANDARD_ERROR_MAP = {
    [exports.PARSE_ERROR]: {
        code: -32700,
        message: "Parse error"
    },
    [exports.INVALID_REQUEST]: {
        code: -32600,
        message: "Invalid Request"
    },
    [exports.METHOD_NOT_FOUND]: {
        code: -32601,
        message: "Method not found"
    },
    [exports.INVALID_PARAMS]: {
        code: -32602,
        message: "Invalid params"
    },
    [exports.INTERNAL_ERROR]: {
        code: -32603,
        message: "Internal error"
    },
    [exports.SERVER_ERROR]: {
        code: -32000,
        message: "Server error"
    }
};

},{}],"kvTPR":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.validateJsonRpcError = exports.getErrorByCode = exports.getError = exports.isValidErrorCode = exports.isReservedErrorCode = exports.isServerErrorCode = void 0;
const constants_1 = require("./constants");
function isServerErrorCode(code) {
    return code <= constants_1.SERVER_ERROR_CODE_RANGE[0] && code >= constants_1.SERVER_ERROR_CODE_RANGE[1];
}
exports.isServerErrorCode = isServerErrorCode;
function isReservedErrorCode(code) {
    return constants_1.RESERVED_ERROR_CODES.includes(code);
}
exports.isReservedErrorCode = isReservedErrorCode;
function isValidErrorCode(code) {
    return typeof code === "number";
}
exports.isValidErrorCode = isValidErrorCode;
function getError(type) {
    if (!Object.keys(constants_1.STANDARD_ERROR_MAP).includes(type)) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];
    return constants_1.STANDARD_ERROR_MAP[type];
}
exports.getError = getError;
function getErrorByCode(code) {
    const match = Object.values(constants_1.STANDARD_ERROR_MAP).find((e)=>e.code === code);
    if (!match) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];
    return match;
}
exports.getErrorByCode = getErrorByCode;
function validateJsonRpcError(response) {
    if (typeof response.error.code === "undefined") return {
        valid: false,
        error: "Missing code for JSON-RPC error"
    };
    if (typeof response.error.message === "undefined") return {
        valid: false,
        error: "Missing message for JSON-RPC error"
    };
    if (!isValidErrorCode(response.error.code)) return {
        valid: false,
        error: `Invalid error code type for JSON-RPC: ${response.error.code}`
    };
    if (isReservedErrorCode(response.error.code)) {
        const error = getErrorByCode(response.error.code);
        if (error.message !== constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR].message && response.error.message === error.message) return {
            valid: false,
            error: `Invalid error code message for JSON-RPC: ${response.error.code}`
        };
    }
    return {
        valid: true
    };
}
exports.validateJsonRpcError = validateJsonRpcError;

},{"./constants":"jTADb"}],"hTySz":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isNodeJs = void 0;
const tslib_1 = require("tslib");
const environment_1 = require("@pedrouid/environment");
exports.isNodeJs = environment_1.isNode;
tslib_1.__exportStar(require("@pedrouid/environment"), exports);

},{"tslib":"hdsRu","@pedrouid/environment":"b372L"}],"b372L":[function(require,module,exports) {
"use strict";
var __createBinding = this && this.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, {
        enumerable: true,
        get: function() {
            return m[k];
        }
    });
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});
var __exportStar = this && this.__exportStar || function(m, exports) {
    for(var p in m)if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
__exportStar(require("./crypto"), exports);
__exportStar(require("./env"), exports);

},{"./crypto":"dg5EK","./env":"5c1UZ"}],"dg5EK":[function(require,module,exports) {
"use strict";
var global = arguments[3];
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isBrowserCryptoAvailable = exports.getSubtleCrypto = exports.getBrowerCrypto = void 0;
function getBrowerCrypto() {
    return (global === null || global === void 0 ? void 0 : global.crypto) || (global === null || global === void 0 ? void 0 : global.msCrypto) || {};
}
exports.getBrowerCrypto = getBrowerCrypto;
function getSubtleCrypto() {
    const browserCrypto = getBrowerCrypto();
    return browserCrypto.subtle || browserCrypto.webkitSubtle;
}
exports.getSubtleCrypto = getSubtleCrypto;
function isBrowserCryptoAvailable() {
    return !!getBrowerCrypto() && !!getSubtleCrypto();
}
exports.isBrowserCryptoAvailable = isBrowserCryptoAvailable;

},{}],"5c1UZ":[function(require,module,exports) {
"use strict";
var process = require("process");
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isBrowser = exports.isNode = exports.isReactNative = void 0;
function isReactNative() {
    return typeof document === "undefined" && typeof navigator !== "undefined" && navigator.product === "ReactNative";
}
exports.isReactNative = isReactNative;
function isNode() {
    return typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined";
}
exports.isNode = isNode;
function isBrowser() {
    return !isReactNative() && !isNode();
}
exports.isBrowser = isBrowser;

},{"process":"1iSuU"}],"1iSuU":[function(require,module,exports) {
// shim for using process in browser
var process = module.exports = {};
// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.
var cachedSetTimeout;
var cachedClearTimeout;
function defaultSetTimout() {
    throw new Error("setTimeout has not been defined");
}
function defaultClearTimeout() {
    throw new Error("clearTimeout has not been defined");
}
(function() {
    try {
        if (typeof setTimeout === "function") cachedSetTimeout = setTimeout;
        else cachedSetTimeout = defaultSetTimout;
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === "function") cachedClearTimeout = clearTimeout;
        else cachedClearTimeout = defaultClearTimeout;
    } catch (e1) {
        cachedClearTimeout = defaultClearTimeout;
    }
})();
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) //normal enviroments in sane situations
    return setTimeout(fun, 0);
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }
}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) //normal enviroments in sane situations
    return clearTimeout(marker);
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;
function cleanUpNextTick() {
    if (!draining || !currentQueue) return;
    draining = false;
    if (currentQueue.length) queue = currentQueue.concat(queue);
    else queueIndex = -1;
    if (queue.length) drainQueue();
}
function drainQueue() {
    if (draining) return;
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;
    var len = queue.length;
    while(len){
        currentQueue = queue;
        queue = [];
        while(++queueIndex < len)if (currentQueue) currentQueue[queueIndex].run();
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
process.nextTick = function(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) for(var i = 1; i < arguments.length; i++)args[i - 1] = arguments[i];
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) runTimeout(drainQueue);
};
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function() {
    this.fun.apply(null, this.array);
};
process.title = "browser";
process.browser = true;
process.env = {};
process.argv = [];
process.version = ""; // empty string to avoid regexp issues
process.versions = {};
function noop() {}
process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;
process.listeners = function(name) {
    return [];
};
process.binding = function(name) {
    throw new Error("process.binding is not supported");
};
process.cwd = function() {
    return "/";
};
process.chdir = function(dir) {
    throw new Error("process.chdir is not supported");
};
process.umask = function() {
    return 0;
};

},{}],"8Olxe":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.formatErrorMessage = exports.formatJsonRpcError = exports.formatJsonRpcResult = exports.formatJsonRpcRequest = exports.payloadId = void 0;
const error_1 = require("./error");
const constants_1 = require("./constants");
function payloadId() {
    const date = Date.now() * Math.pow(10, 3);
    const extra = Math.floor(Math.random() * Math.pow(10, 3));
    return date + extra;
}
exports.payloadId = payloadId;
function formatJsonRpcRequest(method, params, id) {
    return {
        id: id || payloadId(),
        jsonrpc: "2.0",
        method,
        params
    };
}
exports.formatJsonRpcRequest = formatJsonRpcRequest;
function formatJsonRpcResult(id, result) {
    return {
        id,
        jsonrpc: "2.0",
        result
    };
}
exports.formatJsonRpcResult = formatJsonRpcResult;
function formatJsonRpcError(id, error) {
    return {
        id,
        jsonrpc: "2.0",
        error: formatErrorMessage(error)
    };
}
exports.formatJsonRpcError = formatJsonRpcError;
function formatErrorMessage(error) {
    if (typeof error === "undefined") return error_1.getError(constants_1.INTERNAL_ERROR);
    if (typeof error === "string") error = Object.assign(Object.assign({}, error_1.getError(constants_1.SERVER_ERROR)), {
        message: error
    });
    if (error_1.isReservedErrorCode(error.code)) error = error_1.getErrorByCode(error.code);
    if (!error_1.isServerErrorCode(error.code)) throw new Error("Error code is not in server code range");
    return error;
}
exports.formatErrorMessage = formatErrorMessage;

},{"./error":"kvTPR","./constants":"jTADb"}],"5NgkK":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isValidTrailingWildcardRoute = exports.isValidLeadingWildcardRoute = exports.isValidWildcardRoute = exports.isValidDefaultRoute = exports.isValidRoute = void 0;
function isValidRoute(route) {
    if (route.includes("*")) return isValidWildcardRoute(route);
    if (/\W/g.test(route)) return false;
    return true;
}
exports.isValidRoute = isValidRoute;
function isValidDefaultRoute(route) {
    return route === "*";
}
exports.isValidDefaultRoute = isValidDefaultRoute;
function isValidWildcardRoute(route) {
    if (isValidDefaultRoute(route)) return true;
    if (!route.includes("*")) return false;
    if (route.split("*").length !== 2) return false;
    if (route.split("*").filter((x)=>x.trim() === "").length !== 1) return false;
    return true;
}
exports.isValidWildcardRoute = isValidWildcardRoute;
function isValidLeadingWildcardRoute(route) {
    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split("*")[0].trim();
}
exports.isValidLeadingWildcardRoute = isValidLeadingWildcardRoute;
function isValidTrailingWildcardRoute(route) {
    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split("*")[1].trim();
}
exports.isValidTrailingWildcardRoute = isValidTrailingWildcardRoute;

},{}],"gyxNo":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("@json-rpc-tools/types"), exports);

},{"tslib":"hdsRu","@json-rpc-tools/types":"6TTqw"}],"6TTqw":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./blockchain"), exports);
tslib_1.__exportStar(require("./jsonrpc"), exports);
tslib_1.__exportStar(require("./misc"), exports);
tslib_1.__exportStar(require("./multi"), exports);
tslib_1.__exportStar(require("./provider"), exports);
tslib_1.__exportStar(require("./router"), exports);
tslib_1.__exportStar(require("./schema"), exports);
tslib_1.__exportStar(require("./validator"), exports);

},{"tslib":"hdsRu","./blockchain":"5PMmI","./jsonrpc":"azpg2","./misc":"16ntc","./multi":"hkR47","./provider":"k2Sp0","./router":"f8QmQ","./schema":"kSI89","./validator":"1gDtV"}],"5PMmI":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IBlockchainProvider = exports.IBlockchainAuthenticator = exports.IPendingRequests = void 0;
const misc_1 = require("./misc");
const provider_1 = require("./provider");
class IPendingRequests {
    constructor(storage){
        this.storage = storage;
    }
}
exports.IPendingRequests = IPendingRequests;
class IBlockchainAuthenticator extends misc_1.IEvents {
    constructor(config){
        super();
        this.config = config;
    }
}
exports.IBlockchainAuthenticator = IBlockchainAuthenticator;
class IBlockchainProvider extends provider_1.IJsonRpcProvider {
    constructor(connection, config){
        super(connection);
    }
}
exports.IBlockchainProvider = IBlockchainProvider;

},{"./misc":"16ntc","./provider":"k2Sp0"}],"16ntc":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IEvents = void 0;
class IEvents {
}
exports.IEvents = IEvents;

},{}],"k2Sp0":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IJsonRpcProvider = exports.IBaseJsonRpcProvider = exports.IJsonRpcConnection = void 0;
const misc_1 = require("./misc");
class IJsonRpcConnection extends misc_1.IEvents {
    constructor(opts){
        super();
    }
}
exports.IJsonRpcConnection = IJsonRpcConnection;
class IBaseJsonRpcProvider extends misc_1.IEvents {
    constructor(){
        super();
    }
}
exports.IBaseJsonRpcProvider = IBaseJsonRpcProvider;
class IJsonRpcProvider extends IBaseJsonRpcProvider {
    constructor(connection){
        super();
    }
}
exports.IJsonRpcProvider = IJsonRpcProvider;

},{"./misc":"16ntc"}],"azpg2":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{}],"hkR47":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IMultiServiceProvider = void 0;
const provider_1 = require("./provider");
class IMultiServiceProvider extends provider_1.IBaseJsonRpcProvider {
    constructor(config){
        super();
        this.config = config;
    }
}
exports.IMultiServiceProvider = IMultiServiceProvider;

},{"./provider":"k2Sp0"}],"f8QmQ":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IJsonRpcRouter = void 0;
class IJsonRpcRouter {
    constructor(routes){
        this.routes = routes;
    }
}
exports.IJsonRpcRouter = IJsonRpcRouter;

},{}],"kSI89":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{}],"1gDtV":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IJsonRpcValidator = void 0;
class IJsonRpcValidator {
    constructor(schemas){
        this.schemas = schemas;
    }
}
exports.IJsonRpcValidator = IJsonRpcValidator;

},{}],"5Lvro":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isJsonRpcValidationInvalid = exports.isJsonRpcError = exports.isJsonRpcResult = exports.isJsonRpcResponse = exports.isJsonRpcRequest = exports.isJsonRpcPayload = void 0;
function isJsonRpcPayload(payload) {
    return "id" in payload && "jsonrpc" in payload && payload.jsonrpc === "2.0";
}
exports.isJsonRpcPayload = isJsonRpcPayload;
function isJsonRpcRequest(payload) {
    return isJsonRpcPayload(payload) && "method" in payload;
}
exports.isJsonRpcRequest = isJsonRpcRequest;
function isJsonRpcResponse(payload) {
    return isJsonRpcPayload(payload) && (isJsonRpcResult(payload) || isJsonRpcError(payload));
}
exports.isJsonRpcResponse = isJsonRpcResponse;
function isJsonRpcResult(payload) {
    return "result" in payload;
}
exports.isJsonRpcResult = isJsonRpcResult;
function isJsonRpcError(payload) {
    return "error" in payload;
}
exports.isJsonRpcError = isJsonRpcError;
function isJsonRpcValidationInvalid(validation) {
    return "error" in validation && validation.valid === false;
}
exports.isJsonRpcValidationInvalid = isJsonRpcValidationInvalid;

},{}],"9scsm":[function(require,module,exports) {
module.exports = "// modules are defined as an array\n// [ module function, map of requires ]\n//\n// map of requires is short require name -> numeric require\n//\n// anything defined in a previous bundle is accessed via the\n// orig method which is the require for previous bundles\n\n(function (modules, entry, mainEntry, parcelRequireName, globalName) {\n  /* eslint-disable no-undef */\n  var globalObject =\n    typeof globalThis !== 'undefined'\n      ? globalThis\n      : typeof self !== 'undefined'\n      ? self\n      : typeof window !== 'undefined'\n      ? window\n      : typeof global !== 'undefined'\n      ? global\n      : {};\n  /* eslint-enable no-undef */\n\n  // Save the require from previous bundle to this closure if any\n  var previousRequire =\n    typeof globalObject[parcelRequireName] === 'function' &&\n    globalObject[parcelRequireName];\n\n  var cache = previousRequire.cache || {};\n  // Do not use `require` to prevent Webpack from trying to bundle this call\n  var nodeRequire =\n    typeof module !== 'undefined' &&\n    typeof module.require === 'function' &&\n    module.require.bind(module);\n\n  function newRequire(name, jumped) {\n    if (!cache[name]) {\n      if (!modules[name]) {\n        // if we cannot find the module within our internal map or\n        // cache jump to the current global require ie. the last bundle\n        // that was added to the page.\n        var currentRequire =\n          typeof globalObject[parcelRequireName] === 'function' &&\n          globalObject[parcelRequireName];\n        if (!jumped && currentRequire) {\n          return currentRequire(name, true);\n        }\n\n        // If there are other bundles on this page the require from the\n        // previous one is saved to 'previousRequire'. Repeat this as\n        // many times as there are bundles until the module is found or\n        // we exhaust the require chain.\n        if (previousRequire) {\n          return previousRequire(name, true);\n        }\n\n        // Try the node require function if it exists.\n        if (nodeRequire && typeof name === 'string') {\n          return nodeRequire(name);\n        }\n\n        var err = new Error(\"Cannot find module '\" + name + \"'\");\n        err.code = 'MODULE_NOT_FOUND';\n        throw err;\n      }\n\n      localRequire.resolve = resolve;\n      localRequire.cache = {};\n\n      var module = (cache[name] = new newRequire.Module(name));\n\n      modules[name][0].call(\n        module.exports,\n        localRequire,\n        module,\n        module.exports,\n        this\n      );\n    }\n\n    return cache[name].exports;\n\n    function localRequire(x) {\n      var res = localRequire.resolve(x);\n      return res === false ? {} : newRequire(res);\n    }\n\n    function resolve(x) {\n      var id = modules[name][1][x];\n      return id != null ? id : x;\n    }\n  }\n\n  function Module(moduleName) {\n    this.id = moduleName;\n    this.bundle = newRequire;\n    this.exports = {};\n  }\n\n  newRequire.isParcelRequire = true;\n  newRequire.Module = Module;\n  newRequire.modules = modules;\n  newRequire.cache = cache;\n  newRequire.parent = previousRequire;\n  newRequire.register = function (id, exports) {\n    modules[id] = [\n      function (require, module) {\n        module.exports = exports;\n      },\n      {},\n    ];\n  };\n\n  Object.defineProperty(newRequire, 'root', {\n    get: function () {\n      return globalObject[parcelRequireName];\n    },\n  });\n\n  globalObject[parcelRequireName] = newRequire;\n\n  for (var i = 0; i < entry.length; i++) {\n    newRequire(entry[i]);\n  }\n\n  if (mainEntry) {\n    // Expose entry point to Node, AMD or browser globals\n    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js\n    var mainExports = newRequire(mainEntry);\n\n    // CommonJS\n    if (typeof exports === 'object' && typeof module !== 'undefined') {\n      module.exports = mainExports;\n\n      // RequireJS\n    } else if (typeof define === 'function' && define.amd) {\n      define(function () {\n        return mainExports;\n      });\n\n      // <script>\n    } else if (globalName) {\n      this[globalName] = mainExports;\n    }\n  }\n})({\"qFYh4\":[function(require,module,exports) {\nvar _provider = require(\"src/modules/ethereum/provider\");\nvar _connection = require(\"src/modules/ethereum/connection\");\nvar _walletNameFlag = require(\"src/shared/types/WalletNameFlag\");\nconst broadcastChannel = new BroadcastChannel(window.myWalletChannelId);\nconst connection = new (0, _connection.Connection)(broadcastChannel);\nconst provider = new (0, _provider.EthereumProvider)(connection);\nprovider.connect();\nwindow.ethereum = provider;\n// TODO:\n// Expose other providers similar to how coinbase wallet extension does it:\n// https://docs.cloud.coinbase.com/wallet-sdk/docs/injected-provider-guidance\nconst otherProviders = new Set();\nObject.defineProperty(window, \"ethereum\", {\n    configurable: false,\n    get () {\n        return provider;\n    },\n    set (value) {\n        otherProviders.add(value);\n    }\n});\nprovider.request({\n    method: \"wallet_getWalletNameFlags\"\n}).then((result)=>{\n    if (result.includes((0, _walletNameFlag.WalletNameFlag).isMetaMask)) provider.isMetaMask = true;\n});\nwindow.zerionWallet = provider;\n\n},{\"src/modules/ethereum/provider\":\"jS2ol\",\"src/modules/ethereum/connection\":\"deOoS\",\"src/shared/types/WalletNameFlag\":\"r3kfE\"}],\"jS2ol\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"EthereumProvider\", ()=>EthereumProvider);\nvar _provider = require(\"@json-rpc-tools/provider\");\nvar _utils = require(\"@json-rpc-tools/utils\");\nvar _walletNameFlag = require(\"src/shared/types/WalletNameFlag\");\nfunction accountsEquals(arr1, arr2) {\n    // it's okay to perform search like this because `accounts`\n    // always has at most one element\n    return arr1.length === arr2.length && arr1.every((item)=>arr2.includes(item));\n}\nasync function fetchInitialState(connection) {\n    return Promise.all([\n        connection.send((0, _utils.formatJsonRpcRequest)(\"eth_chainId\", [])),\n        connection.send((0, _utils.formatJsonRpcRequest)(\"eth_accounts\", [])),\n        connection.send((0, _utils.formatJsonRpcRequest)(\"wallet_getWalletNameFlags\", [])), \n    ]).then(([chainId, accounts, walletNameFlags])=>({\n            chainId,\n            accounts,\n            walletNameFlags\n        }));\n}\nfunction updateChainId(self, chainId) {\n    self.chainId = chainId;\n    self.networkVersion = String(parseInt(chainId, 16));\n}\nclass EthereumProvider extends (0, _provider.JsonRpcProvider) {\n    isZerionWallet = true;\n    _openPromise = null;\n    constructor(connection){\n        super(connection);\n        this.connection = connection;\n        this.shimLegacy();\n        this.chainId = \"0x1\";\n        this.networkVersion = \"1\";\n        this.accounts = [];\n        connection.on(\"ethereumEvent\", ({ event , value  })=>{\n            if (event === \"chainChanged\" && typeof value === \"string\") {\n                if (value === this.chainId) return;\n                updateChainId(this, value);\n            }\n            if (event === \"accountsChanged\" && Array.isArray(value)) {\n                // it's okay to perform search like this because `this.accounts`\n                // always has at most one element\n                if (accountsEquals(value, this.accounts)) // Do not emit accountChanged because value hasn't changed\n                return;\n                else this.accounts = value;\n            }\n            this.events.emit(event, value);\n        });\n        this.open();\n    }\n    on(event, listener) {\n        super.on(event, listener);\n        return this;\n    }\n    async _prepareState() {\n        return fetchInitialState(this.connection).then(({ chainId , accounts , walletNameFlags  })=>{\n            updateChainId(this, chainId);\n            this.accounts = accounts;\n            if (walletNameFlags.includes((0, _walletNameFlag.WalletNameFlag).isMetaMask)) {\n                console.log(\"is metamask in _prepareState\");\n                this.isMetaMask = true;\n            }\n        });\n    }\n    async request(request, context) {\n        if (request.method === \"eth_chainId\") return Promise.resolve(this.chainId);\n        if (request.method === \"eth_accounts\") return Promise.resolve(this.accounts);\n        return this._getRequestPromise((0, _utils.formatJsonRpcRequest)(request.method, request.params || []), context);\n    }\n    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    async _getRequestPromise(request, _context // eslint-disable-line @typescript-eslint/no-explicit-any\n    ) {\n        if (!this.connection.connected) await this.open();\n        return new Promise((resolve, reject)=>{\n            this.events.once(`${request.id}`, (response)=>{\n                if ((0, _utils.isJsonRpcError)(response)) reject(response.error);\n                else resolve(response.result);\n            });\n            this.connection.send(request);\n        });\n    }\n    // Taken from Rabby\n    // shim to matamask legacy api\n    sendAsync = (payload, callback)=>{\n        if (Array.isArray(payload)) return Promise.all(payload.map((item)=>new Promise((resolve)=>{\n                this.sendAsync(item, (_err, res)=>{\n                    // ignore error\n                    resolve(res);\n                });\n            }))).then((result)=>callback(null, result));\n        const { method , params , ...rest } = payload;\n        this.request({\n            method,\n            params\n        }).then((result)=>callback(null, {\n                ...rest,\n                method,\n                result\n            })).catch((error)=>callback(error, {\n                ...rest,\n                method,\n                error\n            }));\n    };\n    shimLegacy() {\n        const legacyMethods = [\n            [\n                \"enable\",\n                \"eth_requestAccounts\"\n            ],\n            [\n                \"net_version\",\n                \"net_version\"\n            ], \n        ];\n        for (const [_method, method] of legacyMethods)// @ts-ignore\n        this[_method] = ()=>this.request({\n                method\n            });\n    }\n    isConnected() {\n        return this.connection.connected;\n    }\n    async _internalOpen(connection) {\n        if (this.connection === connection && this.connection.connected) return;\n        if (this.connection.connected) this.close();\n        this.connection = connection; // this.setConnection();\n        await Promise.all([\n            this.connection.open(),\n            this._prepareState()\n        ]);\n        this.connection.on(\"payload\", (payload)=>this.onPayload(payload));\n        this.connection.on(\"close\", ()=>{\n            this.events.emit(\"disconnect\");\n        });\n        this.events.emit(\"connect\", {\n            chainId: this.chainId\n        });\n    }\n    open(connection = this.connection) {\n        if (!this._openPromise) this._openPromise = this._internalOpen(connection);\n        return this._openPromise;\n    }\n}\n\n},{\"@json-rpc-tools/provider\":\"edpZ9\",\"@json-rpc-tools/utils\":\"h6aFv\",\"src/shared/types/WalletNameFlag\":\"r3kfE\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}],\"edpZ9\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\nconst provider_1 = tslib_1.__importDefault(require(\"./provider\"));\ntslib_1.__exportStar(require(\"./http\"), exports);\ntslib_1.__exportStar(require(\"./ws\"), exports);\ntslib_1.__exportStar(require(\"./provider\"), exports);\nexports.default = provider_1.default;\n\n},{\"tslib\":\"hdsRu\",\"./provider\":\"gHzlU\",\"./http\":\"7LjTp\",\"./ws\":\"aknY6\"}],\"hdsRu\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"__extends\", ()=>__extends);\nparcelHelpers.export(exports, \"__assign\", ()=>__assign);\nparcelHelpers.export(exports, \"__rest\", ()=>__rest);\nparcelHelpers.export(exports, \"__decorate\", ()=>__decorate);\nparcelHelpers.export(exports, \"__param\", ()=>__param);\nparcelHelpers.export(exports, \"__metadata\", ()=>__metadata);\nparcelHelpers.export(exports, \"__awaiter\", ()=>__awaiter);\nparcelHelpers.export(exports, \"__generator\", ()=>__generator);\nparcelHelpers.export(exports, \"__createBinding\", ()=>__createBinding);\nparcelHelpers.export(exports, \"__exportStar\", ()=>__exportStar);\nparcelHelpers.export(exports, \"__values\", ()=>__values);\nparcelHelpers.export(exports, \"__read\", ()=>__read);\n/** @deprecated */ parcelHelpers.export(exports, \"__spread\", ()=>__spread);\n/** @deprecated */ parcelHelpers.export(exports, \"__spreadArrays\", ()=>__spreadArrays);\nparcelHelpers.export(exports, \"__spreadArray\", ()=>__spreadArray);\nparcelHelpers.export(exports, \"__await\", ()=>__await);\nparcelHelpers.export(exports, \"__asyncGenerator\", ()=>__asyncGenerator);\nparcelHelpers.export(exports, \"__asyncDelegator\", ()=>__asyncDelegator);\nparcelHelpers.export(exports, \"__asyncValues\", ()=>__asyncValues);\nparcelHelpers.export(exports, \"__makeTemplateObject\", ()=>__makeTemplateObject);\nparcelHelpers.export(exports, \"__importStar\", ()=>__importStar);\nparcelHelpers.export(exports, \"__importDefault\", ()=>__importDefault);\nparcelHelpers.export(exports, \"__classPrivateFieldGet\", ()=>__classPrivateFieldGet);\nparcelHelpers.export(exports, \"__classPrivateFieldSet\", ()=>__classPrivateFieldSet);\nparcelHelpers.export(exports, \"__classPrivateFieldIn\", ()=>__classPrivateFieldIn);\n/******************************************************************************\r\nCopyright (c) Microsoft Corporation.\r\n\r\nPermission to use, copy, modify, and/or distribute this software for any\r\npurpose with or without fee is hereby granted.\r\n\r\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\r\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\r\nAND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\r\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM\r\nLOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR\r\nOTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR\r\nPERFORMANCE OF THIS SOFTWARE.\r\n***************************************************************************** */ /* global Reflect, Promise */ var extendStatics = function(d1, b1) {\n    extendStatics = Object.setPrototypeOf || ({\n        __proto__: []\n    }) instanceof Array && function(d, b) {\n        d.__proto__ = b;\n    } || function(d, b) {\n        for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];\n    };\n    return extendStatics(d1, b1);\n};\nfunction __extends(d, b) {\n    if (typeof b !== \"function\" && b !== null) throw new TypeError(\"Class extends value \" + String(b) + \" is not a constructor or null\");\n    extendStatics(d, b);\n    function __() {\n        this.constructor = d;\n    }\n    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());\n}\nvar __assign = function() {\n    __assign = Object.assign || function __assign(t) {\n        for(var s, i = 1, n = arguments.length; i < n; i++){\n            s = arguments[i];\n            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];\n        }\n        return t;\n    };\n    return __assign.apply(this, arguments);\n};\nfunction __rest(s, e) {\n    var t = {};\n    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];\n    if (s != null && typeof Object.getOwnPropertySymbols === \"function\") {\n        for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];\n    }\n    return t;\n}\nfunction __decorate(decorators, target, key, desc) {\n    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;\n    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);\n    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;\n    return c > 3 && r && Object.defineProperty(target, key, r), r;\n}\nfunction __param(paramIndex, decorator) {\n    return function(target, key) {\n        decorator(target, key, paramIndex);\n    };\n}\nfunction __metadata(metadataKey, metadataValue) {\n    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(metadataKey, metadataValue);\n}\nfunction __awaiter(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n        return value instanceof P ? value : new P(function(resolve) {\n            resolve(value);\n        });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n        function fulfilled(value) {\n            try {\n                step(generator.next(value));\n            } catch (e) {\n                reject(e);\n            }\n        }\n        function rejected(value) {\n            try {\n                step(generator[\"throw\"](value));\n            } catch (e) {\n                reject(e);\n            }\n        }\n        function step(result) {\n            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n        }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n}\nfunction __generator(thisArg, body) {\n    var _ = {\n        label: 0,\n        sent: function() {\n            if (t[0] & 1) throw t[1];\n            return t[1];\n        },\n        trys: [],\n        ops: []\n    }, f, y, t, g;\n    return g = {\n        next: verb(0),\n        \"throw\": verb(1),\n        \"return\": verb(2)\n    }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() {\n        return this;\n    }), g;\n    function verb(n) {\n        return function(v) {\n            return step([\n                n,\n                v\n            ]);\n        };\n    }\n    function step(op) {\n        if (f) throw new TypeError(\"Generator is already executing.\");\n        while(_)try {\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\n            if (y = 0, t) op = [\n                op[0] & 2,\n                t.value\n            ];\n            switch(op[0]){\n                case 0:\n                case 1:\n                    t = op;\n                    break;\n                case 4:\n                    _.label++;\n                    return {\n                        value: op[1],\n                        done: false\n                    };\n                case 5:\n                    _.label++;\n                    y = op[1];\n                    op = [\n                        0\n                    ];\n                    continue;\n                case 7:\n                    op = _.ops.pop();\n                    _.trys.pop();\n                    continue;\n                default:\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {\n                        _ = 0;\n                        continue;\n                    }\n                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {\n                        _.label = op[1];\n                        break;\n                    }\n                    if (op[0] === 6 && _.label < t[1]) {\n                        _.label = t[1];\n                        t = op;\n                        break;\n                    }\n                    if (t && _.label < t[2]) {\n                        _.label = t[2];\n                        _.ops.push(op);\n                        break;\n                    }\n                    if (t[2]) _.ops.pop();\n                    _.trys.pop();\n                    continue;\n            }\n            op = body.call(thisArg, _);\n        } catch (e) {\n            op = [\n                6,\n                e\n            ];\n            y = 0;\n        } finally{\n            f = t = 0;\n        }\n        if (op[0] & 5) throw op[1];\n        return {\n            value: op[0] ? op[1] : void 0,\n            done: true\n        };\n    }\n}\nvar __createBinding = Object.create ? function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {\n        enumerable: true,\n        get: function() {\n            return m[k];\n        }\n    };\n    Object.defineProperty(o, k2, desc);\n} : function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n};\nfunction __exportStar(m, o) {\n    for(var p in m)if (p !== \"default\" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);\n}\nfunction __values(o) {\n    var s = typeof Symbol === \"function\" && Symbol.iterator, m = s && o[s], i = 0;\n    if (m) return m.call(o);\n    if (o && typeof o.length === \"number\") return {\n        next: function() {\n            if (o && i >= o.length) o = void 0;\n            return {\n                value: o && o[i++],\n                done: !o\n            };\n        }\n    };\n    throw new TypeError(s ? \"Object is not iterable.\" : \"Symbol.iterator is not defined.\");\n}\nfunction __read(o, n) {\n    var m = typeof Symbol === \"function\" && o[Symbol.iterator];\n    if (!m) return o;\n    var i = m.call(o), r, ar = [], e;\n    try {\n        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);\n    } catch (error) {\n        e = {\n            error: error\n        };\n    } finally{\n        try {\n            if (r && !r.done && (m = i[\"return\"])) m.call(i);\n        } finally{\n            if (e) throw e.error;\n        }\n    }\n    return ar;\n}\nfunction __spread() {\n    for(var ar = [], i = 0; i < arguments.length; i++)ar = ar.concat(__read(arguments[i]));\n    return ar;\n}\nfunction __spreadArrays() {\n    for(var s = 0, i = 0, il = arguments.length; i < il; i++)s += arguments[i].length;\n    for(var r = Array(s), k = 0, i = 0; i < il; i++)for(var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)r[k] = a[j];\n    return r;\n}\nfunction __spreadArray(to, from, pack) {\n    if (pack || arguments.length === 2) {\n        for(var i = 0, l = from.length, ar; i < l; i++)if (ar || !(i in from)) {\n            if (!ar) ar = Array.prototype.slice.call(from, 0, i);\n            ar[i] = from[i];\n        }\n    }\n    return to.concat(ar || Array.prototype.slice.call(from));\n}\nfunction __await(v) {\n    return this instanceof __await ? (this.v = v, this) : new __await(v);\n}\nfunction __asyncGenerator(thisArg, _arguments, generator) {\n    if (!Symbol.asyncIterator) throw new TypeError(\"Symbol.asyncIterator is not defined.\");\n    var g = generator.apply(thisArg, _arguments || []), i, q = [];\n    return i = {}, verb(\"next\"), verb(\"throw\"), verb(\"return\"), i[Symbol.asyncIterator] = function() {\n        return this;\n    }, i;\n    function verb(n) {\n        if (g[n]) i[n] = function(v) {\n            return new Promise(function(a, b) {\n                q.push([\n                    n,\n                    v,\n                    a,\n                    b\n                ]) > 1 || resume(n, v);\n            });\n        };\n    }\n    function resume(n, v) {\n        try {\n            step(g[n](v));\n        } catch (e) {\n            settle(q[0][3], e);\n        }\n    }\n    function step(r) {\n        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);\n    }\n    function fulfill(value) {\n        resume(\"next\", value);\n    }\n    function reject(value) {\n        resume(\"throw\", value);\n    }\n    function settle(f, v) {\n        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);\n    }\n}\nfunction __asyncDelegator(o) {\n    var i, p;\n    return i = {}, verb(\"next\"), verb(\"throw\", function(e) {\n        throw e;\n    }), verb(\"return\"), i[Symbol.iterator] = function() {\n        return this;\n    }, i;\n    function verb(n, f) {\n        i[n] = o[n] ? function(v) {\n            return (p = !p) ? {\n                value: __await(o[n](v)),\n                done: n === \"return\"\n            } : f ? f(v) : v;\n        } : f;\n    }\n}\nfunction __asyncValues(o) {\n    if (!Symbol.asyncIterator) throw new TypeError(\"Symbol.asyncIterator is not defined.\");\n    var m = o[Symbol.asyncIterator], i;\n    return m ? m.call(o) : (o = typeof __values === \"function\" ? __values(o) : o[Symbol.iterator](), i = {}, verb(\"next\"), verb(\"throw\"), verb(\"return\"), i[Symbol.asyncIterator] = function() {\n        return this;\n    }, i);\n    function verb(n) {\n        i[n] = o[n] && function(v) {\n            return new Promise(function(resolve, reject) {\n                v = o[n](v), settle(resolve, reject, v.done, v.value);\n            });\n        };\n    }\n    function settle(resolve, reject, d, v1) {\n        Promise.resolve(v1).then(function(v) {\n            resolve({\n                value: v,\n                done: d\n            });\n        }, reject);\n    }\n}\nfunction __makeTemplateObject(cooked, raw) {\n    if (Object.defineProperty) Object.defineProperty(cooked, \"raw\", {\n        value: raw\n    });\n    else cooked.raw = raw;\n    return cooked;\n}\nvar __setModuleDefault = Object.create ? function(o, v) {\n    Object.defineProperty(o, \"default\", {\n        enumerable: true,\n        value: v\n    });\n} : function(o, v) {\n    o[\"default\"] = v;\n};\nfunction __importStar(mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) {\n        for(var k in mod)if (k !== \"default\" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);\n    }\n    __setModuleDefault(result, mod);\n    return result;\n}\nfunction __importDefault(mod) {\n    return mod && mod.__esModule ? mod : {\n        default: mod\n    };\n}\nfunction __classPrivateFieldGet(receiver, state, kind, f) {\n    if (kind === \"a\" && !f) throw new TypeError(\"Private accessor was defined without a getter\");\n    if (typeof state === \"function\" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError(\"Cannot read private member from an object whose class did not declare it\");\n    return kind === \"m\" ? f : kind === \"a\" ? f.call(receiver) : f ? f.value : state.get(receiver);\n}\nfunction __classPrivateFieldSet(receiver, state, value, kind, f) {\n    if (kind === \"m\") throw new TypeError(\"Private method is not writable\");\n    if (kind === \"a\" && !f) throw new TypeError(\"Private accessor was defined without a setter\");\n    if (typeof state === \"function\" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError(\"Cannot write private member to an object whose class did not declare it\");\n    return kind === \"a\" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;\n}\nfunction __classPrivateFieldIn(state, receiver) {\n    if (receiver === null || typeof receiver !== \"object\" && typeof receiver !== \"function\") throw new TypeError(\"Cannot use 'in' operator on non-object\");\n    return typeof state === \"function\" ? receiver === state : state.has(receiver);\n}\n\n},{\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}],\"boKlo\":[function(require,module,exports) {\nexports.interopDefault = function(a) {\n    return a && a.__esModule ? a : {\n        default: a\n    };\n};\nexports.defineInteropFlag = function(a) {\n    Object.defineProperty(a, \"__esModule\", {\n        value: true\n    });\n};\nexports.exportAll = function(source, dest) {\n    Object.keys(source).forEach(function(key) {\n        if (key === \"default\" || key === \"__esModule\" || dest.hasOwnProperty(key)) return;\n        Object.defineProperty(dest, key, {\n            enumerable: true,\n            get: function() {\n                return source[key];\n            }\n        });\n    });\n    return dest;\n};\nexports.export = function(dest, destName, get) {\n    Object.defineProperty(dest, destName, {\n        enumerable: true,\n        get: get\n    });\n};\n\n},{}],\"gHzlU\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.JsonRpcProvider = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst http_1 = require(\"./http\");\nconst ws_1 = require(\"./ws\");\nconst url_1 = require(\"./url\");\nclass JsonRpcProvider extends utils_1.IJsonRpcProvider {\n    constructor(connection){\n        super(connection);\n        this.events = new events_1.EventEmitter();\n        this.connection = this.setConnection(connection);\n    }\n    connect(connection = this.connection) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.open(connection);\n        });\n    }\n    disconnect() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.close();\n        });\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    request(request, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            return this.requestStrict(utils_1.formatJsonRpcRequest(request.method, request.params || []), context);\n        });\n    }\n    requestStrict(request, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            return new Promise((resolve, reject)=>tslib_1.__awaiter(this, void 0, void 0, function*() {\n                    if (!this.connection.connected) try {\n                        yield this.open();\n                    } catch (e) {\n                        reject(e.message);\n                    }\n                    this.events.on(`${request.id}`, (response)=>{\n                        if (utils_1.isJsonRpcError(response)) reject(response.error.message);\n                        else resolve(response.result);\n                    });\n                    yield this.connection.send(request);\n                }));\n        });\n    }\n    setConnection(connection = this.connection) {\n        return typeof connection === \"string\" ? url_1.isHttpUrl(connection) ? new http_1.HttpConnection(connection) : new ws_1.WsConnection(connection) : connection;\n    }\n    onPayload(payload) {\n        this.events.emit(\"payload\", payload);\n        if (utils_1.isJsonRpcResponse(payload)) this.events.emit(`${payload.id}`, payload);\n        else this.events.emit(\"message\", {\n            type: payload.method,\n            data: payload.params\n        });\n    }\n    open(connection = this.connection) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (this.connection === connection && this.connection.connected) return;\n            if (this.connection.connected) this.close();\n            this.connection = this.setConnection();\n            yield this.connection.open();\n            this.connection.on(\"payload\", (payload)=>this.onPayload(payload));\n            this.connection.on(\"close\", ()=>this.events.emit(\"disconnect\"));\n            this.connection.on(\"error\", ()=>this.events.emit(\"error\"));\n            this.events.emit(\"connect\");\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.connection.close();\n            this.events.emit(\"disconnect\");\n        });\n    }\n}\nexports.JsonRpcProvider = JsonRpcProvider;\nexports.default = JsonRpcProvider;\n\n},{\"tslib\":\"hdsRu\",\"events\":\"eDevp\",\"@json-rpc-tools/utils\":\"h6aFv\",\"./http\":\"7LjTp\",\"./ws\":\"aknY6\",\"./url\":\"9Then\"}],\"eDevp\":[function(require,module,exports) {\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\"use strict\";\nvar R = typeof Reflect === \"object\" ? Reflect : null;\nvar ReflectApply = R && typeof R.apply === \"function\" ? R.apply : function ReflectApply(target, receiver, args) {\n    return Function.prototype.apply.call(target, receiver, args);\n};\nvar ReflectOwnKeys;\nif (R && typeof R.ownKeys === \"function\") ReflectOwnKeys = R.ownKeys;\nelse if (Object.getOwnPropertySymbols) ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));\n};\nelse ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target);\n};\nfunction ProcessEmitWarning(warning) {\n    if (console && console.warn) console.warn(warning);\n}\nvar NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {\n    return value !== value;\n};\nfunction EventEmitter() {\n    EventEmitter.init.call(this);\n}\nmodule.exports = EventEmitter;\nmodule.exports.once = once;\n// Backwards-compat with node 0.10.x\nEventEmitter.EventEmitter = EventEmitter;\nEventEmitter.prototype._events = undefined;\nEventEmitter.prototype._eventsCount = 0;\nEventEmitter.prototype._maxListeners = undefined;\n// By default EventEmitters will print a warning if more than 10 listeners are\n// added to it. This is a useful default which helps finding memory leaks.\nvar defaultMaxListeners = 10;\nfunction checkListener(listener) {\n    if (typeof listener !== \"function\") throw new TypeError('The \"listener\" argument must be of type Function. Received type ' + typeof listener);\n}\nObject.defineProperty(EventEmitter, \"defaultMaxListeners\", {\n    enumerable: true,\n    get: function() {\n        return defaultMaxListeners;\n    },\n    set: function(arg) {\n        if (typeof arg !== \"number\" || arg < 0 || NumberIsNaN(arg)) throw new RangeError('The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received ' + arg + \".\");\n        defaultMaxListeners = arg;\n    }\n});\nEventEmitter.init = function() {\n    if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {\n        this._events = Object.create(null);\n        this._eventsCount = 0;\n    }\n    this._maxListeners = this._maxListeners || undefined;\n};\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nEventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {\n    if (typeof n !== \"number\" || n < 0 || NumberIsNaN(n)) throw new RangeError('The value of \"n\" is out of range. It must be a non-negative number. Received ' + n + \".\");\n    this._maxListeners = n;\n    return this;\n};\nfunction _getMaxListeners(that) {\n    if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;\n    return that._maxListeners;\n}\nEventEmitter.prototype.getMaxListeners = function getMaxListeners() {\n    return _getMaxListeners(this);\n};\nEventEmitter.prototype.emit = function emit(type) {\n    var args = [];\n    for(var i = 1; i < arguments.length; i++)args.push(arguments[i]);\n    var doError = type === \"error\";\n    var events = this._events;\n    if (events !== undefined) doError = doError && events.error === undefined;\n    else if (!doError) return false;\n    // If there is no 'error' event listener then throw.\n    if (doError) {\n        var er;\n        if (args.length > 0) er = args[0];\n        if (er instanceof Error) // Note: The comments on the `throw` lines are intentional, they show\n        // up in Node's output if this results in an unhandled exception.\n        throw er; // Unhandled 'error' event\n        // At least give some kind of context to the user\n        var err = new Error(\"Unhandled error.\" + (er ? \" (\" + er.message + \")\" : \"\"));\n        err.context = er;\n        throw err; // Unhandled 'error' event\n    }\n    var handler = events[type];\n    if (handler === undefined) return false;\n    if (typeof handler === \"function\") ReflectApply(handler, this, args);\n    else {\n        var len = handler.length;\n        var listeners = arrayClone(handler, len);\n        for(var i = 0; i < len; ++i)ReflectApply(listeners[i], this, args);\n    }\n    return true;\n};\nfunction _addListener(target, type, listener, prepend) {\n    var m;\n    var events;\n    var existing;\n    checkListener(listener);\n    events = target._events;\n    if (events === undefined) {\n        events = target._events = Object.create(null);\n        target._eventsCount = 0;\n    } else {\n        // To avoid recursion in the case that type === \"newListener\"! Before\n        // adding it to the listeners, first emit \"newListener\".\n        if (events.newListener !== undefined) {\n            target.emit(\"newListener\", type, listener.listener ? listener.listener : listener);\n            // Re-assign `events` because a newListener handler could have caused the\n            // this._events to be assigned to a new object\n            events = target._events;\n        }\n        existing = events[type];\n    }\n    if (existing === undefined) {\n        // Optimize the case of one listener. Don't need the extra array object.\n        existing = events[type] = listener;\n        ++target._eventsCount;\n    } else {\n        if (typeof existing === \"function\") // Adding the second element, need to change to array.\n        existing = events[type] = prepend ? [\n            listener,\n            existing\n        ] : [\n            existing,\n            listener\n        ];\n        else if (prepend) existing.unshift(listener);\n        else existing.push(listener);\n        // Check for listener leak\n        m = _getMaxListeners(target);\n        if (m > 0 && existing.length > m && !existing.warned) {\n            existing.warned = true;\n            // No error code for this since it is a Warning\n            // eslint-disable-next-line no-restricted-syntax\n            var w = new Error(\"Possible EventEmitter memory leak detected. \" + existing.length + \" \" + String(type) + \" listeners \" + \"added. Use emitter.setMaxListeners() to \" + \"increase limit\");\n            w.name = \"MaxListenersExceededWarning\";\n            w.emitter = target;\n            w.type = type;\n            w.count = existing.length;\n            ProcessEmitWarning(w);\n        }\n    }\n    return target;\n}\nEventEmitter.prototype.addListener = function addListener(type, listener) {\n    return _addListener(this, type, listener, false);\n};\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\nEventEmitter.prototype.prependListener = function prependListener(type, listener) {\n    return _addListener(this, type, listener, true);\n};\nfunction onceWrapper() {\n    if (!this.fired) {\n        this.target.removeListener(this.type, this.wrapFn);\n        this.fired = true;\n        if (arguments.length === 0) return this.listener.call(this.target);\n        return this.listener.apply(this.target, arguments);\n    }\n}\nfunction _onceWrap(target, type, listener) {\n    var state = {\n        fired: false,\n        wrapFn: undefined,\n        target: target,\n        type: type,\n        listener: listener\n    };\n    var wrapped = onceWrapper.bind(state);\n    wrapped.listener = listener;\n    state.wrapFn = wrapped;\n    return wrapped;\n}\nEventEmitter.prototype.once = function once(type, listener) {\n    checkListener(listener);\n    this.on(type, _onceWrap(this, type, listener));\n    return this;\n};\nEventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {\n    checkListener(listener);\n    this.prependListener(type, _onceWrap(this, type, listener));\n    return this;\n};\n// Emits a 'removeListener' event if and only if the listener was removed.\nEventEmitter.prototype.removeListener = function removeListener(type, listener) {\n    var list, events, position, i, originalListener;\n    checkListener(listener);\n    events = this._events;\n    if (events === undefined) return this;\n    list = events[type];\n    if (list === undefined) return this;\n    if (list === listener || list.listener === listener) {\n        if (--this._eventsCount === 0) this._events = Object.create(null);\n        else {\n            delete events[type];\n            if (events.removeListener) this.emit(\"removeListener\", type, list.listener || listener);\n        }\n    } else if (typeof list !== \"function\") {\n        position = -1;\n        for(i = list.length - 1; i >= 0; i--)if (list[i] === listener || list[i].listener === listener) {\n            originalListener = list[i].listener;\n            position = i;\n            break;\n        }\n        if (position < 0) return this;\n        if (position === 0) list.shift();\n        else spliceOne(list, position);\n        if (list.length === 1) events[type] = list[0];\n        if (events.removeListener !== undefined) this.emit(\"removeListener\", type, originalListener || listener);\n    }\n    return this;\n};\nEventEmitter.prototype.off = EventEmitter.prototype.removeListener;\nEventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {\n    var listeners, events, i;\n    events = this._events;\n    if (events === undefined) return this;\n    // not listening for removeListener, no need to emit\n    if (events.removeListener === undefined) {\n        if (arguments.length === 0) {\n            this._events = Object.create(null);\n            this._eventsCount = 0;\n        } else if (events[type] !== undefined) {\n            if (--this._eventsCount === 0) this._events = Object.create(null);\n            else delete events[type];\n        }\n        return this;\n    }\n    // emit removeListener for all listeners on all events\n    if (arguments.length === 0) {\n        var keys = Object.keys(events);\n        var key;\n        for(i = 0; i < keys.length; ++i){\n            key = keys[i];\n            if (key === \"removeListener\") continue;\n            this.removeAllListeners(key);\n        }\n        this.removeAllListeners(\"removeListener\");\n        this._events = Object.create(null);\n        this._eventsCount = 0;\n        return this;\n    }\n    listeners = events[type];\n    if (typeof listeners === \"function\") this.removeListener(type, listeners);\n    else if (listeners !== undefined) // LIFO order\n    for(i = listeners.length - 1; i >= 0; i--)this.removeListener(type, listeners[i]);\n    return this;\n};\nfunction _listeners(target, type, unwrap) {\n    var events = target._events;\n    if (events === undefined) return [];\n    var evlistener = events[type];\n    if (evlistener === undefined) return [];\n    if (typeof evlistener === \"function\") return unwrap ? [\n        evlistener.listener || evlistener\n    ] : [\n        evlistener\n    ];\n    return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);\n}\nEventEmitter.prototype.listeners = function listeners(type) {\n    return _listeners(this, type, true);\n};\nEventEmitter.prototype.rawListeners = function rawListeners(type) {\n    return _listeners(this, type, false);\n};\nEventEmitter.listenerCount = function(emitter, type) {\n    if (typeof emitter.listenerCount === \"function\") return emitter.listenerCount(type);\n    else return listenerCount.call(emitter, type);\n};\nEventEmitter.prototype.listenerCount = listenerCount;\nfunction listenerCount(type) {\n    var events = this._events;\n    if (events !== undefined) {\n        var evlistener = events[type];\n        if (typeof evlistener === \"function\") return 1;\n        else if (evlistener !== undefined) return evlistener.length;\n    }\n    return 0;\n}\nEventEmitter.prototype.eventNames = function eventNames() {\n    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];\n};\nfunction arrayClone(arr, n) {\n    var copy = new Array(n);\n    for(var i = 0; i < n; ++i)copy[i] = arr[i];\n    return copy;\n}\nfunction spliceOne(list, index) {\n    for(; index + 1 < list.length; index++)list[index] = list[index + 1];\n    list.pop();\n}\nfunction unwrapListeners(arr) {\n    var ret = new Array(arr.length);\n    for(var i = 0; i < ret.length; ++i)ret[i] = arr[i].listener || arr[i];\n    return ret;\n}\nfunction once(emitter, name) {\n    return new Promise(function(resolve, reject) {\n        function errorListener(err) {\n            emitter.removeListener(name, resolver);\n            reject(err);\n        }\n        function resolver() {\n            if (typeof emitter.removeListener === \"function\") emitter.removeListener(\"error\", errorListener);\n            resolve([].slice.call(arguments));\n        }\n        eventTargetAgnosticAddListener(emitter, name, resolver, {\n            once: true\n        });\n        if (name !== \"error\") addErrorHandlerIfEventEmitter(emitter, errorListener, {\n            once: true\n        });\n    });\n}\nfunction addErrorHandlerIfEventEmitter(emitter, handler, flags) {\n    if (typeof emitter.on === \"function\") eventTargetAgnosticAddListener(emitter, \"error\", handler, flags);\n}\nfunction eventTargetAgnosticAddListener(emitter, name, listener, flags) {\n    if (typeof emitter.on === \"function\") {\n        if (flags.once) emitter.once(name, listener);\n        else emitter.on(name, listener);\n    } else if (typeof emitter.addEventListener === \"function\") // EventTarget does not have `error` event semantics like Node\n    // EventEmitters, we do not listen for `error` events here.\n    emitter.addEventListener(name, function wrapListener(arg) {\n        // IE does not have builtin `{ once: true }` support so we\n        // have to do it manually.\n        if (flags.once) emitter.removeEventListener(name, wrapListener);\n        listener(arg);\n    });\n    else throw new TypeError('The \"emitter\" argument must be of type EventEmitter. Received type ' + typeof emitter);\n}\n\n},{}],\"h6aFv\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"./constants\"), exports);\ntslib_1.__exportStar(require(\"./error\"), exports);\ntslib_1.__exportStar(require(\"./env\"), exports);\ntslib_1.__exportStar(require(\"./format\"), exports);\ntslib_1.__exportStar(require(\"./routing\"), exports);\ntslib_1.__exportStar(require(\"./types\"), exports);\ntslib_1.__exportStar(require(\"./validators\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"./constants\":\"jTADb\",\"./error\":\"kvTPR\",\"./env\":\"hTySz\",\"./format\":\"8Olxe\",\"./routing\":\"5NgkK\",\"./types\":\"gyxNo\",\"./validators\":\"5Lvro\"}],\"jTADb\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.STANDARD_ERROR_MAP = exports.SERVER_ERROR_CODE_RANGE = exports.RESERVED_ERROR_CODES = exports.SERVER_ERROR = exports.INTERNAL_ERROR = exports.INVALID_PARAMS = exports.METHOD_NOT_FOUND = exports.INVALID_REQUEST = exports.PARSE_ERROR = void 0;\nexports.PARSE_ERROR = \"PARSE_ERROR\";\nexports.INVALID_REQUEST = \"INVALID_REQUEST\";\nexports.METHOD_NOT_FOUND = \"METHOD_NOT_FOUND\";\nexports.INVALID_PARAMS = \"INVALID_PARAMS\";\nexports.INTERNAL_ERROR = \"INTERNAL_ERROR\";\nexports.SERVER_ERROR = \"SERVER_ERROR\";\nexports.RESERVED_ERROR_CODES = [\n    -32700,\n    -32600,\n    -32601,\n    -32602,\n    -32603\n];\nexports.SERVER_ERROR_CODE_RANGE = [\n    -32000,\n    -32099\n];\nexports.STANDARD_ERROR_MAP = {\n    [exports.PARSE_ERROR]: {\n        code: -32700,\n        message: \"Parse error\"\n    },\n    [exports.INVALID_REQUEST]: {\n        code: -32600,\n        message: \"Invalid Request\"\n    },\n    [exports.METHOD_NOT_FOUND]: {\n        code: -32601,\n        message: \"Method not found\"\n    },\n    [exports.INVALID_PARAMS]: {\n        code: -32602,\n        message: \"Invalid params\"\n    },\n    [exports.INTERNAL_ERROR]: {\n        code: -32603,\n        message: \"Internal error\"\n    },\n    [exports.SERVER_ERROR]: {\n        code: -32000,\n        message: \"Server error\"\n    }\n};\n\n},{}],\"kvTPR\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.validateJsonRpcError = exports.getErrorByCode = exports.getError = exports.isValidErrorCode = exports.isReservedErrorCode = exports.isServerErrorCode = void 0;\nconst constants_1 = require(\"./constants\");\nfunction isServerErrorCode(code) {\n    return code <= constants_1.SERVER_ERROR_CODE_RANGE[0] && code >= constants_1.SERVER_ERROR_CODE_RANGE[1];\n}\nexports.isServerErrorCode = isServerErrorCode;\nfunction isReservedErrorCode(code) {\n    return constants_1.RESERVED_ERROR_CODES.includes(code);\n}\nexports.isReservedErrorCode = isReservedErrorCode;\nfunction isValidErrorCode(code) {\n    return typeof code === \"number\";\n}\nexports.isValidErrorCode = isValidErrorCode;\nfunction getError(type) {\n    if (!Object.keys(constants_1.STANDARD_ERROR_MAP).includes(type)) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];\n    return constants_1.STANDARD_ERROR_MAP[type];\n}\nexports.getError = getError;\nfunction getErrorByCode(code) {\n    const match = Object.values(constants_1.STANDARD_ERROR_MAP).find((e)=>e.code === code);\n    if (!match) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];\n    return match;\n}\nexports.getErrorByCode = getErrorByCode;\nfunction validateJsonRpcError(response) {\n    if (typeof response.error.code === \"undefined\") return {\n        valid: false,\n        error: \"Missing code for JSON-RPC error\"\n    };\n    if (typeof response.error.message === \"undefined\") return {\n        valid: false,\n        error: \"Missing message for JSON-RPC error\"\n    };\n    if (!isValidErrorCode(response.error.code)) return {\n        valid: false,\n        error: `Invalid error code type for JSON-RPC: ${response.error.code}`\n    };\n    if (isReservedErrorCode(response.error.code)) {\n        const error = getErrorByCode(response.error.code);\n        if (error.message !== constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR].message && response.error.message === error.message) return {\n            valid: false,\n            error: `Invalid error code message for JSON-RPC: ${response.error.code}`\n        };\n    }\n    return {\n        valid: true\n    };\n}\nexports.validateJsonRpcError = validateJsonRpcError;\n\n},{\"./constants\":\"jTADb\"}],\"hTySz\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isNodeJs = void 0;\nconst tslib_1 = require(\"tslib\");\nconst environment_1 = require(\"@pedrouid/environment\");\nexports.isNodeJs = environment_1.isNode;\ntslib_1.__exportStar(require(\"@pedrouid/environment\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"@pedrouid/environment\":\"b372L\"}],\"b372L\":[function(require,module,exports) {\n\"use strict\";\nvar __createBinding = this && this.__createBinding || (Object.create ? function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    Object.defineProperty(o, k2, {\n        enumerable: true,\n        get: function() {\n            return m[k];\n        }\n    });\n} : function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n});\nvar __exportStar = this && this.__exportStar || function(m, exports) {\n    for(var p in m)if (p !== \"default\" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);\n};\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n__exportStar(require(\"./crypto\"), exports);\n__exportStar(require(\"./env\"), exports);\n\n},{\"./crypto\":\"dg5EK\",\"./env\":\"5c1UZ\"}],\"dg5EK\":[function(require,module,exports) {\n\"use strict\";\nvar global = arguments[3];\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isBrowserCryptoAvailable = exports.getSubtleCrypto = exports.getBrowerCrypto = void 0;\nfunction getBrowerCrypto() {\n    return (global === null || global === void 0 ? void 0 : global.crypto) || (global === null || global === void 0 ? void 0 : global.msCrypto) || {};\n}\nexports.getBrowerCrypto = getBrowerCrypto;\nfunction getSubtleCrypto() {\n    const browserCrypto = getBrowerCrypto();\n    return browserCrypto.subtle || browserCrypto.webkitSubtle;\n}\nexports.getSubtleCrypto = getSubtleCrypto;\nfunction isBrowserCryptoAvailable() {\n    return !!getBrowerCrypto() && !!getSubtleCrypto();\n}\nexports.isBrowserCryptoAvailable = isBrowserCryptoAvailable;\n\n},{}],\"5c1UZ\":[function(require,module,exports) {\n\"use strict\";\nvar process = require(\"process\");\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isBrowser = exports.isNode = exports.isReactNative = void 0;\nfunction isReactNative() {\n    return typeof document === \"undefined\" && typeof navigator !== \"undefined\" && navigator.product === \"ReactNative\";\n}\nexports.isReactNative = isReactNative;\nfunction isNode() {\n    return typeof process !== \"undefined\" && typeof process.versions !== \"undefined\" && typeof process.versions.node !== \"undefined\";\n}\nexports.isNode = isNode;\nfunction isBrowser() {\n    return !isReactNative() && !isNode();\n}\nexports.isBrowser = isBrowser;\n\n},{\"process\":\"1iSuU\"}],\"1iSuU\":[function(require,module,exports) {\n// shim for using process in browser\nvar process = module.exports = {};\n// cached from whatever global is present so that test runners that stub it\n// don't break things.  But we need to wrap it in a try catch in case it is\n// wrapped in strict mode code which doesn't define any globals.  It's inside a\n// function because try/catches deoptimize in certain engines.\nvar cachedSetTimeout;\nvar cachedClearTimeout;\nfunction defaultSetTimout() {\n    throw new Error(\"setTimeout has not been defined\");\n}\nfunction defaultClearTimeout() {\n    throw new Error(\"clearTimeout has not been defined\");\n}\n(function() {\n    try {\n        if (typeof setTimeout === \"function\") cachedSetTimeout = setTimeout;\n        else cachedSetTimeout = defaultSetTimout;\n    } catch (e) {\n        cachedSetTimeout = defaultSetTimout;\n    }\n    try {\n        if (typeof clearTimeout === \"function\") cachedClearTimeout = clearTimeout;\n        else cachedClearTimeout = defaultClearTimeout;\n    } catch (e1) {\n        cachedClearTimeout = defaultClearTimeout;\n    }\n})();\nfunction runTimeout(fun) {\n    if (cachedSetTimeout === setTimeout) //normal enviroments in sane situations\n    return setTimeout(fun, 0);\n    // if setTimeout wasn't available but was latter defined\n    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {\n        cachedSetTimeout = setTimeout;\n        return setTimeout(fun, 0);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedSetTimeout(fun, 0);\n    } catch (e) {\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally\n            return cachedSetTimeout.call(null, fun, 0);\n        } catch (e) {\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error\n            return cachedSetTimeout.call(this, fun, 0);\n        }\n    }\n}\nfunction runClearTimeout(marker) {\n    if (cachedClearTimeout === clearTimeout) //normal enviroments in sane situations\n    return clearTimeout(marker);\n    // if clearTimeout wasn't available but was latter defined\n    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {\n        cachedClearTimeout = clearTimeout;\n        return clearTimeout(marker);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedClearTimeout(marker);\n    } catch (e) {\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally\n            return cachedClearTimeout.call(null, marker);\n        } catch (e) {\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.\n            // Some versions of I.E. have different rules for clearTimeout vs setTimeout\n            return cachedClearTimeout.call(this, marker);\n        }\n    }\n}\nvar queue = [];\nvar draining = false;\nvar currentQueue;\nvar queueIndex = -1;\nfunction cleanUpNextTick() {\n    if (!draining || !currentQueue) return;\n    draining = false;\n    if (currentQueue.length) queue = currentQueue.concat(queue);\n    else queueIndex = -1;\n    if (queue.length) drainQueue();\n}\nfunction drainQueue() {\n    if (draining) return;\n    var timeout = runTimeout(cleanUpNextTick);\n    draining = true;\n    var len = queue.length;\n    while(len){\n        currentQueue = queue;\n        queue = [];\n        while(++queueIndex < len)if (currentQueue) currentQueue[queueIndex].run();\n        queueIndex = -1;\n        len = queue.length;\n    }\n    currentQueue = null;\n    draining = false;\n    runClearTimeout(timeout);\n}\nprocess.nextTick = function(fun) {\n    var args = new Array(arguments.length - 1);\n    if (arguments.length > 1) for(var i = 1; i < arguments.length; i++)args[i - 1] = arguments[i];\n    queue.push(new Item(fun, args));\n    if (queue.length === 1 && !draining) runTimeout(drainQueue);\n};\n// v8 likes predictible objects\nfunction Item(fun, array) {\n    this.fun = fun;\n    this.array = array;\n}\nItem.prototype.run = function() {\n    this.fun.apply(null, this.array);\n};\nprocess.title = \"browser\";\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\nprocess.version = \"\"; // empty string to avoid regexp issues\nprocess.versions = {};\nfunction noop() {}\nprocess.on = noop;\nprocess.addListener = noop;\nprocess.once = noop;\nprocess.off = noop;\nprocess.removeListener = noop;\nprocess.removeAllListeners = noop;\nprocess.emit = noop;\nprocess.prependListener = noop;\nprocess.prependOnceListener = noop;\nprocess.listeners = function(name) {\n    return [];\n};\nprocess.binding = function(name) {\n    throw new Error(\"process.binding is not supported\");\n};\nprocess.cwd = function() {\n    return \"/\";\n};\nprocess.chdir = function(dir) {\n    throw new Error(\"process.chdir is not supported\");\n};\nprocess.umask = function() {\n    return 0;\n};\n\n},{}],\"8Olxe\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.formatErrorMessage = exports.formatJsonRpcError = exports.formatJsonRpcResult = exports.formatJsonRpcRequest = exports.payloadId = void 0;\nconst error_1 = require(\"./error\");\nconst constants_1 = require(\"./constants\");\nfunction payloadId() {\n    const date = Date.now() * Math.pow(10, 3);\n    const extra = Math.floor(Math.random() * Math.pow(10, 3));\n    return date + extra;\n}\nexports.payloadId = payloadId;\nfunction formatJsonRpcRequest(method, params, id) {\n    return {\n        id: id || payloadId(),\n        jsonrpc: \"2.0\",\n        method,\n        params\n    };\n}\nexports.formatJsonRpcRequest = formatJsonRpcRequest;\nfunction formatJsonRpcResult(id, result) {\n    return {\n        id,\n        jsonrpc: \"2.0\",\n        result\n    };\n}\nexports.formatJsonRpcResult = formatJsonRpcResult;\nfunction formatJsonRpcError(id, error) {\n    return {\n        id,\n        jsonrpc: \"2.0\",\n        error: formatErrorMessage(error)\n    };\n}\nexports.formatJsonRpcError = formatJsonRpcError;\nfunction formatErrorMessage(error) {\n    if (typeof error === \"undefined\") return error_1.getError(constants_1.INTERNAL_ERROR);\n    if (typeof error === \"string\") error = Object.assign(Object.assign({}, error_1.getError(constants_1.SERVER_ERROR)), {\n        message: error\n    });\n    if (error_1.isReservedErrorCode(error.code)) error = error_1.getErrorByCode(error.code);\n    if (!error_1.isServerErrorCode(error.code)) throw new Error(\"Error code is not in server code range\");\n    return error;\n}\nexports.formatErrorMessage = formatErrorMessage;\n\n},{\"./error\":\"kvTPR\",\"./constants\":\"jTADb\"}],\"5NgkK\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isValidTrailingWildcardRoute = exports.isValidLeadingWildcardRoute = exports.isValidWildcardRoute = exports.isValidDefaultRoute = exports.isValidRoute = void 0;\nfunction isValidRoute(route) {\n    if (route.includes(\"*\")) return isValidWildcardRoute(route);\n    if (/\\W/g.test(route)) return false;\n    return true;\n}\nexports.isValidRoute = isValidRoute;\nfunction isValidDefaultRoute(route) {\n    return route === \"*\";\n}\nexports.isValidDefaultRoute = isValidDefaultRoute;\nfunction isValidWildcardRoute(route) {\n    if (isValidDefaultRoute(route)) return true;\n    if (!route.includes(\"*\")) return false;\n    if (route.split(\"*\").length !== 2) return false;\n    if (route.split(\"*\").filter((x)=>x.trim() === \"\").length !== 1) return false;\n    return true;\n}\nexports.isValidWildcardRoute = isValidWildcardRoute;\nfunction isValidLeadingWildcardRoute(route) {\n    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split(\"*\")[0].trim();\n}\nexports.isValidLeadingWildcardRoute = isValidLeadingWildcardRoute;\nfunction isValidTrailingWildcardRoute(route) {\n    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split(\"*\")[1].trim();\n}\nexports.isValidTrailingWildcardRoute = isValidTrailingWildcardRoute;\n\n},{}],\"gyxNo\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"@json-rpc-tools/types\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"@json-rpc-tools/types\":\"6TTqw\"}],\"6TTqw\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"./blockchain\"), exports);\ntslib_1.__exportStar(require(\"./jsonrpc\"), exports);\ntslib_1.__exportStar(require(\"./misc\"), exports);\ntslib_1.__exportStar(require(\"./multi\"), exports);\ntslib_1.__exportStar(require(\"./provider\"), exports);\ntslib_1.__exportStar(require(\"./router\"), exports);\ntslib_1.__exportStar(require(\"./schema\"), exports);\ntslib_1.__exportStar(require(\"./validator\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"./blockchain\":\"5PMmI\",\"./jsonrpc\":\"azpg2\",\"./misc\":\"16ntc\",\"./multi\":\"hkR47\",\"./provider\":\"k2Sp0\",\"./router\":\"f8QmQ\",\"./schema\":\"kSI89\",\"./validator\":\"1gDtV\"}],\"5PMmI\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IBlockchainProvider = exports.IBlockchainAuthenticator = exports.IPendingRequests = void 0;\nconst misc_1 = require(\"./misc\");\nconst provider_1 = require(\"./provider\");\nclass IPendingRequests {\n    constructor(storage){\n        this.storage = storage;\n    }\n}\nexports.IPendingRequests = IPendingRequests;\nclass IBlockchainAuthenticator extends misc_1.IEvents {\n    constructor(config){\n        super();\n        this.config = config;\n    }\n}\nexports.IBlockchainAuthenticator = IBlockchainAuthenticator;\nclass IBlockchainProvider extends provider_1.IJsonRpcProvider {\n    constructor(connection, config){\n        super(connection);\n    }\n}\nexports.IBlockchainProvider = IBlockchainProvider;\n\n},{\"./misc\":\"16ntc\",\"./provider\":\"k2Sp0\"}],\"16ntc\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IEvents = void 0;\nclass IEvents {\n}\nexports.IEvents = IEvents;\n\n},{}],\"k2Sp0\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcProvider = exports.IBaseJsonRpcProvider = exports.IJsonRpcConnection = void 0;\nconst misc_1 = require(\"./misc\");\nclass IJsonRpcConnection extends misc_1.IEvents {\n    constructor(opts){\n        super();\n    }\n}\nexports.IJsonRpcConnection = IJsonRpcConnection;\nclass IBaseJsonRpcProvider extends misc_1.IEvents {\n    constructor(){\n        super();\n    }\n}\nexports.IBaseJsonRpcProvider = IBaseJsonRpcProvider;\nclass IJsonRpcProvider extends IBaseJsonRpcProvider {\n    constructor(connection){\n        super();\n    }\n}\nexports.IJsonRpcProvider = IJsonRpcProvider;\n\n},{\"./misc\":\"16ntc\"}],\"azpg2\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n\n},{}],\"hkR47\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IMultiServiceProvider = void 0;\nconst provider_1 = require(\"./provider\");\nclass IMultiServiceProvider extends provider_1.IBaseJsonRpcProvider {\n    constructor(config){\n        super();\n        this.config = config;\n    }\n}\nexports.IMultiServiceProvider = IMultiServiceProvider;\n\n},{\"./provider\":\"k2Sp0\"}],\"f8QmQ\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcRouter = void 0;\nclass IJsonRpcRouter {\n    constructor(routes){\n        this.routes = routes;\n    }\n}\nexports.IJsonRpcRouter = IJsonRpcRouter;\n\n},{}],\"kSI89\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n\n},{}],\"1gDtV\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcValidator = void 0;\nclass IJsonRpcValidator {\n    constructor(schemas){\n        this.schemas = schemas;\n    }\n}\nexports.IJsonRpcValidator = IJsonRpcValidator;\n\n},{}],\"5Lvro\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isJsonRpcValidationInvalid = exports.isJsonRpcError = exports.isJsonRpcResult = exports.isJsonRpcResponse = exports.isJsonRpcRequest = exports.isJsonRpcPayload = void 0;\nfunction isJsonRpcPayload(payload) {\n    return \"id\" in payload && \"jsonrpc\" in payload && payload.jsonrpc === \"2.0\";\n}\nexports.isJsonRpcPayload = isJsonRpcPayload;\nfunction isJsonRpcRequest(payload) {\n    return isJsonRpcPayload(payload) && \"method\" in payload;\n}\nexports.isJsonRpcRequest = isJsonRpcRequest;\nfunction isJsonRpcResponse(payload) {\n    return isJsonRpcPayload(payload) && (isJsonRpcResult(payload) || isJsonRpcError(payload));\n}\nexports.isJsonRpcResponse = isJsonRpcResponse;\nfunction isJsonRpcResult(payload) {\n    return \"result\" in payload;\n}\nexports.isJsonRpcResult = isJsonRpcResult;\nfunction isJsonRpcError(payload) {\n    return \"error\" in payload;\n}\nexports.isJsonRpcError = isJsonRpcError;\nfunction isJsonRpcValidationInvalid(validation) {\n    return \"error\" in validation && validation.valid === false;\n}\nexports.isJsonRpcValidationInvalid = isJsonRpcValidationInvalid;\n\n},{}],\"7LjTp\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.HttpConnection = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst axios_1 = tslib_1.__importDefault(require(\"axios\"));\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst safe_json_utils_1 = require(\"safe-json-utils\");\nconst url_1 = require(\"./url\");\nclass HttpConnection {\n    constructor(url){\n        this.url = url;\n        this.events = new events_1.EventEmitter();\n        this.registering = false;\n        if (!url_1.isHttpUrl(url)) throw new Error(`Provided URL is not compatible with HTTP connection: ${url}`);\n        this.url = url;\n    }\n    get connected() {\n        return typeof this.api !== \"undefined\";\n    }\n    get connecting() {\n        return this.registering;\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    open(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.api = yield this.register(url);\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.onClose();\n        });\n    }\n    send(payload, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.api === \"undefined\") this.api = yield this.register();\n            this.api.post(\"/\", payload).then((res)=>this.onPayload(res)).catch((err)=>this.onError(payload.id, err));\n        });\n    }\n    register(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (!url_1.isHttpUrl(url)) throw new Error(`Provided URL is not compatible with HTTP connection: ${url}`);\n            if (this.registering) return new Promise((resolve, reject)=>{\n                this.events.once(\"open\", ()=>{\n                    if (typeof this.api === \"undefined\") return reject(new Error(\"HTTP connection is missing or invalid\"));\n                    resolve(this.api);\n                });\n            });\n            this.url = url;\n            this.registering = true;\n            const api = axios_1.default.create({\n                baseURL: url,\n                timeout: 30000,\n                headers: {\n                    Accept: \"application/json\",\n                    \"Content-Type\": \"application/json\"\n                }\n            });\n            try {\n                yield api.post(\"/\", {\n                    id: 1,\n                    jsonrpc: \"2.0\",\n                    method: \"test\",\n                    params: []\n                });\n                this.onOpen(api);\n            } catch (e) {\n                this.onClose();\n                throw new Error(`Unavailable HTTP RPC url at ${url}`);\n            }\n            return api;\n        });\n    }\n    onOpen(api) {\n        this.api = api;\n        this.registering = false;\n        this.events.emit(\"open\");\n    }\n    onClose() {\n        this.api = undefined;\n        this.events.emit(\"close\");\n    }\n    onPayload(e) {\n        if (typeof e.data === \"undefined\") return;\n        const payload = typeof e.data === \"string\" ? safe_json_utils_1.safeJsonParse(e.data) : e.data;\n        this.events.emit(\"payload\", payload);\n    }\n    onError(id, e) {\n        const message = e.message || e.toString();\n        const payload = utils_1.formatJsonRpcError(id, message);\n        this.events.emit(\"payload\", payload);\n    }\n}\nexports.HttpConnection = HttpConnection;\n\n},{\"tslib\":\"hdsRu\",\"events\":\"eDevp\",\"axios\":\"jWD94\",\"@json-rpc-tools/utils\":\"h6aFv\",\"safe-json-utils\":\"joKwd\",\"./url\":\"9Then\"}],\"jWD94\":[function(require,module,exports) {\nmodule.exports = require(\"./lib/axios\");\n\n},{\"./lib/axios\":\"16AZH\"}],\"16AZH\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./utils\");\nvar bind = require(\"./helpers/bind\");\nvar Axios = require(\"./core/Axios\");\nvar mergeConfig = require(\"./core/mergeConfig\");\nvar defaults = require(\"./defaults\");\n/**\n * Create an instance of Axios\n *\n * @param {Object} defaultConfig The default config for the instance\n * @return {Axios} A new instance of Axios\n */ function createInstance(defaultConfig) {\n    var context = new Axios(defaultConfig);\n    var instance = bind(Axios.prototype.request, context);\n    // Copy axios.prototype to instance\n    utils.extend(instance, Axios.prototype, context);\n    // Copy context to instance\n    utils.extend(instance, context);\n    return instance;\n}\n// Create the default instance to be exported\nvar axios = createInstance(defaults);\n// Expose Axios class to allow class inheritance\naxios.Axios = Axios;\n// Factory for creating new instances\naxios.create = function create(instanceConfig) {\n    return createInstance(mergeConfig(axios.defaults, instanceConfig));\n};\n// Expose Cancel & CancelToken\naxios.Cancel = require(\"./cancel/Cancel\");\naxios.CancelToken = require(\"./cancel/CancelToken\");\naxios.isCancel = require(\"./cancel/isCancel\");\n// Expose all/spread\naxios.all = function all(promises) {\n    return Promise.all(promises);\n};\naxios.spread = require(\"./helpers/spread\");\n// Expose isAxiosError\naxios.isAxiosError = require(\"./helpers/isAxiosError\");\nmodule.exports = axios;\n// Allow use of default import syntax in TypeScript\nmodule.exports.default = axios;\n\n},{\"./utils\":\"hnkFL\",\"./helpers/bind\":\"53L3D\",\"./core/Axios\":\"lUPyV\",\"./core/mergeConfig\":\"cpLHT\",\"./defaults\":\"avlKI\",\"./cancel/Cancel\":\"gnU4h\",\"./cancel/CancelToken\":\"eIXu8\",\"./cancel/isCancel\":\"a2h6U\",\"./helpers/spread\":\"1nXwb\",\"./helpers/isAxiosError\":\"iFKJj\"}],\"hnkFL\":[function(require,module,exports) {\n\"use strict\";\nvar bind = require(\"./helpers/bind\");\n// utils is a library of generic helper functions non-specific to axios\nvar toString = Object.prototype.toString;\n/**\n * Determine if a value is an Array\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an Array, otherwise false\n */ function isArray(val) {\n    return toString.call(val) === \"[object Array]\";\n}\n/**\n * Determine if a value is undefined\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if the value is undefined, otherwise false\n */ function isUndefined(val) {\n    return typeof val === \"undefined\";\n}\n/**\n * Determine if a value is a Buffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Buffer, otherwise false\n */ function isBuffer(val) {\n    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && typeof val.constructor.isBuffer === \"function\" && val.constructor.isBuffer(val);\n}\n/**\n * Determine if a value is an ArrayBuffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an ArrayBuffer, otherwise false\n */ function isArrayBuffer(val) {\n    return toString.call(val) === \"[object ArrayBuffer]\";\n}\n/**\n * Determine if a value is a FormData\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an FormData, otherwise false\n */ function isFormData(val) {\n    return typeof FormData !== \"undefined\" && val instanceof FormData;\n}\n/**\n * Determine if a value is a view on an ArrayBuffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false\n */ function isArrayBufferView(val) {\n    var result;\n    if (typeof ArrayBuffer !== \"undefined\" && ArrayBuffer.isView) result = ArrayBuffer.isView(val);\n    else result = val && val.buffer && val.buffer instanceof ArrayBuffer;\n    return result;\n}\n/**\n * Determine if a value is a String\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a String, otherwise false\n */ function isString(val) {\n    return typeof val === \"string\";\n}\n/**\n * Determine if a value is a Number\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Number, otherwise false\n */ function isNumber(val) {\n    return typeof val === \"number\";\n}\n/**\n * Determine if a value is an Object\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an Object, otherwise false\n */ function isObject(val) {\n    return val !== null && typeof val === \"object\";\n}\n/**\n * Determine if a value is a plain Object\n *\n * @param {Object} val The value to test\n * @return {boolean} True if value is a plain Object, otherwise false\n */ function isPlainObject(val) {\n    if (toString.call(val) !== \"[object Object]\") return false;\n    var prototype = Object.getPrototypeOf(val);\n    return prototype === null || prototype === Object.prototype;\n}\n/**\n * Determine if a value is a Date\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Date, otherwise false\n */ function isDate(val) {\n    return toString.call(val) === \"[object Date]\";\n}\n/**\n * Determine if a value is a File\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a File, otherwise false\n */ function isFile(val) {\n    return toString.call(val) === \"[object File]\";\n}\n/**\n * Determine if a value is a Blob\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Blob, otherwise false\n */ function isBlob(val) {\n    return toString.call(val) === \"[object Blob]\";\n}\n/**\n * Determine if a value is a Function\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Function, otherwise false\n */ function isFunction(val) {\n    return toString.call(val) === \"[object Function]\";\n}\n/**\n * Determine if a value is a Stream\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Stream, otherwise false\n */ function isStream(val) {\n    return isObject(val) && isFunction(val.pipe);\n}\n/**\n * Determine if a value is a URLSearchParams object\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a URLSearchParams object, otherwise false\n */ function isURLSearchParams(val) {\n    return typeof URLSearchParams !== \"undefined\" && val instanceof URLSearchParams;\n}\n/**\n * Trim excess whitespace off the beginning and end of a string\n *\n * @param {String} str The String to trim\n * @returns {String} The String freed of excess whitespace\n */ function trim(str) {\n    return str.trim ? str.trim() : str.replace(/^\\s+|\\s+$/g, \"\");\n}\n/**\n * Determine if we're running in a standard browser environment\n *\n * This allows axios to run in a web worker, and react-native.\n * Both environments support XMLHttpRequest, but not fully standard globals.\n *\n * web workers:\n *  typeof window -> undefined\n *  typeof document -> undefined\n *\n * react-native:\n *  navigator.product -> 'ReactNative'\n * nativescript\n *  navigator.product -> 'NativeScript' or 'NS'\n */ function isStandardBrowserEnv() {\n    if (typeof navigator !== \"undefined\" && (navigator.product === \"ReactNative\" || navigator.product === \"NativeScript\" || navigator.product === \"NS\")) return false;\n    return typeof window !== \"undefined\" && typeof document !== \"undefined\";\n}\n/**\n * Iterate over an Array or an Object invoking a function for each item.\n *\n * If `obj` is an Array callback will be called passing\n * the value, index, and complete array for each item.\n *\n * If 'obj' is an Object callback will be called passing\n * the value, key, and complete object for each property.\n *\n * @param {Object|Array} obj The object to iterate\n * @param {Function} fn The callback to invoke for each item\n */ function forEach(obj, fn) {\n    // Don't bother if no value provided\n    if (obj === null || typeof obj === \"undefined\") return;\n    // Force an array if not already something iterable\n    if (typeof obj !== \"object\") /*eslint no-param-reassign:0*/ obj = [\n        obj\n    ];\n    if (isArray(obj)) // Iterate over array values\n    for(var i = 0, l = obj.length; i < l; i++)fn.call(null, obj[i], i, obj);\n    else {\n        // Iterate over object keys\n        for(var key in obj)if (Object.prototype.hasOwnProperty.call(obj, key)) fn.call(null, obj[key], key, obj);\n    }\n}\n/**\n * Accepts varargs expecting each argument to be an object, then\n * immutably merges the properties of each object and returns result.\n *\n * When multiple objects contain the same key the later object in\n * the arguments list will take precedence.\n *\n * Example:\n *\n * ```js\n * var result = merge({foo: 123}, {foo: 456});\n * console.log(result.foo); // outputs 456\n * ```\n *\n * @param {Object} obj1 Object to merge\n * @returns {Object} Result of all merge properties\n */ function merge() {\n    var result = {};\n    function assignValue(val, key) {\n        if (isPlainObject(result[key]) && isPlainObject(val)) result[key] = merge(result[key], val);\n        else if (isPlainObject(val)) result[key] = merge({}, val);\n        else if (isArray(val)) result[key] = val.slice();\n        else result[key] = val;\n    }\n    for(var i = 0, l = arguments.length; i < l; i++)forEach(arguments[i], assignValue);\n    return result;\n}\n/**\n * Extends object a by mutably adding to it the properties of object b.\n *\n * @param {Object} a The object to be extended\n * @param {Object} b The object to copy properties from\n * @param {Object} thisArg The object to bind function to\n * @return {Object} The resulting value of object a\n */ function extend(a, b, thisArg) {\n    forEach(b, function assignValue(val, key) {\n        if (thisArg && typeof val === \"function\") a[key] = bind(val, thisArg);\n        else a[key] = val;\n    });\n    return a;\n}\n/**\n * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)\n *\n * @param {string} content with BOM\n * @return {string} content value without BOM\n */ function stripBOM(content) {\n    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);\n    return content;\n}\nmodule.exports = {\n    isArray: isArray,\n    isArrayBuffer: isArrayBuffer,\n    isBuffer: isBuffer,\n    isFormData: isFormData,\n    isArrayBufferView: isArrayBufferView,\n    isString: isString,\n    isNumber: isNumber,\n    isObject: isObject,\n    isPlainObject: isPlainObject,\n    isUndefined: isUndefined,\n    isDate: isDate,\n    isFile: isFile,\n    isBlob: isBlob,\n    isFunction: isFunction,\n    isStream: isStream,\n    isURLSearchParams: isURLSearchParams,\n    isStandardBrowserEnv: isStandardBrowserEnv,\n    forEach: forEach,\n    merge: merge,\n    extend: extend,\n    trim: trim,\n    stripBOM: stripBOM\n};\n\n},{\"./helpers/bind\":\"53L3D\"}],\"53L3D\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function bind(fn, thisArg) {\n    return function wrap() {\n        var args = new Array(arguments.length);\n        for(var i = 0; i < args.length; i++)args[i] = arguments[i];\n        return fn.apply(thisArg, args);\n    };\n};\n\n},{}],\"lUPyV\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar buildURL = require(\"../helpers/buildURL\");\nvar InterceptorManager = require(\"./InterceptorManager\");\nvar dispatchRequest = require(\"./dispatchRequest\");\nvar mergeConfig = require(\"./mergeConfig\");\nvar validator = require(\"../helpers/validator\");\nvar validators = validator.validators;\n/**\n * Create a new instance of Axios\n *\n * @param {Object} instanceConfig The default config for the instance\n */ function Axios(instanceConfig) {\n    this.defaults = instanceConfig;\n    this.interceptors = {\n        request: new InterceptorManager(),\n        response: new InterceptorManager()\n    };\n}\n/**\n * Dispatch a request\n *\n * @param {Object} config The config specific for this request (merged with this.defaults)\n */ Axios.prototype.request = function request(config) {\n    /*eslint no-param-reassign:0*/ // Allow for axios('example/url'[, config]) a la fetch API\n    if (typeof config === \"string\") {\n        config = arguments[1] || {};\n        config.url = arguments[0];\n    } else config = config || {};\n    config = mergeConfig(this.defaults, config);\n    // Set config.method\n    if (config.method) config.method = config.method.toLowerCase();\n    else if (this.defaults.method) config.method = this.defaults.method.toLowerCase();\n    else config.method = \"get\";\n    var transitional = config.transitional;\n    if (transitional !== undefined) validator.assertOptions(transitional, {\n        silentJSONParsing: validators.transitional(validators.boolean, \"1.0.0\"),\n        forcedJSONParsing: validators.transitional(validators.boolean, \"1.0.0\"),\n        clarifyTimeoutError: validators.transitional(validators.boolean, \"1.0.0\")\n    }, false);\n    // filter out skipped interceptors\n    var requestInterceptorChain = [];\n    var synchronousRequestInterceptors = true;\n    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {\n        if (typeof interceptor.runWhen === \"function\" && interceptor.runWhen(config) === false) return;\n        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;\n        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);\n    });\n    var responseInterceptorChain = [];\n    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {\n        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);\n    });\n    var promise;\n    if (!synchronousRequestInterceptors) {\n        var chain = [\n            dispatchRequest,\n            undefined\n        ];\n        Array.prototype.unshift.apply(chain, requestInterceptorChain);\n        chain = chain.concat(responseInterceptorChain);\n        promise = Promise.resolve(config);\n        while(chain.length)promise = promise.then(chain.shift(), chain.shift());\n        return promise;\n    }\n    var newConfig = config;\n    while(requestInterceptorChain.length){\n        var onFulfilled = requestInterceptorChain.shift();\n        var onRejected = requestInterceptorChain.shift();\n        try {\n            newConfig = onFulfilled(newConfig);\n        } catch (error) {\n            onRejected(error);\n            break;\n        }\n    }\n    try {\n        promise = dispatchRequest(newConfig);\n    } catch (error) {\n        return Promise.reject(error);\n    }\n    while(responseInterceptorChain.length)promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());\n    return promise;\n};\nAxios.prototype.getUri = function getUri(config) {\n    config = mergeConfig(this.defaults, config);\n    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\\?/, \"\");\n};\n// Provide aliases for supported request methods\nutils.forEach([\n    \"delete\",\n    \"get\",\n    \"head\",\n    \"options\"\n], function forEachMethodNoData(method) {\n    /*eslint func-names:0*/ Axios.prototype[method] = function(url, config) {\n        return this.request(mergeConfig(config || {}, {\n            method: method,\n            url: url,\n            data: (config || {}).data\n        }));\n    };\n});\nutils.forEach([\n    \"post\",\n    \"put\",\n    \"patch\"\n], function forEachMethodWithData(method) {\n    /*eslint func-names:0*/ Axios.prototype[method] = function(url, data, config) {\n        return this.request(mergeConfig(config || {}, {\n            method: method,\n            url: url,\n            data: data\n        }));\n    };\n});\nmodule.exports = Axios;\n\n},{\"./../utils\":\"hnkFL\",\"../helpers/buildURL\":\"fy0cx\",\"./InterceptorManager\":\"2ieoi\",\"./dispatchRequest\":\"eAF1d\",\"./mergeConfig\":\"cpLHT\",\"../helpers/validator\":\"2WhhG\"}],\"fy0cx\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nfunction encode(val) {\n    return encodeURIComponent(val).replace(/%3A/gi, \":\").replace(/%24/g, \"$\").replace(/%2C/gi, \",\").replace(/%20/g, \"+\").replace(/%5B/gi, \"[\").replace(/%5D/gi, \"]\");\n}\n/**\n * Build a URL by appending params to the end\n *\n * @param {string} url The base of the url (e.g., http://www.google.com)\n * @param {object} [params] The params to be appended\n * @returns {string} The formatted url\n */ module.exports = function buildURL(url, params, paramsSerializer) {\n    /*eslint no-param-reassign:0*/ if (!params) return url;\n    var serializedParams;\n    if (paramsSerializer) serializedParams = paramsSerializer(params);\n    else if (utils.isURLSearchParams(params)) serializedParams = params.toString();\n    else {\n        var parts = [];\n        utils.forEach(params, function serialize(val, key) {\n            if (val === null || typeof val === \"undefined\") return;\n            if (utils.isArray(val)) key = key + \"[]\";\n            else val = [\n                val\n            ];\n            utils.forEach(val, function parseValue(v) {\n                if (utils.isDate(v)) v = v.toISOString();\n                else if (utils.isObject(v)) v = JSON.stringify(v);\n                parts.push(encode(key) + \"=\" + encode(v));\n            });\n        });\n        serializedParams = parts.join(\"&\");\n    }\n    if (serializedParams) {\n        var hashmarkIndex = url.indexOf(\"#\");\n        if (hashmarkIndex !== -1) url = url.slice(0, hashmarkIndex);\n        url += (url.indexOf(\"?\") === -1 ? \"?\" : \"&\") + serializedParams;\n    }\n    return url;\n};\n\n},{\"./../utils\":\"hnkFL\"}],\"2ieoi\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nfunction InterceptorManager() {\n    this.handlers = [];\n}\n/**\n * Add a new interceptor to the stack\n *\n * @param {Function} fulfilled The function to handle `then` for a `Promise`\n * @param {Function} rejected The function to handle `reject` for a `Promise`\n *\n * @return {Number} An ID used to remove interceptor later\n */ InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {\n    this.handlers.push({\n        fulfilled: fulfilled,\n        rejected: rejected,\n        synchronous: options ? options.synchronous : false,\n        runWhen: options ? options.runWhen : null\n    });\n    return this.handlers.length - 1;\n};\n/**\n * Remove an interceptor from the stack\n *\n * @param {Number} id The ID that was returned by `use`\n */ InterceptorManager.prototype.eject = function eject(id) {\n    if (this.handlers[id]) this.handlers[id] = null;\n};\n/**\n * Iterate over all the registered interceptors\n *\n * This method is particularly useful for skipping over any\n * interceptors that may have become `null` calling `eject`.\n *\n * @param {Function} fn The function to call for each interceptor\n */ InterceptorManager.prototype.forEach = function forEach(fn) {\n    utils.forEach(this.handlers, function forEachHandler(h) {\n        if (h !== null) fn(h);\n    });\n};\nmodule.exports = InterceptorManager;\n\n},{\"./../utils\":\"hnkFL\"}],\"eAF1d\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar transformData = require(\"./transformData\");\nvar isCancel = require(\"../cancel/isCancel\");\nvar defaults = require(\"../defaults\");\n/**\n * Throws a `Cancel` if cancellation has been requested.\n */ function throwIfCancellationRequested(config) {\n    if (config.cancelToken) config.cancelToken.throwIfRequested();\n}\n/**\n * Dispatch a request to the server using the configured adapter.\n *\n * @param {object} config The config that is to be used for the request\n * @returns {Promise} The Promise to be fulfilled\n */ module.exports = function dispatchRequest(config) {\n    throwIfCancellationRequested(config);\n    // Ensure headers exist\n    config.headers = config.headers || {};\n    // Transform request data\n    config.data = transformData.call(config, config.data, config.headers, config.transformRequest);\n    // Flatten headers\n    config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers);\n    utils.forEach([\n        \"delete\",\n        \"get\",\n        \"head\",\n        \"post\",\n        \"put\",\n        \"patch\",\n        \"common\"\n    ], function cleanHeaderConfig(method) {\n        delete config.headers[method];\n    });\n    var adapter = config.adapter || defaults.adapter;\n    return adapter(config).then(function onAdapterResolution(response) {\n        throwIfCancellationRequested(config);\n        // Transform response data\n        response.data = transformData.call(config, response.data, response.headers, config.transformResponse);\n        return response;\n    }, function onAdapterRejection(reason) {\n        if (!isCancel(reason)) {\n            throwIfCancellationRequested(config);\n            // Transform response data\n            if (reason && reason.response) reason.response.data = transformData.call(config, reason.response.data, reason.response.headers, config.transformResponse);\n        }\n        return Promise.reject(reason);\n    });\n};\n\n},{\"./../utils\":\"hnkFL\",\"./transformData\":\"b1lA9\",\"../cancel/isCancel\":\"a2h6U\",\"../defaults\":\"avlKI\"}],\"b1lA9\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar defaults = require(\"./../defaults\");\n/**\n * Transform the data for a request or a response\n *\n * @param {Object|String} data The data to be transformed\n * @param {Array} headers The headers for the request or response\n * @param {Array|Function} fns A single function or Array of functions\n * @returns {*} The resulting transformed data\n */ module.exports = function transformData(data, headers, fns) {\n    var context = this || defaults;\n    /*eslint no-param-reassign:0*/ utils.forEach(fns, function transform(fn) {\n        data = fn.call(context, data, headers);\n    });\n    return data;\n};\n\n},{\"./../utils\":\"hnkFL\",\"./../defaults\":\"avlKI\"}],\"avlKI\":[function(require,module,exports) {\n\"use strict\";\nvar process = require(\"process\");\nvar utils = require(\"./utils\");\nvar normalizeHeaderName = require(\"./helpers/normalizeHeaderName\");\nvar enhanceError = require(\"./core/enhanceError\");\nvar DEFAULT_CONTENT_TYPE = {\n    \"Content-Type\": \"application/x-www-form-urlencoded\"\n};\nfunction setContentTypeIfUnset(headers, value) {\n    if (!utils.isUndefined(headers) && utils.isUndefined(headers[\"Content-Type\"])) headers[\"Content-Type\"] = value;\n}\nfunction getDefaultAdapter() {\n    var adapter;\n    if (typeof XMLHttpRequest !== \"undefined\") // For browsers use XHR adapter\n    adapter = require(\"./adapters/xhr\");\n    else if (typeof process !== \"undefined\" && Object.prototype.toString.call(process) === \"[object process]\") // For node use HTTP adapter\n    adapter = require(\"./adapters/http\");\n    return adapter;\n}\nfunction stringifySafely(rawValue, parser, encoder) {\n    if (utils.isString(rawValue)) try {\n        (parser || JSON.parse)(rawValue);\n        return utils.trim(rawValue);\n    } catch (e) {\n        if (e.name !== \"SyntaxError\") throw e;\n    }\n    return (encoder || JSON.stringify)(rawValue);\n}\nvar defaults = {\n    transitional: {\n        silentJSONParsing: true,\n        forcedJSONParsing: true,\n        clarifyTimeoutError: false\n    },\n    adapter: getDefaultAdapter(),\n    transformRequest: [\n        function transformRequest(data, headers) {\n            normalizeHeaderName(headers, \"Accept\");\n            normalizeHeaderName(headers, \"Content-Type\");\n            if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) return data;\n            if (utils.isArrayBufferView(data)) return data.buffer;\n            if (utils.isURLSearchParams(data)) {\n                setContentTypeIfUnset(headers, \"application/x-www-form-urlencoded;charset=utf-8\");\n                return data.toString();\n            }\n            if (utils.isObject(data) || headers && headers[\"Content-Type\"] === \"application/json\") {\n                setContentTypeIfUnset(headers, \"application/json\");\n                return stringifySafely(data);\n            }\n            return data;\n        }\n    ],\n    transformResponse: [\n        function transformResponse(data) {\n            var transitional = this.transitional;\n            var silentJSONParsing = transitional && transitional.silentJSONParsing;\n            var forcedJSONParsing = transitional && transitional.forcedJSONParsing;\n            var strictJSONParsing = !silentJSONParsing && this.responseType === \"json\";\n            if (strictJSONParsing || forcedJSONParsing && utils.isString(data) && data.length) try {\n                return JSON.parse(data);\n            } catch (e) {\n                if (strictJSONParsing) {\n                    if (e.name === \"SyntaxError\") throw enhanceError(e, this, \"E_JSON_PARSE\");\n                    throw e;\n                }\n            }\n            return data;\n        }\n    ],\n    /**\n   * A timeout in milliseconds to abort a request. If set to 0 (default) a\n   * timeout is not created.\n   */ timeout: 0,\n    xsrfCookieName: \"XSRF-TOKEN\",\n    xsrfHeaderName: \"X-XSRF-TOKEN\",\n    maxContentLength: -1,\n    maxBodyLength: -1,\n    validateStatus: function validateStatus(status) {\n        return status >= 200 && status < 300;\n    }\n};\ndefaults.headers = {\n    common: {\n        \"Accept\": \"application/json, text/plain, */*\"\n    }\n};\nutils.forEach([\n    \"delete\",\n    \"get\",\n    \"head\"\n], function forEachMethodNoData(method) {\n    defaults.headers[method] = {};\n});\nutils.forEach([\n    \"post\",\n    \"put\",\n    \"patch\"\n], function forEachMethodWithData(method) {\n    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);\n});\nmodule.exports = defaults;\n\n},{\"process\":\"1iSuU\",\"./utils\":\"hnkFL\",\"./helpers/normalizeHeaderName\":\"9vUXx\",\"./core/enhanceError\":\"cJwKH\",\"./adapters/xhr\":\"bSZyW\",\"./adapters/http\":\"bSZyW\"}],\"9vUXx\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"../utils\");\nmodule.exports = function normalizeHeaderName(headers, normalizedName) {\n    utils.forEach(headers, function processHeader(value, name) {\n        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {\n            headers[normalizedName] = value;\n            delete headers[name];\n        }\n    });\n};\n\n},{\"../utils\":\"hnkFL\"}],\"cJwKH\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Update an Error with the specified config, error code, and response.\n *\n * @param {Error} error The error to update.\n * @param {Object} config The config.\n * @param {string} [code] The error code (for example, 'ECONNABORTED').\n * @param {Object} [request] The request.\n * @param {Object} [response] The response.\n * @returns {Error} The error.\n */ module.exports = function enhanceError(error, config, code, request, response) {\n    error.config = config;\n    if (code) error.code = code;\n    error.request = request;\n    error.response = response;\n    error.isAxiosError = true;\n    error.toJSON = function toJSON() {\n        return {\n            // Standard\n            message: this.message,\n            name: this.name,\n            // Microsoft\n            description: this.description,\n            number: this.number,\n            // Mozilla\n            fileName: this.fileName,\n            lineNumber: this.lineNumber,\n            columnNumber: this.columnNumber,\n            stack: this.stack,\n            // Axios\n            config: this.config,\n            code: this.code\n        };\n    };\n    return error;\n};\n\n},{}],\"bSZyW\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar settle = require(\"./../core/settle\");\nvar cookies = require(\"./../helpers/cookies\");\nvar buildURL = require(\"./../helpers/buildURL\");\nvar buildFullPath = require(\"../core/buildFullPath\");\nvar parseHeaders = require(\"./../helpers/parseHeaders\");\nvar isURLSameOrigin = require(\"./../helpers/isURLSameOrigin\");\nvar createError = require(\"../core/createError\");\nmodule.exports = function xhrAdapter(config) {\n    return new Promise(function dispatchXhrRequest(resolve, reject) {\n        var requestData = config.data;\n        var requestHeaders = config.headers;\n        var responseType = config.responseType;\n        if (utils.isFormData(requestData)) delete requestHeaders[\"Content-Type\"]; // Let the browser set it\n        var request = new XMLHttpRequest();\n        // HTTP basic authentication\n        if (config.auth) {\n            var username = config.auth.username || \"\";\n            var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : \"\";\n            requestHeaders.Authorization = \"Basic \" + btoa(username + \":\" + password);\n        }\n        var fullPath = buildFullPath(config.baseURL, config.url);\n        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);\n        // Set the request timeout in MS\n        request.timeout = config.timeout;\n        function onloadend() {\n            if (!request) return;\n            // Prepare the response\n            var responseHeaders = \"getAllResponseHeaders\" in request ? parseHeaders(request.getAllResponseHeaders()) : null;\n            var responseData = !responseType || responseType === \"text\" || responseType === \"json\" ? request.responseText : request.response;\n            var response = {\n                data: responseData,\n                status: request.status,\n                statusText: request.statusText,\n                headers: responseHeaders,\n                config: config,\n                request: request\n            };\n            settle(resolve, reject, response);\n            // Clean up request\n            request = null;\n        }\n        if (\"onloadend\" in request) // Use onloadend if available\n        request.onloadend = onloadend;\n        else // Listen for ready state to emulate onloadend\n        request.onreadystatechange = function handleLoad() {\n            if (!request || request.readyState !== 4) return;\n            // The request errored out and we didn't get a response, this will be\n            // handled by onerror instead\n            // With one exception: request that using file: protocol, most browsers\n            // will return status as 0 even though it's a successful request\n            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf(\"file:\") === 0)) return;\n            // readystate handler is calling before onerror or ontimeout handlers,\n            // so we should call onloadend on the next 'tick'\n            setTimeout(onloadend);\n        };\n        // Handle browser request cancellation (as opposed to a manual cancellation)\n        request.onabort = function handleAbort() {\n            if (!request) return;\n            reject(createError(\"Request aborted\", config, \"ECONNABORTED\", request));\n            // Clean up request\n            request = null;\n        };\n        // Handle low level network errors\n        request.onerror = function handleError() {\n            // Real errors are hidden from us by the browser\n            // onerror should only fire if it's a network error\n            reject(createError(\"Network Error\", config, null, request));\n            // Clean up request\n            request = null;\n        };\n        // Handle timeout\n        request.ontimeout = function handleTimeout() {\n            var timeoutErrorMessage = \"timeout of \" + config.timeout + \"ms exceeded\";\n            if (config.timeoutErrorMessage) timeoutErrorMessage = config.timeoutErrorMessage;\n            reject(createError(timeoutErrorMessage, config, config.transitional && config.transitional.clarifyTimeoutError ? \"ETIMEDOUT\" : \"ECONNABORTED\", request));\n            // Clean up request\n            request = null;\n        };\n        // Add xsrf header\n        // This is only done if running in a standard browser environment.\n        // Specifically not if we're in a web worker, or react-native.\n        if (utils.isStandardBrowserEnv()) {\n            // Add xsrf header\n            var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : undefined;\n            if (xsrfValue) requestHeaders[config.xsrfHeaderName] = xsrfValue;\n        }\n        // Add headers to the request\n        if (\"setRequestHeader\" in request) utils.forEach(requestHeaders, function setRequestHeader(val, key) {\n            if (typeof requestData === \"undefined\" && key.toLowerCase() === \"content-type\") // Remove Content-Type if data is undefined\n            delete requestHeaders[key];\n            else // Otherwise add header to the request\n            request.setRequestHeader(key, val);\n        });\n        // Add withCredentials to request if needed\n        if (!utils.isUndefined(config.withCredentials)) request.withCredentials = !!config.withCredentials;\n        // Add responseType to request if needed\n        if (responseType && responseType !== \"json\") request.responseType = config.responseType;\n        // Handle progress if needed\n        if (typeof config.onDownloadProgress === \"function\") request.addEventListener(\"progress\", config.onDownloadProgress);\n        // Not all browsers support upload events\n        if (typeof config.onUploadProgress === \"function\" && request.upload) request.upload.addEventListener(\"progress\", config.onUploadProgress);\n        if (config.cancelToken) // Handle cancellation\n        config.cancelToken.promise.then(function onCanceled(cancel) {\n            if (!request) return;\n            request.abort();\n            reject(cancel);\n            // Clean up request\n            request = null;\n        });\n        if (!requestData) requestData = null;\n        // Send the request\n        request.send(requestData);\n    });\n};\n\n},{\"./../utils\":\"hnkFL\",\"./../core/settle\":\"41CT5\",\"./../helpers/cookies\":\"jeRHS\",\"./../helpers/buildURL\":\"fy0cx\",\"../core/buildFullPath\":\"8igPT\",\"./../helpers/parseHeaders\":\"gA7yq\",\"./../helpers/isURLSameOrigin\":\"9z18v\",\"../core/createError\":\"k3KqI\"}],\"41CT5\":[function(require,module,exports) {\n\"use strict\";\nvar createError = require(\"./createError\");\n/**\n * Resolve or reject a Promise based on response status.\n *\n * @param {Function} resolve A function that resolves the promise.\n * @param {Function} reject A function that rejects the promise.\n * @param {object} response The response.\n */ module.exports = function settle(resolve, reject, response) {\n    var validateStatus = response.config.validateStatus;\n    if (!response.status || !validateStatus || validateStatus(response.status)) resolve(response);\n    else reject(createError(\"Request failed with status code \" + response.status, response.config, null, response.request, response));\n};\n\n},{\"./createError\":\"k3KqI\"}],\"k3KqI\":[function(require,module,exports) {\n\"use strict\";\nvar enhanceError = require(\"./enhanceError\");\n/**\n * Create an Error with the specified message, config, error code, request and response.\n *\n * @param {string} message The error message.\n * @param {Object} config The config.\n * @param {string} [code] The error code (for example, 'ECONNABORTED').\n * @param {Object} [request] The request.\n * @param {Object} [response] The response.\n * @returns {Error} The created error.\n */ module.exports = function createError(message, config, code, request, response) {\n    var error = new Error(message);\n    return enhanceError(error, config, code, request, response);\n};\n\n},{\"./enhanceError\":\"cJwKH\"}],\"jeRHS\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nmodule.exports = utils.isStandardBrowserEnv() ? // Standard browser envs support document.cookie\nfunction standardBrowserEnv() {\n    return {\n        write: function write(name, value, expires, path, domain, secure) {\n            var cookie = [];\n            cookie.push(name + \"=\" + encodeURIComponent(value));\n            if (utils.isNumber(expires)) cookie.push(\"expires=\" + new Date(expires).toGMTString());\n            if (utils.isString(path)) cookie.push(\"path=\" + path);\n            if (utils.isString(domain)) cookie.push(\"domain=\" + domain);\n            if (secure === true) cookie.push(\"secure\");\n            document.cookie = cookie.join(\"; \");\n        },\n        read: function read(name) {\n            var match = document.cookie.match(new RegExp(\"(^|;\\\\s*)(\" + name + \")=([^;]*)\"));\n            return match ? decodeURIComponent(match[3]) : null;\n        },\n        remove: function remove(name) {\n            this.write(name, \"\", Date.now() - 86400000);\n        }\n    };\n}() : // Non standard browser env (web workers, react-native) lack needed support.\nfunction nonStandardBrowserEnv() {\n    return {\n        write: function write() {},\n        read: function read() {\n            return null;\n        },\n        remove: function remove() {}\n    };\n}();\n\n},{\"./../utils\":\"hnkFL\"}],\"8igPT\":[function(require,module,exports) {\n\"use strict\";\nvar isAbsoluteURL = require(\"../helpers/isAbsoluteURL\");\nvar combineURLs = require(\"../helpers/combineURLs\");\n/**\n * Creates a new URL by combining the baseURL with the requestedURL,\n * only when the requestedURL is not already an absolute URL.\n * If the requestURL is absolute, this function returns the requestedURL untouched.\n *\n * @param {string} baseURL The base URL\n * @param {string} requestedURL Absolute or relative URL to combine\n * @returns {string} The combined full path\n */ module.exports = function buildFullPath(baseURL, requestedURL) {\n    if (baseURL && !isAbsoluteURL(requestedURL)) return combineURLs(baseURL, requestedURL);\n    return requestedURL;\n};\n\n},{\"../helpers/isAbsoluteURL\":\"h9csh\",\"../helpers/combineURLs\":\"lUxsE\"}],\"h9csh\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Determines whether the specified URL is absolute\n *\n * @param {string} url The URL to test\n * @returns {boolean} True if the specified URL is absolute, otherwise false\n */ module.exports = function isAbsoluteURL(url) {\n    // A URL is considered absolute if it begins with \"<scheme>://\" or \"//\" (protocol-relative URL).\n    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed\n    // by any combination of letters, digits, plus, period, or hyphen.\n    return /^([a-z][a-z\\d\\+\\-\\.]*:)?\\/\\//i.test(url);\n};\n\n},{}],\"lUxsE\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Creates a new URL by combining the specified URLs\n *\n * @param {string} baseURL The base URL\n * @param {string} relativeURL The relative URL\n * @returns {string} The combined URL\n */ module.exports = function combineURLs(baseURL, relativeURL) {\n    return relativeURL ? baseURL.replace(/\\/+$/, \"\") + \"/\" + relativeURL.replace(/^\\/+/, \"\") : baseURL;\n};\n\n},{}],\"gA7yq\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\n// Headers whose duplicates are ignored by node\n// c.f. https://nodejs.org/api/http.html#http_message_headers\nvar ignoreDuplicateOf = [\n    \"age\",\n    \"authorization\",\n    \"content-length\",\n    \"content-type\",\n    \"etag\",\n    \"expires\",\n    \"from\",\n    \"host\",\n    \"if-modified-since\",\n    \"if-unmodified-since\",\n    \"last-modified\",\n    \"location\",\n    \"max-forwards\",\n    \"proxy-authorization\",\n    \"referer\",\n    \"retry-after\",\n    \"user-agent\"\n];\n/**\n * Parse headers into an object\n *\n * ```\n * Date: Wed, 27 Aug 2014 08:58:49 GMT\n * Content-Type: application/json\n * Connection: keep-alive\n * Transfer-Encoding: chunked\n * ```\n *\n * @param {String} headers Headers needing to be parsed\n * @returns {Object} Headers parsed into an object\n */ module.exports = function parseHeaders(headers) {\n    var parsed = {};\n    var key;\n    var val;\n    var i;\n    if (!headers) return parsed;\n    utils.forEach(headers.split(\"\\n\"), function parser(line) {\n        i = line.indexOf(\":\");\n        key = utils.trim(line.substr(0, i)).toLowerCase();\n        val = utils.trim(line.substr(i + 1));\n        if (key) {\n            if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) return;\n            if (key === \"set-cookie\") parsed[key] = (parsed[key] ? parsed[key] : []).concat([\n                val\n            ]);\n            else parsed[key] = parsed[key] ? parsed[key] + \", \" + val : val;\n        }\n    });\n    return parsed;\n};\n\n},{\"./../utils\":\"hnkFL\"}],\"9z18v\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nmodule.exports = utils.isStandardBrowserEnv() ? // Standard browser envs have full support of the APIs needed to test\n// whether the request URL is of the same origin as current location.\nfunction standardBrowserEnv() {\n    var msie = /(msie|trident)/i.test(navigator.userAgent);\n    var urlParsingNode = document.createElement(\"a\");\n    var originURL;\n    /**\n    * Parse a URL to discover it's components\n    *\n    * @param {String} url The URL to be parsed\n    * @returns {Object}\n    */ function resolveURL(url) {\n        var href = url;\n        if (msie) {\n            // IE needs attribute set twice to normalize properties\n            urlParsingNode.setAttribute(\"href\", href);\n            href = urlParsingNode.href;\n        }\n        urlParsingNode.setAttribute(\"href\", href);\n        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils\n        return {\n            href: urlParsingNode.href,\n            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, \"\") : \"\",\n            host: urlParsingNode.host,\n            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\\?/, \"\") : \"\",\n            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, \"\") : \"\",\n            hostname: urlParsingNode.hostname,\n            port: urlParsingNode.port,\n            pathname: urlParsingNode.pathname.charAt(0) === \"/\" ? urlParsingNode.pathname : \"/\" + urlParsingNode.pathname\n        };\n    }\n    originURL = resolveURL(window.location.href);\n    /**\n    * Determine if a URL shares the same origin as the current location\n    *\n    * @param {String} requestURL The URL to test\n    * @returns {boolean} True if URL shares the same origin, otherwise false\n    */ return function isURLSameOrigin(requestURL) {\n        var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;\n        return parsed.protocol === originURL.protocol && parsed.host === originURL.host;\n    };\n}() : // Non standard browser envs (web workers, react-native) lack needed support.\nfunction nonStandardBrowserEnv() {\n    return function isURLSameOrigin() {\n        return true;\n    };\n}();\n\n},{\"./../utils\":\"hnkFL\"}],\"a2h6U\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function isCancel(value) {\n    return !!(value && value.__CANCEL__);\n};\n\n},{}],\"cpLHT\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"../utils\");\n/**\n * Config-specific merge-function which creates a new config-object\n * by merging two configuration objects together.\n *\n * @param {Object} config1\n * @param {Object} config2\n * @returns {Object} New object resulting from merging config2 to config1\n */ module.exports = function mergeConfig(config1, config2) {\n    // eslint-disable-next-line no-param-reassign\n    config2 = config2 || {};\n    var config = {};\n    var valueFromConfig2Keys = [\n        \"url\",\n        \"method\",\n        \"data\"\n    ];\n    var mergeDeepPropertiesKeys = [\n        \"headers\",\n        \"auth\",\n        \"proxy\",\n        \"params\"\n    ];\n    var defaultToConfig2Keys = [\n        \"baseURL\",\n        \"transformRequest\",\n        \"transformResponse\",\n        \"paramsSerializer\",\n        \"timeout\",\n        \"timeoutMessage\",\n        \"withCredentials\",\n        \"adapter\",\n        \"responseType\",\n        \"xsrfCookieName\",\n        \"xsrfHeaderName\",\n        \"onUploadProgress\",\n        \"onDownloadProgress\",\n        \"decompress\",\n        \"maxContentLength\",\n        \"maxBodyLength\",\n        \"maxRedirects\",\n        \"transport\",\n        \"httpAgent\",\n        \"httpsAgent\",\n        \"cancelToken\",\n        \"socketPath\",\n        \"responseEncoding\"\n    ];\n    var directMergeKeys = [\n        \"validateStatus\"\n    ];\n    function getMergedValue(target, source) {\n        if (utils.isPlainObject(target) && utils.isPlainObject(source)) return utils.merge(target, source);\n        else if (utils.isPlainObject(source)) return utils.merge({}, source);\n        else if (utils.isArray(source)) return source.slice();\n        return source;\n    }\n    function mergeDeepProperties(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(config1[prop], config2[prop]);\n        else if (!utils.isUndefined(config1[prop])) config[prop] = getMergedValue(undefined, config1[prop]);\n    }\n    utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(undefined, config2[prop]);\n    });\n    utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);\n    utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(undefined, config2[prop]);\n        else if (!utils.isUndefined(config1[prop])) config[prop] = getMergedValue(undefined, config1[prop]);\n    });\n    utils.forEach(directMergeKeys, function merge(prop) {\n        if (prop in config2) config[prop] = getMergedValue(config1[prop], config2[prop]);\n        else if (prop in config1) config[prop] = getMergedValue(undefined, config1[prop]);\n    });\n    var axiosKeys = valueFromConfig2Keys.concat(mergeDeepPropertiesKeys).concat(defaultToConfig2Keys).concat(directMergeKeys);\n    var otherKeys = Object.keys(config1).concat(Object.keys(config2)).filter(function filterAxiosKeys(key) {\n        return axiosKeys.indexOf(key) === -1;\n    });\n    utils.forEach(otherKeys, mergeDeepProperties);\n    return config;\n};\n\n},{\"../utils\":\"hnkFL\"}],\"2WhhG\":[function(require,module,exports) {\n\"use strict\";\nvar pkg = require(\"./../../package.json\");\nvar validators = {};\n// eslint-disable-next-line func-names\n[\n    \"object\",\n    \"boolean\",\n    \"number\",\n    \"function\",\n    \"string\",\n    \"symbol\"\n].forEach(function(type, i) {\n    validators[type] = function validator(thing) {\n        return typeof thing === type || \"a\" + (i < 1 ? \"n \" : \" \") + type;\n    };\n});\nvar deprecatedWarnings = {};\nvar currentVerArr = pkg.version.split(\".\");\n/**\n * Compare package versions\n * @param {string} version\n * @param {string?} thanVersion\n * @returns {boolean}\n */ function isOlderVersion(version, thanVersion) {\n    var pkgVersionArr = thanVersion ? thanVersion.split(\".\") : currentVerArr;\n    var destVer = version.split(\".\");\n    for(var i = 0; i < 3; i++){\n        if (pkgVersionArr[i] > destVer[i]) return true;\n        else if (pkgVersionArr[i] < destVer[i]) return false;\n    }\n    return false;\n}\n/**\n * Transitional option validator\n * @param {function|boolean?} validator\n * @param {string?} version\n * @param {string} message\n * @returns {function}\n */ validators.transitional = function transitional(validator, version, message) {\n    var isDeprecated = version && isOlderVersion(version);\n    function formatMessage(opt, desc) {\n        return \"[Axios v\" + pkg.version + \"] Transitional option '\" + opt + \"'\" + desc + (message ? \". \" + message : \"\");\n    }\n    // eslint-disable-next-line func-names\n    return function(value, opt, opts) {\n        if (validator === false) throw new Error(formatMessage(opt, \" has been removed in \" + version));\n        if (isDeprecated && !deprecatedWarnings[opt]) {\n            deprecatedWarnings[opt] = true;\n            // eslint-disable-next-line no-console\n            console.warn(formatMessage(opt, \" has been deprecated since v\" + version + \" and will be removed in the near future\"));\n        }\n        return validator ? validator(value, opt, opts) : true;\n    };\n};\n/**\n * Assert object's properties type\n * @param {object} options\n * @param {object} schema\n * @param {boolean?} allowUnknown\n */ function assertOptions(options, schema, allowUnknown) {\n    if (typeof options !== \"object\") throw new TypeError(\"options must be an object\");\n    var keys = Object.keys(options);\n    var i = keys.length;\n    while(i-- > 0){\n        var opt = keys[i];\n        var validator = schema[opt];\n        if (validator) {\n            var value = options[opt];\n            var result = value === undefined || validator(value, opt, options);\n            if (result !== true) throw new TypeError(\"option \" + opt + \" must be \" + result);\n            continue;\n        }\n        if (allowUnknown !== true) throw Error(\"Unknown option \" + opt);\n    }\n}\nmodule.exports = {\n    isOlderVersion: isOlderVersion,\n    assertOptions: assertOptions,\n    validators: validators\n};\n\n},{\"./../../package.json\":\"eeUxD\"}],\"eeUxD\":[function(require,module,exports) {\nmodule.exports = JSON.parse('{\"name\":\"axios\",\"version\":\"0.21.4\",\"description\":\"Promise based HTTP client for the browser and node.js\",\"main\":\"index.js\",\"scripts\":{\"test\":\"grunt test\",\"start\":\"node ./sandbox/server.js\",\"build\":\"NODE_ENV=production grunt build\",\"preversion\":\"npm test\",\"version\":\"npm run build && grunt version && git add -A dist && git add CHANGELOG.md bower.json package.json\",\"postversion\":\"git push && git push --tags\",\"examples\":\"node ./examples/server.js\",\"coveralls\":\"cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js\",\"fix\":\"eslint --fix lib/**/*.js\"},\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/axios/axios.git\"},\"keywords\":[\"xhr\",\"http\",\"ajax\",\"promise\",\"node\"],\"author\":\"Matt Zabriskie\",\"license\":\"MIT\",\"bugs\":{\"url\":\"https://github.com/axios/axios/issues\"},\"homepage\":\"https://axios-http.com\",\"devDependencies\":{\"coveralls\":\"^3.0.0\",\"es6-promise\":\"^4.2.4\",\"grunt\":\"^1.3.0\",\"grunt-banner\":\"^0.6.0\",\"grunt-cli\":\"^1.2.0\",\"grunt-contrib-clean\":\"^1.1.0\",\"grunt-contrib-watch\":\"^1.0.0\",\"grunt-eslint\":\"^23.0.0\",\"grunt-karma\":\"^4.0.0\",\"grunt-mocha-test\":\"^0.13.3\",\"grunt-ts\":\"^6.0.0-beta.19\",\"grunt-webpack\":\"^4.0.2\",\"istanbul-instrumenter-loader\":\"^1.0.0\",\"jasmine-core\":\"^2.4.1\",\"karma\":\"^6.3.2\",\"karma-chrome-launcher\":\"^3.1.0\",\"karma-firefox-launcher\":\"^2.1.0\",\"karma-jasmine\":\"^1.1.1\",\"karma-jasmine-ajax\":\"^0.1.13\",\"karma-safari-launcher\":\"^1.0.0\",\"karma-sauce-launcher\":\"^4.3.6\",\"karma-sinon\":\"^1.0.5\",\"karma-sourcemap-loader\":\"^0.3.8\",\"karma-webpack\":\"^4.0.2\",\"load-grunt-tasks\":\"^3.5.2\",\"minimist\":\"^1.2.0\",\"mocha\":\"^8.2.1\",\"sinon\":\"^4.5.0\",\"terser-webpack-plugin\":\"^4.2.3\",\"typescript\":\"^4.0.5\",\"url-search-params\":\"^0.10.0\",\"webpack\":\"^4.44.2\",\"webpack-dev-server\":\"^3.11.0\"},\"browser\":{\"./lib/adapters/http.js\":\"./lib/adapters/xhr.js\"},\"jsdelivr\":\"dist/axios.min.js\",\"unpkg\":\"dist/axios.min.js\",\"typings\":\"./index.d.ts\",\"dependencies\":{\"follow-redirects\":\"^1.14.0\"},\"bundlesize\":[{\"path\":\"./dist/axios.min.js\",\"threshold\":\"5kB\"}]}');\n\n},{}],\"gnU4h\":[function(require,module,exports) {\n\"use strict\";\n/**\n * A `Cancel` is an object that is thrown when an operation is canceled.\n *\n * @class\n * @param {string=} message The message.\n */ function Cancel(message) {\n    this.message = message;\n}\nCancel.prototype.toString = function toString() {\n    return \"Cancel\" + (this.message ? \": \" + this.message : \"\");\n};\nCancel.prototype.__CANCEL__ = true;\nmodule.exports = Cancel;\n\n},{}],\"eIXu8\":[function(require,module,exports) {\n\"use strict\";\nvar Cancel = require(\"./Cancel\");\n/**\n * A `CancelToken` is an object that can be used to request cancellation of an operation.\n *\n * @class\n * @param {Function} executor The executor function.\n */ function CancelToken(executor) {\n    if (typeof executor !== \"function\") throw new TypeError(\"executor must be a function.\");\n    var resolvePromise;\n    this.promise = new Promise(function promiseExecutor(resolve) {\n        resolvePromise = resolve;\n    });\n    var token = this;\n    executor(function cancel(message) {\n        if (token.reason) // Cancellation has already been requested\n        return;\n        token.reason = new Cancel(message);\n        resolvePromise(token.reason);\n    });\n}\n/**\n * Throws a `Cancel` if cancellation has been requested.\n */ CancelToken.prototype.throwIfRequested = function throwIfRequested() {\n    if (this.reason) throw this.reason;\n};\n/**\n * Returns an object that contains a new `CancelToken` and a function that, when called,\n * cancels the `CancelToken`.\n */ CancelToken.source = function source() {\n    var cancel;\n    var token = new CancelToken(function executor(c) {\n        cancel = c;\n    });\n    return {\n        token: token,\n        cancel: cancel\n    };\n};\nmodule.exports = CancelToken;\n\n},{\"./Cancel\":\"gnU4h\"}],\"1nXwb\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Syntactic sugar for invoking a function and expanding an array for arguments.\n *\n * Common use case would be to use `Function.prototype.apply`.\n *\n *  ```js\n *  function f(x, y, z) {}\n *  var args = [1, 2, 3];\n *  f.apply(null, args);\n *  ```\n *\n * With `spread` this example can be re-written.\n *\n *  ```js\n *  spread(function(x, y, z) {})([1, 2, 3]);\n *  ```\n *\n * @param {Function} callback\n * @returns {Function}\n */ module.exports = function spread(callback) {\n    return function wrap(arr) {\n        return callback.apply(null, arr);\n    };\n};\n\n},{}],\"iFKJj\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Determines whether the payload is an error thrown by Axios\n *\n * @param {*} payload The value to test\n * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false\n */ module.exports = function isAxiosError(payload) {\n    return typeof payload === \"object\" && payload.isAxiosError === true;\n};\n\n},{}],\"joKwd\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nfunction safeJsonParse(value) {\n    if (typeof value !== \"string\") throw new Error(`Cannot safe json parse value of type ${typeof value}`);\n    try {\n        return JSON.parse(value);\n    } catch (_a) {\n        return value;\n    }\n}\nexports.safeJsonParse = safeJsonParse;\nfunction safeJsonStringify(value1) {\n    return typeof value1 === \"string\" ? value1 : JSON.stringify(value1, (key, value)=>typeof value === \"undefined\" ? null : value);\n}\nexports.safeJsonStringify = safeJsonStringify;\n\n},{}],\"9Then\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isLocalhostUrl = exports.isWsUrl = exports.isHttpUrl = void 0;\nconst HTTP_REGEX = \"^https?:\";\nconst WS_REGEX = \"^wss?:\";\nfunction getUrlProtocol(url) {\n    const matches = url.match(new RegExp(/^\\w+:/, \"gi\"));\n    if (!matches || !matches.length) return;\n    return matches[0];\n}\nfunction matchRegexProtocol(url, regex) {\n    const protocol = getUrlProtocol(url);\n    if (typeof protocol === \"undefined\") return false;\n    return new RegExp(regex).test(protocol);\n}\nfunction isHttpUrl(url) {\n    return matchRegexProtocol(url, HTTP_REGEX);\n}\nexports.isHttpUrl = isHttpUrl;\nfunction isWsUrl(url) {\n    return matchRegexProtocol(url, WS_REGEX);\n}\nexports.isWsUrl = isWsUrl;\nfunction isLocalhostUrl(url) {\n    return new RegExp(\"wss?://localhost(:d{2,5})?\").test(url);\n}\nexports.isLocalhostUrl = isLocalhostUrl;\n\n},{}],\"aknY6\":[function(require,module,exports) {\n\"use strict\";\nvar global = arguments[3];\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.WsConnection = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst safe_json_utils_1 = require(\"safe-json-utils\");\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst url_1 = require(\"./url\");\nconst WS = typeof global.WebSocket !== \"undefined\" ? global.WebSocket : require(\"ws\");\nclass WsConnection {\n    constructor(url){\n        this.url = url;\n        this.events = new events_1.EventEmitter();\n        this.registering = false;\n        if (!url_1.isWsUrl(url)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${url}`);\n        this.url = url;\n    }\n    get connected() {\n        return typeof this.socket !== \"undefined\";\n    }\n    get connecting() {\n        return this.registering;\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    open(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.socket = yield this.register(url);\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.socket === \"undefined\") throw new Error(\"Already disconnected\");\n            this.socket.close();\n            this.onClose();\n        });\n    }\n    send(payload, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.socket === \"undefined\") this.socket = yield this.register();\n            this.socket.send(safe_json_utils_1.safeJsonStringify(payload));\n        });\n    }\n    register(url = this.url) {\n        if (!url_1.isWsUrl(url)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${url}`);\n        if (this.registering) return new Promise((resolve, reject)=>{\n            this.events.once(\"open\", ()=>{\n                if (typeof this.socket === \"undefined\") return reject(new Error(\"WebSocket connection is missing or invalid\"));\n                resolve(this.socket);\n            });\n        });\n        this.url = url;\n        this.registering = true;\n        return new Promise((resolve, reject)=>{\n            const opts = !utils_1.isReactNative() ? {\n                rejectUnauthorized: !url_1.isLocalhostUrl(url)\n            } : undefined;\n            const socket = new WS(url, [], opts);\n            socket.onopen = ()=>{\n                this.onOpen(socket);\n                resolve(socket);\n            };\n            socket.onerror = (event)=>{\n                this.events.emit(\"error\", event);\n                reject(event);\n            };\n        });\n    }\n    onOpen(socket) {\n        socket.onmessage = (event)=>this.onPayload(event);\n        socket.onclose = ()=>this.onClose();\n        this.socket = socket;\n        this.registering = false;\n        this.events.emit(\"open\");\n    }\n    onClose() {\n        this.socket = undefined;\n        this.events.emit(\"close\");\n    }\n    onPayload(e) {\n        if (typeof e.data === \"undefined\") return;\n        const payload = typeof e.data === \"string\" ? safe_json_utils_1.safeJsonParse(e.data) : e.data;\n        this.events.emit(\"payload\", payload);\n    }\n}\nexports.WsConnection = WsConnection;\n\n},{\"tslib\":\"hdsRu\",\"events\":\"eDevp\",\"safe-json-utils\":\"joKwd\",\"@json-rpc-tools/utils\":\"h6aFv\",\"./url\":\"9Then\",\"ws\":\"10vDB\"}],\"10vDB\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function() {\n    throw new Error(\"ws does not work in the browser. Browser clients must use the native WebSocket object\");\n};\n\n},{}],\"r3kfE\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"WalletNameFlag\", ()=>(0, _walletNameFlag.WalletNameFlag));\nvar _walletNameFlag = require(\"src/background/Wallet/model/WalletNameFlag\");\n\n},{\"src/background/Wallet/model/WalletNameFlag\":\"1ugPP\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}],\"1ugPP\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"WalletNameFlag\", ()=>WalletNameFlag);\nlet WalletNameFlag;\n(function(WalletNameFlag1) {\n    WalletNameFlag1[WalletNameFlag1[\"isMetaMask\"] = 0] = \"isMetaMask\";\n})(WalletNameFlag || (WalletNameFlag = {}));\n\n},{\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}],\"deOoS\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"Connection\", ()=>Connection);\nvar _events = require(\"events\");\nvar _eventsDefault = parcelHelpers.interopDefault(_events);\nvar _utils = require(\"@json-rpc-tools/utils\");\nclass Connection extends (0, _eventsDefault.default) {\n    events = new (0, _eventsDefault.default)();\n    connected = false;\n    connecting = false;\n    constructor(broadcastChannel){\n        super();\n        this.broadcastChannel = broadcastChannel;\n        this.broadcastChannel.addEventListener(\"message\", (event)=>{\n            if (event.data?.type === \"ethereumEvent\") this.emit(\"ethereumEvent\", {\n                event: event.data.event,\n                value: event.data.value\n            });\n            else this.emit(\"payload\", event.data);\n        });\n    }\n    async open() {\n        return Promise.resolve().then(()=>{\n            this.connected = true;\n        });\n    }\n    async close() {\n        return Promise.resolve();\n    }\n    send(payload) {\n        this.broadcastChannel.postMessage(payload);\n        return this.getPromise(payload.id);\n    }\n    getPromise(id) {\n        return new Promise((resolve, reject)=>{\n            const handler = (event)=>{\n                const { data  } = event;\n                if (data.id === id && (0, _utils.isJsonRpcResponse)(data)) {\n                    if ((0, _utils.isJsonRpcError)(data)) reject(data.error);\n                    else resolve(data.result);\n                    this.broadcastChannel.removeEventListener(\"message\", handler);\n                }\n            };\n            this.broadcastChannel.addEventListener(\"message\", handler);\n        });\n    }\n}\n\n},{\"events\":\"eDevp\",\"@json-rpc-tools/utils\":\"h6aFv\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}]},[\"qFYh4\"], \"qFYh4\", \"parcelRequire7f4b\")\n\n";

},{}]},["iRTcc"], "iRTcc", "parcelRequire7f4b")

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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SUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQSxBQUFDLElBQUssQ0FBQSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxFQUFFO3dCQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQUMsU0FBUztxQkFBRTtvQkFDNUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFLLENBQUEsQ0FBQyxDQUFDLElBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDLENBQUEsQUFBQyxFQUFFO3dCQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUFDLE1BQU07cUJBQUU7b0JBQ3RGLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUFDLE1BQU07cUJBQUU7b0JBQ3JFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUFDLE1BQU07cUJBQUU7b0JBQ25FLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FB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eUNBQUEsRUFBNEMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUEsQ0FBRTtTQUN6RSxDQUFDO0tBRUw7SUFDRCxPQUFPO1FBQUUsS0FBSyxFQUFFLElBQUk7S0FBRSxDQUFDO0NBQ3hCO0FBMUJELE9BQUEsQ0FBQSxvQkFBQSxHQUFBLG9CQUFBLENBMEJDOzs7QSxZLEM7QSxNLEMsYyxDLE8sRSxZLEU7SSxLLEUsSTtDLEMsQztBLE8sQyxRLEcsSyxDLEM7QSxNLE8sRyxPLEMsTyxDLEE7QUU5REQsTUFBQSxhQUFBLEdBQUEsT0FBQSxDQUFBLHVCQUFBLENBQUEsQUFBK0M7QUFHbEMsT0FBQSxDQUFBLFFBQVEsR0FBRyxhQUFBLENBQUEsTUFBTSxDQUFDO0FBRS9CLE9BQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxDQUFBLHVCQUFBLENBQUEsRUFBQSxPQUFBLENBQUEsQ0FBc0M7OztBLFksQztBLEksZSxHLEEsSSxJLEksQyxlLEksQyxNLEMsTSxHLFMsQyxFLEMsRSxDLEUsRSxFO0ksSSxFLEssUyxFLEUsRyxDLEM7SSxNLEMsYyxDLEMsRSxFLEU7USxVLEUsSTtRLEcsRSxXO1ksTyxDLEMsQyxDLEM7UztLLEMsQztDLEcsUyxDLEUsQyxFLEMsRSxFLEU7SSxJLEUsSyxTLEUsRSxHLEMsQztJLEMsQyxFLEMsRyxDLEMsQyxDLEM7QyxBLEMsQSxBO0EsSSxZLEcsQSxJLEksSSxDLFksSSxTLEMsRSxPLEU7SSxJLEksQyxJLEMsQyxJLEMsSyxTLEksQyxPLEMsYyxDLEMsQyxFLGUsQyxPLEUsQyxFLEMsQyxDO0MsQTtBLE0sQyxjLEMsTyxFLFksRTtJLEssRSxJO0MsQyxDO0FFTHRDLFlBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxDQUFBLEVBQUEsT0FBQSxDQUFBLENBQXlCO0FBQ3pCLFlBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxDQUFBLEVBQUEsT0FBQSxDQUFBLENBQXNCOzs7QSxZLEM7O0EsTSxDLGMsQyxPLEUsWSxFO0ksSyxFLEk7QyxDLEM7QSxPLEMsd0IsRyxPLEMsZSxHLE8sQyxlLEcs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QUF0QjtRQUNFLEtBQUssRUFBRSxDQUFDO0tBQ1Q7Q0FJRjtBQVRELE9BQUEsQ0FBQSxrQkFBQSxHQUFBLGtCQUFBLENBU0M7QUFFRCxNQUFzQixvQkFBcUIsU0FBUSxNQUFBLENBQUEsT0FBTztJQUN4RCxhQUFBO1FBQ0UsS0FBSyxFQUFFLENBQUM7S0FDVDtDQWlCRjtBQXBCRCxPQUFBLENBQUEsb0JBQUEsR0FBQSxvQkFBQSxDQW9CQztBQUVELE1BQXNCLGdCQUFpQixTQUFRLG9CQUFvQjtJQUdqRSxZQUFZLFVBQXVDLENBQW5EO1FBQ0UsS0FBSyxFQUFFLENBQUM7S0FDVDtDQWFGO0FBbEJELE9BQUEsQ0FBQSxnQkFBQSxHQUFBLGdCQUFBLENBa0JDOzs7QSxZLEM7QSxNLEMsYyxDLE8sRSxZLEU7SSxLLEUsSTtDLEMsQzs7O0EsWSxDO0EsTSxDLGMsQyxPLEUsWSxFO0ksSyxFLEk7QyxDLEM7QSxPLEMscUIsRyxLLEMsQztBSXJERCxNQUFBLFVBQUEsR0FBQSxPQUFBLENBQUEsWUFBQSxDQUFBLEFBQW9FO0FBZ0JwRSxNQUFzQixxQkFBc0IsU0FBUSxVQUFBLENBQUEsb0JBQW9CO0lBS3RFLFlBQW1CLE1BQWtDLENBQXJEO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFEUyxJQUFBLENBQUEsTUFBTSxHQUFOLE1BQU0sQ0FBNEI7S0FFcEQ7Q0FLRjtBQVpELE9BQUEsQ0FBQSxxQkFBQSxHQUFBLHFCQUFBLENBWUM7OztBLFksQztBLE0sQyxjLEMsTyxFLFksRTtJLEssRSxJO0MsQyxDO0EsTyxDLGMsRyxLLEMsQztBRXRCRCxNQUFzQixjQUFjO0lBR2xDLFlBQW1CLE1BQTJCLENBQTlDO1FBQW1CLElBQUEsQ0FBQSxNQUFNLEdBQU4sTUFBTSxDQUFxQjtLQUFJO0NBV25EO0FBZEQsT0FBQSxDQUFBLGNBQUEsR0FBQSxjQUFBLENBY0M7OztBLFksQztBLE0sQyxjLEMsTyxFLFksRTtJLEssRSxJO0MsQyxDOzs7QSxZLEM7QSxNLEMsYyxDLE8sRSxZLEU7SSxLLEUsSTtDLEMsQztBLE8sQyxpQixHLEssQyxDO0FJSEQsTUFBc0IsaUJBQWlCO0lBQ3JDLFlBQW1CLE9BQXlCLENBQTVDO1FBQW1CLElBQUEsQ0FBQSxPQUFPLEdBQVAsT0FBTyxDQUFrQjtLQUFJO0NBSWpEO0FBTEQsT0FBQSxDQUFBLGlCQUFBLEdBQUEsaUJBQUEsQ0FLQzs7O0EsWSxDO0EsTSxDLGMsQyxPLEUsWSxFO0ksSyxFLEk7QyxDLEM7QSxPLEMsMEIsRyxPLEMsYyxHLE8sQyxlLEcsTyxDLGlCLEcsTyxDLGdCLEcsTyxDLGdCLEcsSyxDLEM7QUViRCxTQUFnQixnQkFBZ0IsQ0FBQyxPQUFZLEVBQTdDO0lBQ0UsT0FBTyxJQUFJLElBQUksT0FBTyxJQUFJLFNBQVMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUM7Q0FDN0U7QUFGRCxPQUFBLENBQUEsZ0JBQUEsR0FBQSxnQkFBQSxDQUVDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQVUsT0FBdUIsRUFBakU7SUFDRSxPQUFPLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLFFBQVEsSUFBSSxPQUFPLENBQUM7Q0FDekQ7QUFGRCxPQUFBLENBQUEsZ0JBQUEsR0FBQSxnQkFBQSxDQUVDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQVUsT0FBdUIsRUFBbEU7SUFDRSxPQUFPLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFLLENBQUEsZUFBZSxDQUFDLE9BQU8sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQSxBQUFDLENBQUM7Q0FDM0Y7QUFGRCxPQUFBLENBQUEsaUJBQUEsR0FBQSxpQkFBQSxDQUVDO0FBRUQsU0FBZ0IsZUFBZSxDQUFVLE9BQXVCLEVBQWhFO0lBQ0UsT0FBTyxRQUFRLElBQUksT0FBTyxDQUFDO0NBQzVCO0FBRkQsT0FBQSxDQUFBLGVBQUEsR0FBQSxlQUFBLENBRUM7QUFFRCxTQUFnQixjQUFjLENBQUMsT0FBdUIsRUFBdEQ7SUFDRSxPQUFPLE9BQU8sSUFBSSxPQUFPLENBQUM7Q0FDM0I7QUFGRCxPQUFBLENBQUEsY0FBQSxHQUFBLGNBQUEsQ0FFQztBQUVELFNBQWdCLDBCQUEwQixDQUN4QyxVQUE2QixFQUQvQjtJQUdFLE9BQU8sT0FBTyxJQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQztDQUM1RDtBQUpELE9BQUEsQ0FBQSwwQkFBQSxHQUFBLDBCQUFBLENBSUM7OztBQ2xDRCxNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDIiwic291cmNlcyI6WyJzcmMvY29udGVudC1zY3JpcHQvaW5kZXgudHMiLCJub2RlX21vZHVsZXMvbmFub2lkL2luZGV4LmJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvQHBhcmNlbC90cmFuc2Zvcm1lci1qcy9zcmMvZXNtb2R1bGUtaGVscGVycy5qcyIsIm5vZGVfbW9kdWxlcy93ZWJleHRlbnNpb24tcG9seWZpbGwvZGlzdC9icm93c2VyLXBvbHlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL2luZGV4LnRzIiwibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvY29uc3RhbnRzLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvY29uc3RhbnRzLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9lcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL2Vycm9yLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9lbnYuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL3NyYy9lbnYudHMiLCJub2RlX21vZHVsZXMvQHBlZHJvdWlkL2Vudmlyb25tZW50L2Rpc3QvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BwZWRyb3VpZC9lbnZpcm9ubWVudC9zcmMvaW5kZXgudHMiLCJub2RlX21vZHVsZXMvQHBlZHJvdWlkL2Vudmlyb25tZW50L2Rpc3QvY2pzL2NyeXB0by5qcyIsIm5vZGVfbW9kdWxlcy9AcGVkcm91aWQvZW52aXJvbm1lbnQvc3JjL2NyeXB0by50cyIsIm5vZGVfbW9kdWxlcy9AcGVkcm91aWQvZW52aXJvbm1lbnQvZGlzdC9janMvZW52LmpzIiwibm9kZV9tb2R1bGVzL0BwZWRyb3VpZC9lbnZpcm9ubWVudC9zcmMvZW52LnRzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvZm9ybWF0LmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvZm9ybWF0LnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9yb3V0aW5nLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvcm91dGluZy50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL3NyYy90eXBlcy50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9pbmRleC50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvYmxvY2tjaGFpbi5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL2Jsb2NrY2hhaW4udHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL2Rpc3QvY2pzL21pc2MuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9taXNjLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9wcm92aWRlci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL3Byb3ZpZGVyLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9qc29ucnBjLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9zcmMvanNvbnJwYy50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvbXVsdGkuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9tdWx0aS50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvcm91dGVyLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9zcmMvcm91dGVyLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9zY2hlbWEuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9zY2hlbWEudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL2Rpc3QvY2pzL3ZhbGlkYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL3ZhbGlkYXRvci50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvdmFsaWRhdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL3ZhbGlkYXRvcnMudHMiLCJub2RlX21vZHVsZXMvQHBhcmNlbC9ydW50aW1lLWpzL2xpYi9idW5kbGVzL3J1bnRpbWUtNjc2YTE2NTc2YTIwNzdkMC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBuYW5vaWQgfSBmcm9tICduYW5vaWQnO1xuaW1wb3J0IGJyb3dzZXIgZnJvbSAnd2ViZXh0ZW5zaW9uLXBvbHlmaWxsJztcbmltcG9ydCB7IGlzSnNvblJwY1JlcXVlc3QsIGlzSnNvblJwY1Jlc3BvbnNlIH0gZnJvbSAnQGpzb24tcnBjLXRvb2xzL3V0aWxzJztcbi8vIEB0cy1pZ25vcmUgcGFyY2VsIHN5bnRheCBmb3IgaW5saW5pbmc6IGh0dHBzOi8vcGFyY2VsanMub3JnL2ZlYXR1cmVzL2J1bmRsZS1pbmxpbmluZy8jaW5saW5pbmctYS1idW5kbGUtYXMtdGV4dFxuaW1wb3J0IGluUGFnZUNvbnRlbnQgZnJvbSAnYnVuZGxlLXRleHQ6Li9pbi1wYWdlJztcblxuY29uc3QgaWQgPSBuYW5vaWQoKTtcblxuY29uc3QgYnJvYWRjYXN0Q2hhbm5lbCA9IG5ldyBCcm9hZGNhc3RDaGFubmVsKGlkKTtcblxuY29uc3QgcG9ydCA9IGJyb3dzZXIucnVudGltZS5jb25uZWN0KHtcbiAgbmFtZTogYCR7YnJvd3Nlci5ydW50aW1lLmlkfS9ldGhlcmV1bWAsXG59KTtcblxucG9ydC5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1zZykgPT4ge1xuICBpZiAoaXNKc29uUnBjUmVzcG9uc2UobXNnKSkge1xuICAgIGJyb2FkY2FzdENoYW5uZWwucG9zdE1lc3NhZ2UobXNnKTtcbiAgfSBlbHNlIGlmIChtc2cudHlwZSA9PT0gJ2V0aGVyZXVtRXZlbnQnKSB7XG4gICAgYnJvYWRjYXN0Q2hhbm5lbC5wb3N0TWVzc2FnZShtc2cpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdpZ25vcmVkIG1lc3NhZ2UnKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gIH1cbn0pO1xuXG5icm9hZGNhc3RDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgY29uc3QgeyBkYXRhIH0gPSBldmVudDtcbiAgaWYgKGlzSnNvblJwY1JlcXVlc3QoZGF0YSkpIHtcbiAgICBwb3J0LnBvc3RNZXNzYWdlKGRhdGEpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdub3QgYSBKc29uUnBjUmVxdWVzdCcpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgfVxufSk7XG5cbi8vIEluc2VydCBzY3JpcHQgd2l0aCBldGhlcmV1bSBwcm92aWRlciBfYWZ0ZXJfIGNyZWF0aW5nIGEgQnJvYWRjYXN0Q2hhbm5lbFxubGV0IGNvbnRlbnQgPSBgd2luZG93Lm15V2FsbGV0Q2hhbm5lbElkID0gXCIke2lkfVwiOztgO1xuY29udGVudCArPSBpblBhZ2VDb250ZW50O1xuXG5jb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbnNjcmlwdC50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG5zY3JpcHQuZGF0YXNldC53YWxsZXRFeHRlbnNpb24gPSAndHJ1ZSc7XG5cbmNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuY29udGFpbmVyLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4iLCJleHBvcnQgeyB1cmxBbHBoYWJldCB9IGZyb20gJy4vdXJsLWFscGhhYmV0L2luZGV4LmpzJ1xuZXhwb3J0IGxldCByYW5kb20gPSBieXRlcyA9PiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KGJ5dGVzKSlcbmV4cG9ydCBsZXQgY3VzdG9tUmFuZG9tID0gKGFscGhhYmV0LCBkZWZhdWx0U2l6ZSwgZ2V0UmFuZG9tKSA9PiB7XG4gIGxldCBtYXNrID0gKDIgPDwgKE1hdGgubG9nKGFscGhhYmV0Lmxlbmd0aCAtIDEpIC8gTWF0aC5MTjIpKSAtIDFcbiAgbGV0IHN0ZXAgPSAtfigoMS42ICogbWFzayAqIGRlZmF1bHRTaXplKSAvIGFscGhhYmV0Lmxlbmd0aClcbiAgcmV0dXJuIChzaXplID0gZGVmYXVsdFNpemUpID0+IHtcbiAgICBsZXQgaWQgPSAnJ1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBsZXQgYnl0ZXMgPSBnZXRSYW5kb20oc3RlcClcbiAgICAgIGxldCBqID0gc3RlcFxuICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICBpZCArPSBhbHBoYWJldFtieXRlc1tqXSAmIG1hc2tdIHx8ICcnXG4gICAgICAgIGlmIChpZC5sZW5ndGggPT09IHNpemUpIHJldHVybiBpZFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuZXhwb3J0IGxldCBjdXN0b21BbHBoYWJldCA9IChhbHBoYWJldCwgc2l6ZSA9IDIxKSA9PlxuICBjdXN0b21SYW5kb20oYWxwaGFiZXQsIHNpemUsIHJhbmRvbSlcbmV4cG9ydCBsZXQgbmFub2lkID0gKHNpemUgPSAyMSkgPT5cbiAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShzaXplKSkucmVkdWNlKChpZCwgYnl0ZSkgPT4ge1xuICAgIGJ5dGUgJj0gNjNcbiAgICBpZiAoYnl0ZSA8IDM2KSB7XG4gICAgICBpZCArPSBieXRlLnRvU3RyaW5nKDM2KVxuICAgIH0gZWxzZSBpZiAoYnl0ZSA8IDYyKSB7XG4gICAgICBpZCArPSAoYnl0ZSAtIDI2KS50b1N0cmluZygzNikudG9VcHBlckNhc2UoKVxuICAgIH0gZWxzZSBpZiAoYnl0ZSA+IDYyKSB7XG4gICAgICBpZCArPSAnLSdcbiAgICB9IGVsc2Uge1xuICAgICAgaWQgKz0gJ18nXG4gICAgfVxuICAgIHJldHVybiBpZFxuICB9LCAnJylcbiIsImV4cG9ydHMuaW50ZXJvcERlZmF1bHQgPSBmdW5jdGlvbiAoYSkge1xuICByZXR1cm4gYSAmJiBhLl9fZXNNb2R1bGUgPyBhIDoge2RlZmF1bHQ6IGF9O1xufTtcblxuZXhwb3J0cy5kZWZpbmVJbnRlcm9wRmxhZyA9IGZ1bmN0aW9uIChhKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShhLCAnX19lc01vZHVsZScsIHt2YWx1ZTogdHJ1ZX0pO1xufTtcblxuZXhwb3J0cy5leHBvcnRBbGwgPSBmdW5jdGlvbiAoc291cmNlLCBkZXN0KSB7XG4gIE9iamVjdC5rZXlzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKGtleSA9PT0gJ2RlZmF1bHQnIHx8IGtleSA9PT0gJ19fZXNNb2R1bGUnIHx8IGRlc3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkZXN0LCBrZXksIHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZVtrZXldO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIGRlc3Q7XG59O1xuXG5leHBvcnRzLmV4cG9ydCA9IGZ1bmN0aW9uIChkZXN0LCBkZXN0TmFtZSwgZ2V0KSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkZXN0LCBkZXN0TmFtZSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBnZXQsXG4gIH0pO1xufTtcbiIsIi8qIHdlYmV4dGVuc2lvbi1wb2x5ZmlsbCAtIHYwLjEwLjAgLSBGcmkgQXVnIDEyIDIwMjIgMTk6NDI6NDQgKi9cbi8qIC0qLSBNb2RlOiBpbmRlbnQtdGFicy1tb2RlOiBuaWw7IGpzLWluZGVudC1sZXZlbDogMiAtKi0gKi9cbi8qIHZpbTogc2V0IHN0cz0yIHN3PTIgZXQgdHc9ODA6ICovXG4vKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghZ2xvYmFsVGhpcy5jaHJvbWU/LnJ1bnRpbWU/LmlkKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIlRoaXMgc2NyaXB0IHNob3VsZCBvbmx5IGJlIGxvYWRlZCBpbiBhIGJyb3dzZXIgZXh0ZW5zaW9uLlwiKTtcbn1cblxuaWYgKHR5cGVvZiBnbG9iYWxUaGlzLmJyb3dzZXIgPT09IFwidW5kZWZpbmVkXCIgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKGdsb2JhbFRoaXMuYnJvd3NlcikgIT09IE9iamVjdC5wcm90b3R5cGUpIHtcbiAgY29uc3QgQ0hST01FX1NFTkRfTUVTU0FHRV9DQUxMQkFDS19OT19SRVNQT05TRV9NRVNTQUdFID0gXCJUaGUgbWVzc2FnZSBwb3J0IGNsb3NlZCBiZWZvcmUgYSByZXNwb25zZSB3YXMgcmVjZWl2ZWQuXCI7XG5cbiAgLy8gV3JhcHBpbmcgdGhlIGJ1bGsgb2YgdGhpcyBwb2x5ZmlsbCBpbiBhIG9uZS10aW1lLXVzZSBmdW5jdGlvbiBpcyBhIG1pbm9yXG4gIC8vIG9wdGltaXphdGlvbiBmb3IgRmlyZWZveC4gU2luY2UgU3BpZGVybW9ua2V5IGRvZXMgbm90IGZ1bGx5IHBhcnNlIHRoZVxuICAvLyBjb250ZW50cyBvZiBhIGZ1bmN0aW9uIHVudGlsIHRoZSBmaXJzdCB0aW1lIGl0J3MgY2FsbGVkLCBhbmQgc2luY2UgaXQgd2lsbFxuICAvLyBuZXZlciBhY3R1YWxseSBuZWVkIHRvIGJlIGNhbGxlZCwgdGhpcyBhbGxvd3MgdGhlIHBvbHlmaWxsIHRvIGJlIGluY2x1ZGVkXG4gIC8vIGluIEZpcmVmb3ggbmVhcmx5IGZvciBmcmVlLlxuICBjb25zdCB3cmFwQVBJcyA9IGV4dGVuc2lvbkFQSXMgPT4ge1xuICAgIC8vIE5PVEU6IGFwaU1ldGFkYXRhIGlzIGFzc29jaWF0ZWQgdG8gdGhlIGNvbnRlbnQgb2YgdGhlIGFwaS1tZXRhZGF0YS5qc29uIGZpbGVcbiAgICAvLyBhdCBidWlsZCB0aW1lIGJ5IHJlcGxhY2luZyB0aGUgZm9sbG93aW5nIFwiaW5jbHVkZVwiIHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlXG4gICAgLy8gSlNPTiBmaWxlLlxuICAgIGNvbnN0IGFwaU1ldGFkYXRhID0ge1xuICAgICAgXCJhbGFybXNcIjoge1xuICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImNsZWFyQWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImJvb2ttYXJrc1wiOiB7XG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRDaGlsZHJlblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRSZWNlbnRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0U3ViVHJlZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRUcmVlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcIm1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZVRyZWVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiYnJvd3NlckFjdGlvblwiOiB7XG4gICAgICAgIFwiZGlzYWJsZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwiZW5hYmxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRCYWRnZUJhY2tncm91bmRDb2xvclwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRCYWRnZVRleHRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0UG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0VGl0bGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwib3BlblBvcHVwXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcInNldEJhZGdlQmFja2dyb3VuZENvbG9yXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRCYWRnZVRleHRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldEljb25cIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0UG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldFRpdGxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiYnJvd3NpbmdEYXRhXCI6IHtcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlQ2FjaGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlQ29va2llc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVEb3dubG9hZHNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlRm9ybURhdGFcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlSGlzdG9yeVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVMb2NhbFN0b3JhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlUGFzc3dvcmRzXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZVBsdWdpbkRhdGFcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0dGluZ3NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImNvbW1hbmRzXCI6IHtcbiAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImNvbnRleHRNZW51c1wiOiB7XG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZUFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImNvb2tpZXNcIjoge1xuICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsQ29va2llU3RvcmVzXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImRldnRvb2xzXCI6IHtcbiAgICAgICAgXCJpbnNwZWN0ZWRXaW5kb3dcIjoge1xuICAgICAgICAgIFwiZXZhbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJzaW5nbGVDYWxsYmFja0FyZ1wiOiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwYW5lbHNcIjoge1xuICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAzLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDMsXG4gICAgICAgICAgICBcInNpbmdsZUNhbGxiYWNrQXJnXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZWxlbWVudHNcIjoge1xuICAgICAgICAgICAgXCJjcmVhdGVTaWRlYmFyUGFuZVwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiZG93bmxvYWRzXCI6IHtcbiAgICAgICAgXCJjYW5jZWxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZG93bmxvYWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZXJhc2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0RmlsZUljb25cIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwib3BlblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwicGF1c2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlRmlsZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZXN1bWVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInNob3dcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJleHRlbnNpb25cIjoge1xuICAgICAgICBcImlzQWxsb3dlZEZpbGVTY2hlbWVBY2Nlc3NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiaXNBbGxvd2VkSW5jb2duaXRvQWNjZXNzXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJoaXN0b3J5XCI6IHtcbiAgICAgICAgXCJhZGRVcmxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlQWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVJhbmdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVVybFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRWaXNpdHNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJpMThuXCI6IHtcbiAgICAgICAgXCJkZXRlY3RMYW5ndWFnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBY2NlcHRMYW5ndWFnZXNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImlkZW50aXR5XCI6IHtcbiAgICAgICAgXCJsYXVuY2hXZWJBdXRoRmxvd1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiaWRsZVwiOiB7XG4gICAgICAgIFwicXVlcnlTdGF0ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwibWFuYWdlbWVudFwiOiB7XG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRTZWxmXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcInNldEVuYWJsZWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwidW5pbnN0YWxsU2VsZlwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwibm90aWZpY2F0aW9uc1wiOiB7XG4gICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRQZXJtaXNzaW9uTGV2ZWxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJwYWdlQWN0aW9uXCI6IHtcbiAgICAgICAgXCJnZXRQb3B1cFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRUaXRsZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJoaWRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRJY29uXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInNldFBvcHVwXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRUaXRsZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwic2hvd1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInBlcm1pc3Npb25zXCI6IHtcbiAgICAgICAgXCJjb250YWluc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlcXVlc3RcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInJ1bnRpbWVcIjoge1xuICAgICAgICBcImdldEJhY2tncm91bmRQYWdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFBsYXRmb3JtSW5mb1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGVuT3B0aW9uc1BhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVxdWVzdFVwZGF0ZUNoZWNrXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcInNlbmRNZXNzYWdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogM1xuICAgICAgICB9LFxuICAgICAgICBcInNlbmROYXRpdmVNZXNzYWdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9LFxuICAgICAgICBcInNldFVuaW5zdGFsbFVSTFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwic2Vzc2lvbnNcIjoge1xuICAgICAgICBcImdldERldmljZXNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0UmVjZW50bHlDbG9zZWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVzdG9yZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwic3RvcmFnZVwiOiB7XG4gICAgICAgIFwibG9jYWxcIjoge1xuICAgICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRCeXRlc0luVXNlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibWFuYWdlZFwiOiB7XG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRCeXRlc0luVXNlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwic3luY1wiOiB7XG4gICAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwidGFic1wiOiB7XG4gICAgICAgIFwiY2FwdHVyZVZpc2libGVUYWJcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImRldGVjdExhbmd1YWdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImRpc2NhcmRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZHVwbGljYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImV4ZWN1dGVTY3JpcHRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEN1cnJlbnRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0Wm9vbVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRab29tU2V0dGluZ3NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ29CYWNrXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdvRm9yd2FyZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJoaWdobGlnaHRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiaW5zZXJ0Q1NTXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9LFxuICAgICAgICBcIm1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwicXVlcnlcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVsb2FkXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVDU1NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VuZE1lc3NhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAzXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0Wm9vbVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRab29tU2V0dGluZ3NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJ0b3BTaXRlc1wiOiB7XG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJ3ZWJOYXZpZ2F0aW9uXCI6IHtcbiAgICAgICAgXCJnZXRBbGxGcmFtZXNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0RnJhbWVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcIndlYlJlcXVlc3RcIjoge1xuICAgICAgICBcImhhbmRsZXJCZWhhdmlvckNoYW5nZWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcIndpbmRvd3NcIjoge1xuICAgICAgICBcImNyZWF0ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEN1cnJlbnRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0TGFzdEZvY3VzZWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoT2JqZWN0LmtleXMoYXBpTWV0YWRhdGEpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXBpLW1ldGFkYXRhLmpzb24gaGFzIG5vdCBiZWVuIGluY2x1ZGVkIGluIGJyb3dzZXItcG9seWZpbGxcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBXZWFrTWFwIHN1YmNsYXNzIHdoaWNoIGNyZWF0ZXMgYW5kIHN0b3JlcyBhIHZhbHVlIGZvciBhbnkga2V5IHdoaWNoIGRvZXNcbiAgICAgKiBub3QgZXhpc3Qgd2hlbiBhY2Nlc3NlZCwgYnV0IGJlaGF2ZXMgZXhhY3RseSBhcyBhbiBvcmRpbmFyeSBXZWFrTWFwXG4gICAgICogb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY3JlYXRlSXRlbVxuICAgICAqICAgICAgICBBIGZ1bmN0aW9uIHdoaWNoIHdpbGwgYmUgY2FsbGVkIGluIG9yZGVyIHRvIGNyZWF0ZSB0aGUgdmFsdWUgZm9yIGFueVxuICAgICAqICAgICAgICBrZXkgd2hpY2ggZG9lcyBub3QgZXhpc3QsIHRoZSBmaXJzdCB0aW1lIGl0IGlzIGFjY2Vzc2VkLiBUaGVcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gcmVjZWl2ZXMsIGFzIGl0cyBvbmx5IGFyZ3VtZW50LCB0aGUga2V5IGJlaW5nIGNyZWF0ZWQuXG4gICAgICovXG4gICAgY2xhc3MgRGVmYXVsdFdlYWtNYXAgZXh0ZW5kcyBXZWFrTWFwIHtcbiAgICAgIGNvbnN0cnVjdG9yKGNyZWF0ZUl0ZW0sIGl0ZW1zID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN1cGVyKGl0ZW1zKTtcbiAgICAgICAgdGhpcy5jcmVhdGVJdGVtID0gY3JlYXRlSXRlbTtcbiAgICAgIH1cblxuICAgICAgZ2V0KGtleSkge1xuICAgICAgICBpZiAoIXRoaXMuaGFzKGtleSkpIHtcbiAgICAgICAgICB0aGlzLnNldChrZXksIHRoaXMuY3JlYXRlSXRlbShrZXkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdXBlci5nZXQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG9iamVjdCBpcyBhbiBvYmplY3Qgd2l0aCBhIGB0aGVuYCBtZXRob2QsIGFuZCBjYW5cbiAgICAgKiB0aGVyZWZvcmUgYmUgYXNzdW1lZCB0byBiZWhhdmUgYXMgYSBQcm9taXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gdGVzdC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgdGhlbmFibGUuXG4gICAgICovXG4gICAgY29uc3QgaXNUaGVuYWJsZSA9IHZhbHVlID0+IHtcbiAgICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09IFwiZnVuY3Rpb25cIjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhIGZ1bmN0aW9uIHdoaWNoLCB3aGVuIGNhbGxlZCwgd2lsbCByZXNvbHZlIG9yIHJlamVjdFxuICAgICAqIHRoZSBnaXZlbiBwcm9taXNlIGJhc2VkIG9uIGhvdyBpdCBpcyBjYWxsZWQ6XG4gICAgICpcbiAgICAgKiAtIElmLCB3aGVuIGNhbGxlZCwgYGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcmAgY29udGFpbnMgYSBub24tbnVsbCBvYmplY3QsXG4gICAgICogICB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCB3aXRoIHRoYXQgdmFsdWUuXG4gICAgICogLSBJZiB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggZXhhY3RseSBvbmUgYXJndW1lbnQsIHRoZSBwcm9taXNlIGlzXG4gICAgICogICByZXNvbHZlZCB0byB0aGF0IHZhbHVlLlxuICAgICAqIC0gT3RoZXJ3aXNlLCB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZCB0byBhbiBhcnJheSBjb250YWluaW5nIGFsbCBvZiB0aGVcbiAgICAgKiAgIGZ1bmN0aW9uJ3MgYXJndW1lbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHByb21pc2VcbiAgICAgKiAgICAgICAgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHJlc29sdXRpb24gYW5kIHJlamVjdGlvbiBmdW5jdGlvbnMgb2YgYVxuICAgICAqICAgICAgICBwcm9taXNlLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb21pc2UucmVzb2x2ZVxuICAgICAqICAgICAgICBUaGUgcHJvbWlzZSdzIHJlc29sdXRpb24gZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvbWlzZS5yZWplY3RcbiAgICAgKiAgICAgICAgVGhlIHByb21pc2UncyByZWplY3Rpb24gZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG1ldGFkYXRhXG4gICAgICogICAgICAgIE1ldGFkYXRhIGFib3V0IHRoZSB3cmFwcGVkIG1ldGhvZCB3aGljaCBoYXMgY3JlYXRlZCB0aGUgY2FsbGJhY2suXG4gICAgICogQHBhcmFtIHtib29sZWFufSBtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZ1xuICAgICAqICAgICAgICBXaGV0aGVyIG9yIG5vdCB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIG9ubHkgdGhlIGZpcnN0XG4gICAgICogICAgICAgIGFyZ3VtZW50IG9mIHRoZSBjYWxsYmFjaywgYWx0ZXJuYXRpdmVseSBhbiBhcnJheSBvZiBhbGwgdGhlXG4gICAgICogICAgICAgIGNhbGxiYWNrIGFyZ3VtZW50cyBpcyByZXNvbHZlZC4gQnkgZGVmYXVsdCwgaWYgdGhlIGNhbGxiYWNrXG4gICAgICogICAgICAgIGZ1bmN0aW9uIGlzIGludm9rZWQgd2l0aCBvbmx5IGEgc2luZ2xlIGFyZ3VtZW50LCB0aGF0IHdpbGwgYmVcbiAgICAgKiAgICAgICAgcmVzb2x2ZWQgdG8gdGhlIHByb21pc2UsIHdoaWxlIGFsbCBhcmd1bWVudHMgd2lsbCBiZSByZXNvbHZlZCBhc1xuICAgICAqICAgICAgICBhbiBhcnJheSBpZiBtdWx0aXBsZSBhcmUgZ2l2ZW4uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7ZnVuY3Rpb259XG4gICAgICogICAgICAgIFRoZSBnZW5lcmF0ZWQgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICovXG4gICAgY29uc3QgbWFrZUNhbGxiYWNrID0gKHByb21pc2UsIG1ldGFkYXRhKSA9PiB7XG4gICAgICByZXR1cm4gKC4uLmNhbGxiYWNrQXJncykgPT4ge1xuICAgICAgICBpZiAoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgIHByb21pc2UucmVqZWN0KG5ldyBFcnJvcihleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpKTtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZyB8fFxuICAgICAgICAgICAgICAgICAgIChjYWxsYmFja0FyZ3MubGVuZ3RoIDw9IDEgJiYgbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmcgIT09IGZhbHNlKSkge1xuICAgICAgICAgIHByb21pc2UucmVzb2x2ZShjYWxsYmFja0FyZ3NbMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb21pc2UucmVzb2x2ZShjYWxsYmFja0FyZ3MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH07XG5cbiAgICBjb25zdCBwbHVyYWxpemVBcmd1bWVudHMgPSAobnVtQXJncykgPT4gbnVtQXJncyA9PSAxID8gXCJhcmd1bWVudFwiIDogXCJhcmd1bWVudHNcIjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSB3cmFwcGVyIGZ1bmN0aW9uIGZvciBhIG1ldGhvZCB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBtZXRhZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogICAgICAgIFRoZSBuYW1lIG9mIHRoZSBtZXRob2Qgd2hpY2ggaXMgYmVpbmcgd3JhcHBlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbWV0YWRhdGFcbiAgICAgKiAgICAgICAgTWV0YWRhdGEgYWJvdXQgdGhlIG1ldGhvZCBiZWluZyB3cmFwcGVkLlxuICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gbWV0YWRhdGEubWluQXJnc1xuICAgICAqICAgICAgICBUaGUgbWluaW11bSBudW1iZXIgb2YgYXJndW1lbnRzIHdoaWNoIG11c3QgYmUgcGFzc2VkIHRvIHRoZVxuICAgICAqICAgICAgICBmdW5jdGlvbi4gSWYgY2FsbGVkIHdpdGggZmV3ZXIgdGhhbiB0aGlzIG51bWJlciBvZiBhcmd1bWVudHMsIHRoZVxuICAgICAqICAgICAgICB3cmFwcGVyIHdpbGwgcmFpc2UgYW4gZXhjZXB0aW9uLlxuICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gbWV0YWRhdGEubWF4QXJnc1xuICAgICAqICAgICAgICBUaGUgbWF4aW11bSBudW1iZXIgb2YgYXJndW1lbnRzIHdoaWNoIG1heSBiZSBwYXNzZWQgdG8gdGhlXG4gICAgICogICAgICAgIGZ1bmN0aW9uLiBJZiBjYWxsZWQgd2l0aCBtb3JlIHRoYW4gdGhpcyBudW1iZXIgb2YgYXJndW1lbnRzLCB0aGVcbiAgICAgKiAgICAgICAgd3JhcHBlciB3aWxsIHJhaXNlIGFuIGV4Y2VwdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnXG4gICAgICogICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggb25seSB0aGUgZmlyc3RcbiAgICAgKiAgICAgICAgYXJndW1lbnQgb2YgdGhlIGNhbGxiYWNrLCBhbHRlcm5hdGl2ZWx5IGFuIGFycmF5IG9mIGFsbCB0aGVcbiAgICAgKiAgICAgICAgY2FsbGJhY2sgYXJndW1lbnRzIGlzIHJlc29sdmVkLiBCeSBkZWZhdWx0LCBpZiB0aGUgY2FsbGJhY2tcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIG9ubHkgYSBzaW5nbGUgYXJndW1lbnQsIHRoYXQgd2lsbCBiZVxuICAgICAqICAgICAgICByZXNvbHZlZCB0byB0aGUgcHJvbWlzZSwgd2hpbGUgYWxsIGFyZ3VtZW50cyB3aWxsIGJlIHJlc29sdmVkIGFzXG4gICAgICogICAgICAgIGFuIGFycmF5IGlmIG11bHRpcGxlIGFyZSBnaXZlbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbihvYmplY3QsIC4uLiopfVxuICAgICAqICAgICAgIFRoZSBnZW5lcmF0ZWQgd3JhcHBlciBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBjb25zdCB3cmFwQXN5bmNGdW5jdGlvbiA9IChuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGFzeW5jRnVuY3Rpb25XcmFwcGVyKHRhcmdldCwgLi4uYXJncykge1xuICAgICAgICBpZiAoYXJncy5sZW5ndGggPCBtZXRhZGF0YS5taW5BcmdzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBsZWFzdCAke21ldGFkYXRhLm1pbkFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1pbkFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IG1ldGFkYXRhLm1heEFyZ3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IG1vc3QgJHttZXRhZGF0YS5tYXhBcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5tYXhBcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGlmIChtZXRhZGF0YS5mYWxsYmFja1RvTm9DYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gVGhpcyBBUEkgbWV0aG9kIGhhcyBjdXJyZW50bHkgbm8gY2FsbGJhY2sgb24gQ2hyb21lLCBidXQgaXQgcmV0dXJuIGEgcHJvbWlzZSBvbiBGaXJlZm94LFxuICAgICAgICAgICAgLy8gYW5kIHNvIHRoZSBwb2x5ZmlsbCB3aWxsIHRyeSB0byBjYWxsIGl0IHdpdGggYSBjYWxsYmFjayBmaXJzdCwgYW5kIGl0IHdpbGwgZmFsbGJhY2tcbiAgICAgICAgICAgIC8vIHRvIG5vdCBwYXNzaW5nIHRoZSBjYWxsYmFjayBpZiB0aGUgZmlyc3QgY2FsbCBmYWlscy5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzLCBtYWtlQ2FsbGJhY2soe3Jlc29sdmUsIHJlamVjdH0sIG1ldGFkYXRhKSk7XG4gICAgICAgICAgICB9IGNhdGNoIChjYkVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihgJHtuYW1lfSBBUEkgbWV0aG9kIGRvZXNuJ3Qgc2VlbSB0byBzdXBwb3J0IHRoZSBjYWxsYmFjayBwYXJhbWV0ZXIsIGAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmYWxsaW5nIGJhY2sgdG8gY2FsbCBpdCB3aXRob3V0IGEgY2FsbGJhY2s6IFwiLCBjYkVycm9yKTtcblxuICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0oLi4uYXJncyk7XG5cbiAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBBUEkgbWV0aG9kIG1ldGFkYXRhLCBzbyB0aGF0IHRoZSBuZXh0IEFQSSBjYWxscyB3aWxsIG5vdCB0cnkgdG9cbiAgICAgICAgICAgICAgLy8gdXNlIHRoZSB1bnN1cHBvcnRlZCBjYWxsYmFjayBhbnltb3JlLlxuICAgICAgICAgICAgICBtZXRhZGF0YS5mYWxsYmFja1RvTm9DYWxsYmFjayA9IGZhbHNlO1xuICAgICAgICAgICAgICBtZXRhZGF0YS5ub0NhbGxiYWNrID0gdHJ1ZTtcblxuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChtZXRhZGF0YS5ub0NhbGxiYWNrKSB7XG4gICAgICAgICAgICB0YXJnZXRbbmFtZV0oLi4uYXJncyk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzLCBtYWtlQ2FsbGJhY2soe3Jlc29sdmUsIHJlamVjdH0sIG1ldGFkYXRhKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFdyYXBzIGFuIGV4aXN0aW5nIG1ldGhvZCBvZiB0aGUgdGFyZ2V0IG9iamVjdCwgc28gdGhhdCBjYWxscyB0byBpdCBhcmVcbiAgICAgKiBpbnRlcmNlcHRlZCBieSB0aGUgZ2l2ZW4gd3JhcHBlciBmdW5jdGlvbi4gVGhlIHdyYXBwZXIgZnVuY3Rpb24gcmVjZWl2ZXMsXG4gICAgICogYXMgaXRzIGZpcnN0IGFyZ3VtZW50LCB0aGUgb3JpZ2luYWwgYHRhcmdldGAgb2JqZWN0LCBmb2xsb3dlZCBieSBlYWNoIG9mXG4gICAgICogdGhlIGFyZ3VtZW50cyBwYXNzZWQgdG8gdGhlIG9yaWdpbmFsIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAgICAgKiAgICAgICAgVGhlIG9yaWdpbmFsIHRhcmdldCBvYmplY3QgdGhhdCB0aGUgd3JhcHBlZCBtZXRob2QgYmVsb25ncyB0by5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtZXRob2RcbiAgICAgKiAgICAgICAgVGhlIG1ldGhvZCBiZWluZyB3cmFwcGVkLiBUaGlzIGlzIHVzZWQgYXMgdGhlIHRhcmdldCBvZiB0aGUgUHJveHlcbiAgICAgKiAgICAgICAgb2JqZWN0IHdoaWNoIGlzIGNyZWF0ZWQgdG8gd3JhcCB0aGUgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHdyYXBwZXJcbiAgICAgKiAgICAgICAgVGhlIHdyYXBwZXIgZnVuY3Rpb24gd2hpY2ggaXMgY2FsbGVkIGluIHBsYWNlIG9mIGEgZGlyZWN0IGludm9jYXRpb25cbiAgICAgKiAgICAgICAgb2YgdGhlIHdyYXBwZWQgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1Byb3h5PGZ1bmN0aW9uPn1cbiAgICAgKiAgICAgICAgQSBQcm94eSBvYmplY3QgZm9yIHRoZSBnaXZlbiBtZXRob2QsIHdoaWNoIGludm9rZXMgdGhlIGdpdmVuIHdyYXBwZXJcbiAgICAgKiAgICAgICAgbWV0aG9kIGluIGl0cyBwbGFjZS5cbiAgICAgKi9cbiAgICBjb25zdCB3cmFwTWV0aG9kID0gKHRhcmdldCwgbWV0aG9kLCB3cmFwcGVyKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb3h5KG1ldGhvZCwge1xuICAgICAgICBhcHBseSh0YXJnZXRNZXRob2QsIHRoaXNPYmosIGFyZ3MpIHtcbiAgICAgICAgICByZXR1cm4gd3JhcHBlci5jYWxsKHRoaXNPYmosIHRhcmdldCwgLi4uYXJncyk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgbGV0IGhhc093blByb3BlcnR5ID0gRnVuY3Rpb24uY2FsbC5iaW5kKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYW4gb2JqZWN0IGluIGEgUHJveHkgd2hpY2ggaW50ZXJjZXB0cyBhbmQgd3JhcHMgY2VydGFpbiBtZXRob2RzXG4gICAgICogYmFzZWQgb24gdGhlIGdpdmVuIGB3cmFwcGVyc2AgYW5kIGBtZXRhZGF0YWAgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAgICAgKiAgICAgICAgVGhlIHRhcmdldCBvYmplY3QgdG8gd3JhcC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbd3JhcHBlcnMgPSB7fV1cbiAgICAgKiAgICAgICAgQW4gb2JqZWN0IHRyZWUgY29udGFpbmluZyB3cmFwcGVyIGZ1bmN0aW9ucyBmb3Igc3BlY2lhbCBjYXNlcy4gQW55XG4gICAgICogICAgICAgIGZ1bmN0aW9uIHByZXNlbnQgaW4gdGhpcyBvYmplY3QgdHJlZSBpcyBjYWxsZWQgaW4gcGxhY2Ugb2YgdGhlXG4gICAgICogICAgICAgIG1ldGhvZCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGUgYHRhcmdldGAgb2JqZWN0IHRyZWUuIFRoZXNlXG4gICAgICogICAgICAgIHdyYXBwZXIgbWV0aG9kcyBhcmUgaW52b2tlZCBhcyBkZXNjcmliZWQgaW4ge0BzZWUgd3JhcE1ldGhvZH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW21ldGFkYXRhID0ge31dXG4gICAgICogICAgICAgIEFuIG9iamVjdCB0cmVlIGNvbnRhaW5pbmcgbWV0YWRhdGEgdXNlZCB0byBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlXG4gICAgICogICAgICAgIFByb21pc2UtYmFzZWQgd3JhcHBlciBmdW5jdGlvbnMgZm9yIGFzeW5jaHJvbm91cy4gQW55IGZ1bmN0aW9uIGluXG4gICAgICogICAgICAgIHRoZSBgdGFyZ2V0YCBvYmplY3QgdHJlZSB3aGljaCBoYXMgYSBjb3JyZXNwb25kaW5nIG1ldGFkYXRhIG9iamVjdFxuICAgICAqICAgICAgICBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGUgYG1ldGFkYXRhYCB0cmVlIGlzIHJlcGxhY2VkIHdpdGggYW5cbiAgICAgKiAgICAgICAgYXV0b21hdGljYWxseS1nZW5lcmF0ZWQgd3JhcHBlciBmdW5jdGlvbiwgYXMgZGVzY3JpYmVkIGluXG4gICAgICogICAgICAgIHtAc2VlIHdyYXBBc3luY0Z1bmN0aW9ufVxuICAgICAqXG4gICAgICogQHJldHVybnMge1Byb3h5PG9iamVjdD59XG4gICAgICovXG4gICAgY29uc3Qgd3JhcE9iamVjdCA9ICh0YXJnZXQsIHdyYXBwZXJzID0ge30sIG1ldGFkYXRhID0ge30pID0+IHtcbiAgICAgIGxldCBjYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICBsZXQgaGFuZGxlcnMgPSB7XG4gICAgICAgIGhhcyhwcm94eVRhcmdldCwgcHJvcCkge1xuICAgICAgICAgIHJldHVybiBwcm9wIGluIHRhcmdldCB8fCBwcm9wIGluIGNhY2hlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldChwcm94eVRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICBpZiAocHJvcCBpbiBjYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW3Byb3BdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghKHByb3AgaW4gdGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdmFsdWUgPSB0YXJnZXRbcHJvcF07XG5cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBtZXRob2Qgb24gdGhlIHVuZGVybHlpbmcgb2JqZWN0LiBDaGVjayBpZiB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbnkgd3JhcHBpbmcuXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd3JhcHBlcnNbcHJvcF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgc3BlY2lhbC1jYXNlIHdyYXBwZXIgZm9yIHRoaXMgbWV0aG9kLlxuICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXBNZXRob2QodGFyZ2V0LCB0YXJnZXRbcHJvcF0sIHdyYXBwZXJzW3Byb3BdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzT3duUHJvcGVydHkobWV0YWRhdGEsIHByb3ApKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYXN5bmMgbWV0aG9kIHRoYXQgd2UgaGF2ZSBtZXRhZGF0YSBmb3IuIENyZWF0ZSBhXG4gICAgICAgICAgICAgIC8vIFByb21pc2Ugd3JhcHBlciBmb3IgaXQuXG4gICAgICAgICAgICAgIGxldCB3cmFwcGVyID0gd3JhcEFzeW5jRnVuY3Rpb24ocHJvcCwgbWV0YWRhdGFbcHJvcF0pO1xuICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXBNZXRob2QodGFyZ2V0LCB0YXJnZXRbcHJvcF0sIHdyYXBwZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG1ldGhvZCB0aGF0IHdlIGRvbid0IGtub3cgb3IgY2FyZSBhYm91dC4gUmV0dXJuIHRoZVxuICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBtZXRob2QsIGJvdW5kIHRvIHRoZSB1bmRlcmx5aW5nIG9iamVjdC5cbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5iaW5kKHRhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgIChoYXNPd25Qcm9wZXJ0eSh3cmFwcGVycywgcHJvcCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICBoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgcHJvcCkpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGFuIG9iamVjdCB0aGF0IHdlIG5lZWQgdG8gZG8gc29tZSB3cmFwcGluZyBmb3IgdGhlIGNoaWxkcmVuXG4gICAgICAgICAgICAvLyBvZi4gQ3JlYXRlIGEgc3ViLW9iamVjdCB3cmFwcGVyIGZvciBpdCB3aXRoIHRoZSBhcHByb3ByaWF0ZSBjaGlsZFxuICAgICAgICAgICAgLy8gbWV0YWRhdGEuXG4gICAgICAgICAgICB2YWx1ZSA9IHdyYXBPYmplY3QodmFsdWUsIHdyYXBwZXJzW3Byb3BdLCBtZXRhZGF0YVtwcm9wXSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgXCIqXCIpKSB7XG4gICAgICAgICAgICAvLyBXcmFwIGFsbCBwcm9wZXJ0aWVzIGluICogbmFtZXNwYWNlLlxuICAgICAgICAgICAgdmFsdWUgPSB3cmFwT2JqZWN0KHZhbHVlLCB3cmFwcGVyc1twcm9wXSwgbWV0YWRhdGFbXCIqXCJdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBkbyBhbnkgd3JhcHBpbmcgZm9yIHRoaXMgcHJvcGVydHksXG4gICAgICAgICAgICAvLyBzbyBqdXN0IGZvcndhcmQgYWxsIGFjY2VzcyB0byB0aGUgdW5kZXJseWluZyBvYmplY3QuXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FjaGUsIHByb3AsIHtcbiAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wXTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNhY2hlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldChwcm94eVRhcmdldCwgcHJvcCwgdmFsdWUsIHJlY2VpdmVyKSB7XG4gICAgICAgICAgaWYgKHByb3AgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgIGNhY2hlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldFtwcm9wXSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWZpbmVQcm9wZXJ0eShwcm94eVRhcmdldCwgcHJvcCwgZGVzYykge1xuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmRlZmluZVByb3BlcnR5KGNhY2hlLCBwcm9wLCBkZXNjKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWxldGVQcm9wZXJ0eShwcm94eVRhcmdldCwgcHJvcCkge1xuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGNhY2hlLCBwcm9wKTtcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIC8vIFBlciBjb250cmFjdCBvZiB0aGUgUHJveHkgQVBJLCB0aGUgXCJnZXRcIiBwcm94eSBoYW5kbGVyIG11c3QgcmV0dXJuIHRoZVxuICAgICAgLy8gb3JpZ2luYWwgdmFsdWUgb2YgdGhlIHRhcmdldCBpZiB0aGF0IHZhbHVlIGlzIGRlY2xhcmVkIHJlYWQtb25seSBhbmRcbiAgICAgIC8vIG5vbi1jb25maWd1cmFibGUuIEZvciB0aGlzIHJlYXNvbiwgd2UgY3JlYXRlIGFuIG9iamVjdCB3aXRoIHRoZVxuICAgICAgLy8gcHJvdG90eXBlIHNldCB0byBgdGFyZ2V0YCBpbnN0ZWFkIG9mIHVzaW5nIGB0YXJnZXRgIGRpcmVjdGx5LlxuICAgICAgLy8gT3RoZXJ3aXNlIHdlIGNhbm5vdCByZXR1cm4gYSBjdXN0b20gb2JqZWN0IGZvciBBUElzIHRoYXRcbiAgICAgIC8vIGFyZSBkZWNsYXJlZCByZWFkLW9ubHkgYW5kIG5vbi1jb25maWd1cmFibGUsIHN1Y2ggYXMgYGNocm9tZS5kZXZ0b29sc2AuXG4gICAgICAvL1xuICAgICAgLy8gVGhlIHByb3h5IGhhbmRsZXJzIHRoZW1zZWx2ZXMgd2lsbCBzdGlsbCB1c2UgdGhlIG9yaWdpbmFsIGB0YXJnZXRgXG4gICAgICAvLyBpbnN0ZWFkIG9mIHRoZSBgcHJveHlUYXJnZXRgLCBzbyB0aGF0IHRoZSBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzIGFyZVxuICAgICAgLy8gZGVyZWZlcmVuY2VkIHZpYSB0aGUgb3JpZ2luYWwgdGFyZ2V0cy5cbiAgICAgIGxldCBwcm94eVRhcmdldCA9IE9iamVjdC5jcmVhdGUodGFyZ2V0KTtcbiAgICAgIHJldHVybiBuZXcgUHJveHkocHJveHlUYXJnZXQsIGhhbmRsZXJzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHNldCBvZiB3cmFwcGVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgb2JqZWN0LCB3aGljaCBoYW5kbGVzXG4gICAgICogd3JhcHBpbmcgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRoYXQgdGhvc2UgbWVzc2FnZXMgYXJlIHBhc3NlZC5cbiAgICAgKlxuICAgICAqIEEgc2luZ2xlIHdyYXBwZXIgaXMgY3JlYXRlZCBmb3IgZWFjaCBsaXN0ZW5lciBmdW5jdGlvbiwgYW5kIHN0b3JlZCBpbiBhXG4gICAgICogbWFwLiBTdWJzZXF1ZW50IGNhbGxzIHRvIGBhZGRMaXN0ZW5lcmAsIGBoYXNMaXN0ZW5lcmAsIG9yIGByZW1vdmVMaXN0ZW5lcmBcbiAgICAgKiByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgd3JhcHBlciwgc28gdGhhdCAgYXR0ZW1wdHMgdG8gcmVtb3ZlIGFcbiAgICAgKiBwcmV2aW91c2x5LWFkZGVkIGxpc3RlbmVyIHdvcmsgYXMgZXhwZWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0RlZmF1bHRXZWFrTWFwPGZ1bmN0aW9uLCBmdW5jdGlvbj59IHdyYXBwZXJNYXBcbiAgICAgKiAgICAgICAgQSBEZWZhdWx0V2Vha01hcCBvYmplY3Qgd2hpY2ggd2lsbCBjcmVhdGUgdGhlIGFwcHJvcHJpYXRlIHdyYXBwZXJcbiAgICAgKiAgICAgICAgZm9yIGEgZ2l2ZW4gbGlzdGVuZXIgZnVuY3Rpb24gd2hlbiBvbmUgZG9lcyBub3QgZXhpc3QsIGFuZCByZXRyaWV2ZVxuICAgICAqICAgICAgICBhbiBleGlzdGluZyBvbmUgd2hlbiBpdCBkb2VzLlxuICAgICAqXG4gICAgICogQHJldHVybnMge29iamVjdH1cbiAgICAgKi9cbiAgICBjb25zdCB3cmFwRXZlbnQgPSB3cmFwcGVyTWFwID0+ICh7XG4gICAgICBhZGRMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyLCAuLi5hcmdzKSB7XG4gICAgICAgIHRhcmdldC5hZGRMaXN0ZW5lcih3cmFwcGVyTWFwLmdldChsaXN0ZW5lciksIC4uLmFyZ3MpO1xuICAgICAgfSxcblxuICAgICAgaGFzTGlzdGVuZXIodGFyZ2V0LCBsaXN0ZW5lcikge1xuICAgICAgICByZXR1cm4gdGFyZ2V0Lmhhc0xpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRhcmdldC5yZW1vdmVMaXN0ZW5lcih3cmFwcGVyTWFwLmdldChsaXN0ZW5lcikpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG9uUmVxdWVzdEZpbmlzaGVkV3JhcHBlcnMgPSBuZXcgRGVmYXVsdFdlYWtNYXAobGlzdGVuZXIgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBXcmFwcyBhbiBvblJlcXVlc3RGaW5pc2hlZCBsaXN0ZW5lciBmdW5jdGlvbiBzbyB0aGF0IGl0IHdpbGwgcmV0dXJuIGFcbiAgICAgICAqIGBnZXRDb250ZW50KClgIHByb3BlcnR5IHdoaWNoIHJldHVybnMgYSBgUHJvbWlzZWAgcmF0aGVyIHRoYW4gdXNpbmcgYVxuICAgICAgICogY2FsbGJhY2sgQVBJLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXFcbiAgICAgICAqICAgICAgICBUaGUgSEFSIGVudHJ5IG9iamVjdCByZXByZXNlbnRpbmcgdGhlIG5ldHdvcmsgcmVxdWVzdC5cbiAgICAgICAqL1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIG9uUmVxdWVzdEZpbmlzaGVkKHJlcSkge1xuICAgICAgICBjb25zdCB3cmFwcGVkUmVxID0gd3JhcE9iamVjdChyZXEsIHt9IC8qIHdyYXBwZXJzICovLCB7XG4gICAgICAgICAgZ2V0Q29udGVudDoge1xuICAgICAgICAgICAgbWluQXJnczogMCxcbiAgICAgICAgICAgIG1heEFyZ3M6IDAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGxpc3RlbmVyKHdyYXBwZWRSZXEpO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG9uTWVzc2FnZVdyYXBwZXJzID0gbmV3IERlZmF1bHRXZWFrTWFwKGxpc3RlbmVyID0+IHtcbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogV3JhcHMgYSBtZXNzYWdlIGxpc3RlbmVyIGZ1bmN0aW9uIHNvIHRoYXQgaXQgbWF5IHNlbmQgcmVzcG9uc2VzIGJhc2VkIG9uXG4gICAgICAgKiBpdHMgcmV0dXJuIHZhbHVlLCByYXRoZXIgdGhhbiBieSByZXR1cm5pbmcgYSBzZW50aW5lbCB2YWx1ZSBhbmQgY2FsbGluZyBhXG4gICAgICAgKiBjYWxsYmFjay4gSWYgdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHJldHVybnMgYSBQcm9taXNlLCB0aGUgcmVzcG9uc2UgaXNcbiAgICAgICAqIHNlbnQgd2hlbiB0aGUgcHJvbWlzZSBlaXRoZXIgcmVzb2x2ZXMgb3IgcmVqZWN0cy5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0geyp9IG1lc3NhZ2VcbiAgICAgICAqICAgICAgICBUaGUgbWVzc2FnZSBzZW50IGJ5IHRoZSBvdGhlciBlbmQgb2YgdGhlIGNoYW5uZWwuXG4gICAgICAgKiBAcGFyYW0ge29iamVjdH0gc2VuZGVyXG4gICAgICAgKiAgICAgICAgRGV0YWlscyBhYm91dCB0aGUgc2VuZGVyIG9mIHRoZSBtZXNzYWdlLlxuICAgICAgICogQHBhcmFtIHtmdW5jdGlvbigqKX0gc2VuZFJlc3BvbnNlXG4gICAgICAgKiAgICAgICAgQSBjYWxsYmFjayB3aGljaCwgd2hlbiBjYWxsZWQgd2l0aCBhbiBhcmJpdHJhcnkgYXJndW1lbnQsIHNlbmRzXG4gICAgICAgKiAgICAgICAgdGhhdCB2YWx1ZSBhcyBhIHJlc3BvbnNlLlxuICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgKiAgICAgICAgVHJ1ZSBpZiB0aGUgd3JhcHBlZCBsaXN0ZW5lciByZXR1cm5lZCBhIFByb21pc2UsIHdoaWNoIHdpbGwgbGF0ZXJcbiAgICAgICAqICAgICAgICB5aWVsZCBhIHJlc3BvbnNlLiBGYWxzZSBvdGhlcndpc2UuXG4gICAgICAgKi9cbiAgICAgIHJldHVybiBmdW5jdGlvbiBvbk1lc3NhZ2UobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgICAgICAgbGV0IGRpZENhbGxTZW5kUmVzcG9uc2UgPSBmYWxzZTtcblxuICAgICAgICBsZXQgd3JhcHBlZFNlbmRSZXNwb25zZTtcbiAgICAgICAgbGV0IHNlbmRSZXNwb25zZVByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB3cmFwcGVkU2VuZFJlc3BvbnNlID0gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGRpZENhbGxTZW5kUmVzcG9uc2UgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXN1bHQgPSBsaXN0ZW5lcihtZXNzYWdlLCBzZW5kZXIsIHdyYXBwZWRTZW5kUmVzcG9uc2UpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICByZXN1bHQgPSBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNSZXN1bHRUaGVuYWJsZSA9IHJlc3VsdCAhPT0gdHJ1ZSAmJiBpc1RoZW5hYmxlKHJlc3VsdCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIGRpZG4ndCByZXR1cm5lZCB0cnVlIG9yIGEgUHJvbWlzZSwgb3IgY2FsbGVkXG4gICAgICAgIC8vIHdyYXBwZWRTZW5kUmVzcG9uc2Ugc3luY2hyb25vdXNseSwgd2UgY2FuIGV4aXQgZWFybGllclxuICAgICAgICAvLyBiZWNhdXNlIHRoZXJlIHdpbGwgYmUgbm8gcmVzcG9uc2Ugc2VudCBmcm9tIHRoaXMgbGlzdGVuZXIuXG4gICAgICAgIGlmIChyZXN1bHQgIT09IHRydWUgJiYgIWlzUmVzdWx0VGhlbmFibGUgJiYgIWRpZENhbGxTZW5kUmVzcG9uc2UpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBIHNtYWxsIGhlbHBlciB0byBzZW5kIHRoZSBtZXNzYWdlIGlmIHRoZSBwcm9taXNlIHJlc29sdmVzXG4gICAgICAgIC8vIGFuZCBhbiBlcnJvciBpZiB0aGUgcHJvbWlzZSByZWplY3RzIChhIHdyYXBwZWQgc2VuZE1lc3NhZ2UgaGFzXG4gICAgICAgIC8vIHRvIHRyYW5zbGF0ZSB0aGUgbWVzc2FnZSBpbnRvIGEgcmVzb2x2ZWQgcHJvbWlzZSBvciBhIHJlamVjdGVkXG4gICAgICAgIC8vIHByb21pc2UpLlxuICAgICAgICBjb25zdCBzZW5kUHJvbWlzZWRSZXN1bHQgPSAocHJvbWlzZSkgPT4ge1xuICAgICAgICAgIHByb21pc2UudGhlbihtc2cgPT4ge1xuICAgICAgICAgICAgLy8gc2VuZCB0aGUgbWVzc2FnZSB2YWx1ZS5cbiAgICAgICAgICAgIHNlbmRSZXNwb25zZShtc2cpO1xuICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIC8vIFNlbmQgYSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBlcnJvciBpZiB0aGUgcmVqZWN0ZWQgdmFsdWVcbiAgICAgICAgICAgIC8vIGlzIGFuIGluc3RhbmNlIG9mIGVycm9yLCBvciB0aGUgb2JqZWN0IGl0c2VsZiBvdGhlcndpc2UuXG4gICAgICAgICAgICBsZXQgbWVzc2FnZTtcbiAgICAgICAgICAgIGlmIChlcnJvciAmJiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciB8fFxuICAgICAgICAgICAgICAgIHR5cGVvZiBlcnJvci5tZXNzYWdlID09PSBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgICBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UgPSBcIkFuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJyZWRcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgX19tb3pXZWJFeHRlbnNpb25Qb2x5ZmlsbFJlamVjdF9fOiB0cnVlLFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vIFByaW50IGFuIGVycm9yIG9uIHRoZSBjb25zb2xlIGlmIHVuYWJsZSB0byBzZW5kIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc2VuZCBvbk1lc3NhZ2UgcmVqZWN0ZWQgcmVwbHlcIiwgZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJuZWQgYSBQcm9taXNlLCBzZW5kIHRoZSByZXNvbHZlZCB2YWx1ZSBhcyBhXG4gICAgICAgIC8vIHJlc3VsdCwgb3RoZXJ3aXNlIHdhaXQgdGhlIHByb21pc2UgcmVsYXRlZCB0byB0aGUgd3JhcHBlZFNlbmRSZXNwb25zZVxuICAgICAgICAvLyBjYWxsYmFjayB0byByZXNvbHZlIGFuZCBzZW5kIGl0IGFzIGEgcmVzcG9uc2UuXG4gICAgICAgIGlmIChpc1Jlc3VsdFRoZW5hYmxlKSB7XG4gICAgICAgICAgc2VuZFByb21pc2VkUmVzdWx0KHJlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VuZFByb21pc2VkUmVzdWx0KHNlbmRSZXNwb25zZVByb21pc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTGV0IENocm9tZSBrbm93IHRoYXQgdGhlIGxpc3RlbmVyIGlzIHJlcGx5aW5nLlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb25zdCB3cmFwcGVkU2VuZE1lc3NhZ2VDYWxsYmFjayA9ICh7cmVqZWN0LCByZXNvbHZlfSwgcmVwbHkpID0+IHtcbiAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIC8vIERldGVjdCB3aGVuIG5vbmUgb2YgdGhlIGxpc3RlbmVycyByZXBsaWVkIHRvIHRoZSBzZW5kTWVzc2FnZSBjYWxsIGFuZCByZXNvbHZlXG4gICAgICAgIC8vIHRoZSBwcm9taXNlIHRvIHVuZGVmaW5lZCBhcyBpbiBGaXJlZm94LlxuICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvd2ViZXh0ZW5zaW9uLXBvbHlmaWxsL2lzc3Vlcy8xMzBcbiAgICAgICAgaWYgKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSA9PT0gQ0hST01FX1NFTkRfTUVTU0FHRV9DQUxMQkFDS19OT19SRVNQT05TRV9NRVNTQUdFKSB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocmVwbHkgJiYgcmVwbHkuX19tb3pXZWJFeHRlbnNpb25Qb2x5ZmlsbFJlamVjdF9fKSB7XG4gICAgICAgIC8vIENvbnZlcnQgYmFjayB0aGUgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgZXJyb3IgaW50b1xuICAgICAgICAvLyBhbiBFcnJvciBpbnN0YW5jZS5cbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXBseS5tZXNzYWdlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKHJlcGx5KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgd3JhcHBlZFNlbmRNZXNzYWdlID0gKG5hbWUsIG1ldGFkYXRhLCBhcGlOYW1lc3BhY2VPYmosIC4uLmFyZ3MpID0+IHtcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA8IG1ldGFkYXRhLm1pbkFyZ3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBsZWFzdCAke21ldGFkYXRhLm1pbkFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1pbkFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gbWV0YWRhdGEubWF4QXJncykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IG1vc3QgJHttZXRhZGF0YS5tYXhBcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5tYXhBcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHdyYXBwZWRDYiA9IHdyYXBwZWRTZW5kTWVzc2FnZUNhbGxiYWNrLmJpbmQobnVsbCwge3Jlc29sdmUsIHJlamVjdH0pO1xuICAgICAgICBhcmdzLnB1c2god3JhcHBlZENiKTtcbiAgICAgICAgYXBpTmFtZXNwYWNlT2JqLnNlbmRNZXNzYWdlKC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHN0YXRpY1dyYXBwZXJzID0ge1xuICAgICAgZGV2dG9vbHM6IHtcbiAgICAgICAgbmV0d29yazoge1xuICAgICAgICAgIG9uUmVxdWVzdEZpbmlzaGVkOiB3cmFwRXZlbnQob25SZXF1ZXN0RmluaXNoZWRXcmFwcGVycyksXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcnVudGltZToge1xuICAgICAgICBvbk1lc3NhZ2U6IHdyYXBFdmVudChvbk1lc3NhZ2VXcmFwcGVycyksXG4gICAgICAgIG9uTWVzc2FnZUV4dGVybmFsOiB3cmFwRXZlbnQob25NZXNzYWdlV3JhcHBlcnMpLFxuICAgICAgICBzZW5kTWVzc2FnZTogd3JhcHBlZFNlbmRNZXNzYWdlLmJpbmQobnVsbCwgXCJzZW5kTWVzc2FnZVwiLCB7bWluQXJnczogMSwgbWF4QXJnczogM30pLFxuICAgICAgfSxcbiAgICAgIHRhYnM6IHtcbiAgICAgICAgc2VuZE1lc3NhZ2U6IHdyYXBwZWRTZW5kTWVzc2FnZS5iaW5kKG51bGwsIFwic2VuZE1lc3NhZ2VcIiwge21pbkFyZ3M6IDIsIG1heEFyZ3M6IDN9KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCBzZXR0aW5nTWV0YWRhdGEgPSB7XG4gICAgICBjbGVhcjoge21pbkFyZ3M6IDEsIG1heEFyZ3M6IDF9LFxuICAgICAgZ2V0OiB7bWluQXJnczogMSwgbWF4QXJnczogMX0sXG4gICAgICBzZXQ6IHttaW5BcmdzOiAxLCBtYXhBcmdzOiAxfSxcbiAgICB9O1xuICAgIGFwaU1ldGFkYXRhLnByaXZhY3kgPSB7XG4gICAgICBuZXR3b3JrOiB7XCIqXCI6IHNldHRpbmdNZXRhZGF0YX0sXG4gICAgICBzZXJ2aWNlczoge1wiKlwiOiBzZXR0aW5nTWV0YWRhdGF9LFxuICAgICAgd2Vic2l0ZXM6IHtcIipcIjogc2V0dGluZ01ldGFkYXRhfSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHdyYXBPYmplY3QoZXh0ZW5zaW9uQVBJcywgc3RhdGljV3JhcHBlcnMsIGFwaU1ldGFkYXRhKTtcbiAgfTtcblxuICAvLyBUaGUgYnVpbGQgcHJvY2VzcyBhZGRzIGEgVU1EIHdyYXBwZXIgYXJvdW5kIHRoaXMgZmlsZSwgd2hpY2ggbWFrZXMgdGhlXG4gIC8vIGBtb2R1bGVgIHZhcmlhYmxlIGF2YWlsYWJsZS5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3cmFwQVBJcyhjaHJvbWUpO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxUaGlzLmJyb3dzZXI7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9jb25zdGFudHNcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZXJyb3JcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZW52XCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2Zvcm1hdFwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9yb3V0aW5nXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3R5cGVzXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3ZhbGlkYXRvcnNcIiksIGV4cG9ydHMpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIixudWxsLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGlmICh0eXBlb2YgYiAhPT0gXCJmdW5jdGlvblwiICYmIGIgIT09IG51bGwpXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNsYXNzIGV4dGVuZHMgdmFsdWUgXCIgKyBTdHJpbmcoYikgKyBcIiBpcyBub3QgYSBjb25zdHJ1Y3RvciBvciBudWxsXCIpO1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgZGVzYyk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4oc3RhdGUsIHJlY2VpdmVyKSB7XHJcbiAgICBpZiAocmVjZWl2ZXIgPT09IG51bGwgfHwgKHR5cGVvZiByZWNlaXZlciAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcmVjZWl2ZXIgIT09IFwiZnVuY3Rpb25cIikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlICdpbicgb3BlcmF0b3Igb24gbm9uLW9iamVjdFwiKTtcclxuICAgIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNUQU5EQVJEX0VSUk9SX01BUCA9IGV4cG9ydHMuU0VSVkVSX0VSUk9SX0NPREVfUkFOR0UgPSBleHBvcnRzLlJFU0VSVkVEX0VSUk9SX0NPREVTID0gZXhwb3J0cy5TRVJWRVJfRVJST1IgPSBleHBvcnRzLklOVEVSTkFMX0VSUk9SID0gZXhwb3J0cy5JTlZBTElEX1BBUkFNUyA9IGV4cG9ydHMuTUVUSE9EX05PVF9GT1VORCA9IGV4cG9ydHMuSU5WQUxJRF9SRVFVRVNUID0gZXhwb3J0cy5QQVJTRV9FUlJPUiA9IHZvaWQgMDtcbmV4cG9ydHMuUEFSU0VfRVJST1IgPSBcIlBBUlNFX0VSUk9SXCI7XG5leHBvcnRzLklOVkFMSURfUkVRVUVTVCA9IFwiSU5WQUxJRF9SRVFVRVNUXCI7XG5leHBvcnRzLk1FVEhPRF9OT1RfRk9VTkQgPSBcIk1FVEhPRF9OT1RfRk9VTkRcIjtcbmV4cG9ydHMuSU5WQUxJRF9QQVJBTVMgPSBcIklOVkFMSURfUEFSQU1TXCI7XG5leHBvcnRzLklOVEVSTkFMX0VSUk9SID0gXCJJTlRFUk5BTF9FUlJPUlwiO1xuZXhwb3J0cy5TRVJWRVJfRVJST1IgPSBcIlNFUlZFUl9FUlJPUlwiO1xuZXhwb3J0cy5SRVNFUlZFRF9FUlJPUl9DT0RFUyA9IFstMzI3MDAsIC0zMjYwMCwgLTMyNjAxLCAtMzI2MDIsIC0zMjYwM107XG5leHBvcnRzLlNFUlZFUl9FUlJPUl9DT0RFX1JBTkdFID0gWy0zMjAwMCwgLTMyMDk5XTtcbmV4cG9ydHMuU1RBTkRBUkRfRVJST1JfTUFQID0ge1xuICAgIFtleHBvcnRzLlBBUlNFX0VSUk9SXTogeyBjb2RlOiAtMzI3MDAsIG1lc3NhZ2U6IFwiUGFyc2UgZXJyb3JcIiB9LFxuICAgIFtleHBvcnRzLklOVkFMSURfUkVRVUVTVF06IHsgY29kZTogLTMyNjAwLCBtZXNzYWdlOiBcIkludmFsaWQgUmVxdWVzdFwiIH0sXG4gICAgW2V4cG9ydHMuTUVUSE9EX05PVF9GT1VORF06IHsgY29kZTogLTMyNjAxLCBtZXNzYWdlOiBcIk1ldGhvZCBub3QgZm91bmRcIiB9LFxuICAgIFtleHBvcnRzLklOVkFMSURfUEFSQU1TXTogeyBjb2RlOiAtMzI2MDIsIG1lc3NhZ2U6IFwiSW52YWxpZCBwYXJhbXNcIiB9LFxuICAgIFtleHBvcnRzLklOVEVSTkFMX0VSUk9SXTogeyBjb2RlOiAtMzI2MDMsIG1lc3NhZ2U6IFwiSW50ZXJuYWwgZXJyb3JcIiB9LFxuICAgIFtleHBvcnRzLlNFUlZFUl9FUlJPUl06IHsgY29kZTogLTMyMDAwLCBtZXNzYWdlOiBcIlNlcnZlciBlcnJvclwiIH0sXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29uc3RhbnRzLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnZhbGlkYXRlSnNvblJwY0Vycm9yID0gZXhwb3J0cy5nZXRFcnJvckJ5Q29kZSA9IGV4cG9ydHMuZ2V0RXJyb3IgPSBleHBvcnRzLmlzVmFsaWRFcnJvckNvZGUgPSBleHBvcnRzLmlzUmVzZXJ2ZWRFcnJvckNvZGUgPSBleHBvcnRzLmlzU2VydmVyRXJyb3JDb2RlID0gdm9pZCAwO1xuY29uc3QgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5mdW5jdGlvbiBpc1NlcnZlckVycm9yQ29kZShjb2RlKSB7XG4gICAgcmV0dXJuIGNvZGUgPD0gY29uc3RhbnRzXzEuU0VSVkVSX0VSUk9SX0NPREVfUkFOR0VbMF0gJiYgY29kZSA+PSBjb25zdGFudHNfMS5TRVJWRVJfRVJST1JfQ09ERV9SQU5HRVsxXTtcbn1cbmV4cG9ydHMuaXNTZXJ2ZXJFcnJvckNvZGUgPSBpc1NlcnZlckVycm9yQ29kZTtcbmZ1bmN0aW9uIGlzUmVzZXJ2ZWRFcnJvckNvZGUoY29kZSkge1xuICAgIHJldHVybiBjb25zdGFudHNfMS5SRVNFUlZFRF9FUlJPUl9DT0RFUy5pbmNsdWRlcyhjb2RlKTtcbn1cbmV4cG9ydHMuaXNSZXNlcnZlZEVycm9yQ29kZSA9IGlzUmVzZXJ2ZWRFcnJvckNvZGU7XG5mdW5jdGlvbiBpc1ZhbGlkRXJyb3JDb2RlKGNvZGUpIHtcbiAgICByZXR1cm4gdHlwZW9mIGNvZGUgPT09IFwibnVtYmVyXCI7XG59XG5leHBvcnRzLmlzVmFsaWRFcnJvckNvZGUgPSBpc1ZhbGlkRXJyb3JDb2RlO1xuZnVuY3Rpb24gZ2V0RXJyb3IodHlwZSkge1xuICAgIGlmICghT2JqZWN0LmtleXMoY29uc3RhbnRzXzEuU1RBTkRBUkRfRVJST1JfTUFQKS5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICByZXR1cm4gY29uc3RhbnRzXzEuU1RBTkRBUkRfRVJST1JfTUFQW2NvbnN0YW50c18xLklOVEVSTkFMX0VSUk9SXTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnN0YW50c18xLlNUQU5EQVJEX0VSUk9SX01BUFt0eXBlXTtcbn1cbmV4cG9ydHMuZ2V0RXJyb3IgPSBnZXRFcnJvcjtcbmZ1bmN0aW9uIGdldEVycm9yQnlDb2RlKGNvZGUpIHtcbiAgICBjb25zdCBtYXRjaCA9IE9iamVjdC52YWx1ZXMoY29uc3RhbnRzXzEuU1RBTkRBUkRfRVJST1JfTUFQKS5maW5kKGUgPT4gZS5jb2RlID09PSBjb2RlKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJldHVybiBjb25zdGFudHNfMS5TVEFOREFSRF9FUlJPUl9NQVBbY29uc3RhbnRzXzEuSU5URVJOQUxfRVJST1JdO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG59XG5leHBvcnRzLmdldEVycm9yQnlDb2RlID0gZ2V0RXJyb3JCeUNvZGU7XG5mdW5jdGlvbiB2YWxpZGF0ZUpzb25ScGNFcnJvcihyZXNwb25zZSkge1xuICAgIGlmICh0eXBlb2YgcmVzcG9uc2UuZXJyb3IuY29kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIGVycm9yOiBcIk1pc3NpbmcgY29kZSBmb3IgSlNPTi1SUEMgZXJyb3JcIiB9O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHJlc3BvbnNlLmVycm9yLm1lc3NhZ2UgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogXCJNaXNzaW5nIG1lc3NhZ2UgZm9yIEpTT04tUlBDIGVycm9yXCIgfTtcbiAgICB9XG4gICAgaWYgKCFpc1ZhbGlkRXJyb3JDb2RlKHJlc3BvbnNlLmVycm9yLmNvZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWxpZDogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogYEludmFsaWQgZXJyb3IgY29kZSB0eXBlIGZvciBKU09OLVJQQzogJHtyZXNwb25zZS5lcnJvci5jb2RlfWAsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpc1Jlc2VydmVkRXJyb3JDb2RlKHJlc3BvbnNlLmVycm9yLmNvZGUpKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gZ2V0RXJyb3JCeUNvZGUocmVzcG9uc2UuZXJyb3IuY29kZSk7XG4gICAgICAgIGlmIChlcnJvci5tZXNzYWdlICE9PSBjb25zdGFudHNfMS5TVEFOREFSRF9FUlJPUl9NQVBbY29uc3RhbnRzXzEuSU5URVJOQUxfRVJST1JdLm1lc3NhZ2UgJiZcbiAgICAgICAgICAgIHJlc3BvbnNlLmVycm9yLm1lc3NhZ2UgPT09IGVycm9yLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBgSW52YWxpZCBlcnJvciBjb2RlIG1lc3NhZ2UgZm9yIEpTT04tUlBDOiAke3Jlc3BvbnNlLmVycm9yLmNvZGV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUgfTtcbn1cbmV4cG9ydHMudmFsaWRhdGVKc29uUnBjRXJyb3IgPSB2YWxpZGF0ZUpzb25ScGNFcnJvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVycm9yLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzTm9kZUpzID0gdm9pZCAwO1xuY29uc3QgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbmNvbnN0IGVudmlyb25tZW50XzEgPSByZXF1aXJlKFwiQHBlZHJvdWlkL2Vudmlyb25tZW50XCIpO1xuZXhwb3J0cy5pc05vZGVKcyA9IGVudmlyb25tZW50XzEuaXNOb2RlO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIkBwZWRyb3VpZC9lbnZpcm9ubWVudFwiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbnYuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2NyZWF0ZUJpbmRpbmcgPSAodGhpcyAmJiB0aGlzLl9fY3JlYXRlQmluZGluZykgfHwgKE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcbiAgICBvW2syXSA9IG1ba107XG59KSk7XG52YXIgX19leHBvcnRTdGFyID0gKHRoaXMgJiYgdGhpcy5fX2V4cG9ydFN0YXIpIHx8IGZ1bmN0aW9uKG0sIGV4cG9ydHMpIHtcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgX19jcmVhdGVCaW5kaW5nKGV4cG9ydHMsIG0sIHApO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9jcnlwdG9cIiksIGV4cG9ydHMpO1xuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2VudlwiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pc0Jyb3dzZXJDcnlwdG9BdmFpbGFibGUgPSBleHBvcnRzLmdldFN1YnRsZUNyeXB0byA9IGV4cG9ydHMuZ2V0QnJvd2VyQ3J5cHRvID0gdm9pZCAwO1xuZnVuY3Rpb24gZ2V0QnJvd2VyQ3J5cHRvKCkge1xuICAgIHJldHVybiAoZ2xvYmFsID09PSBudWxsIHx8IGdsb2JhbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogZ2xvYmFsLmNyeXB0bykgfHwgKGdsb2JhbCA9PT0gbnVsbCB8fCBnbG9iYWwgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGdsb2JhbC5tc0NyeXB0bykgfHwge307XG59XG5leHBvcnRzLmdldEJyb3dlckNyeXB0byA9IGdldEJyb3dlckNyeXB0bztcbmZ1bmN0aW9uIGdldFN1YnRsZUNyeXB0bygpIHtcbiAgICBjb25zdCBicm93c2VyQ3J5cHRvID0gZ2V0QnJvd2VyQ3J5cHRvKCk7XG4gICAgcmV0dXJuIGJyb3dzZXJDcnlwdG8uc3VidGxlIHx8IGJyb3dzZXJDcnlwdG8ud2Via2l0U3VidGxlO1xufVxuZXhwb3J0cy5nZXRTdWJ0bGVDcnlwdG8gPSBnZXRTdWJ0bGVDcnlwdG87XG5mdW5jdGlvbiBpc0Jyb3dzZXJDcnlwdG9BdmFpbGFibGUoKSB7XG4gICAgcmV0dXJuICEhZ2V0QnJvd2VyQ3J5cHRvKCkgJiYgISFnZXRTdWJ0bGVDcnlwdG8oKTtcbn1cbmV4cG9ydHMuaXNCcm93c2VyQ3J5cHRvQXZhaWxhYmxlID0gaXNCcm93c2VyQ3J5cHRvQXZhaWxhYmxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3J5cHRvLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzQnJvd3NlciA9IGV4cG9ydHMuaXNOb2RlID0gZXhwb3J0cy5pc1JlYWN0TmF0aXZlID0gdm9pZCAwO1xuZnVuY3Rpb24gaXNSZWFjdE5hdGl2ZSgpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgbmF2aWdhdG9yLnByb2R1Y3QgPT09ICdSZWFjdE5hdGl2ZScpO1xufVxuZXhwb3J0cy5pc1JlYWN0TmF0aXZlID0gaXNSZWFjdE5hdGl2ZTtcbmZ1bmN0aW9uIGlzTm9kZSgpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICB0eXBlb2YgcHJvY2Vzcy52ZXJzaW9ucyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdHlwZW9mIHByb2Nlc3MudmVyc2lvbnMubm9kZSAhPT0gJ3VuZGVmaW5lZCcpO1xufVxuZXhwb3J0cy5pc05vZGUgPSBpc05vZGU7XG5mdW5jdGlvbiBpc0Jyb3dzZXIoKSB7XG4gICAgcmV0dXJuICFpc1JlYWN0TmF0aXZlKCkgJiYgIWlzTm9kZSgpO1xufVxuZXhwb3J0cy5pc0Jyb3dzZXIgPSBpc0Jyb3dzZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbnYuanMubWFwIixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmZvcm1hdEVycm9yTWVzc2FnZSA9IGV4cG9ydHMuZm9ybWF0SnNvblJwY0Vycm9yID0gZXhwb3J0cy5mb3JtYXRKc29uUnBjUmVzdWx0ID0gZXhwb3J0cy5mb3JtYXRKc29uUnBjUmVxdWVzdCA9IGV4cG9ydHMucGF5bG9hZElkID0gdm9pZCAwO1xuY29uc3QgZXJyb3JfMSA9IHJlcXVpcmUoXCIuL2Vycm9yXCIpO1xuY29uc3QgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5mdW5jdGlvbiBwYXlsb2FkSWQoKSB7XG4gICAgY29uc3QgZGF0ZSA9IERhdGUubm93KCkgKiBNYXRoLnBvdygxMCwgMyk7XG4gICAgY29uc3QgZXh0cmEgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygxMCwgMykpO1xuICAgIHJldHVybiBkYXRlICsgZXh0cmE7XG59XG5leHBvcnRzLnBheWxvYWRJZCA9IHBheWxvYWRJZDtcbmZ1bmN0aW9uIGZvcm1hdEpzb25ScGNSZXF1ZXN0KG1ldGhvZCwgcGFyYW1zLCBpZCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBpZCB8fCBwYXlsb2FkSWQoKSxcbiAgICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICBwYXJhbXMsXG4gICAgfTtcbn1cbmV4cG9ydHMuZm9ybWF0SnNvblJwY1JlcXVlc3QgPSBmb3JtYXRKc29uUnBjUmVxdWVzdDtcbmZ1bmN0aW9uIGZvcm1hdEpzb25ScGNSZXN1bHQoaWQsIHJlc3VsdCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkLFxuICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxuICAgICAgICByZXN1bHQsXG4gICAgfTtcbn1cbmV4cG9ydHMuZm9ybWF0SnNvblJwY1Jlc3VsdCA9IGZvcm1hdEpzb25ScGNSZXN1bHQ7XG5mdW5jdGlvbiBmb3JtYXRKc29uUnBjRXJyb3IoaWQsIGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQsXG4gICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICAgIGVycm9yOiBmb3JtYXRFcnJvck1lc3NhZ2UoZXJyb3IpLFxuICAgIH07XG59XG5leHBvcnRzLmZvcm1hdEpzb25ScGNFcnJvciA9IGZvcm1hdEpzb25ScGNFcnJvcjtcbmZ1bmN0aW9uIGZvcm1hdEVycm9yTWVzc2FnZShlcnJvcikge1xuICAgIGlmICh0eXBlb2YgZXJyb3IgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIGVycm9yXzEuZ2V0RXJyb3IoY29uc3RhbnRzXzEuSU5URVJOQUxfRVJST1IpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVycm9yID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGVycm9yID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBlcnJvcl8xLmdldEVycm9yKGNvbnN0YW50c18xLlNFUlZFUl9FUlJPUikpLCB7IG1lc3NhZ2U6IGVycm9yIH0pO1xuICAgIH1cbiAgICBpZiAoZXJyb3JfMS5pc1Jlc2VydmVkRXJyb3JDb2RlKGVycm9yLmNvZGUpKSB7XG4gICAgICAgIGVycm9yID0gZXJyb3JfMS5nZXRFcnJvckJ5Q29kZShlcnJvci5jb2RlKTtcbiAgICB9XG4gICAgaWYgKCFlcnJvcl8xLmlzU2VydmVyRXJyb3JDb2RlKGVycm9yLmNvZGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIGNvZGUgaXMgbm90IGluIHNlcnZlciBjb2RlIHJhbmdlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gZXJyb3I7XG59XG5leHBvcnRzLmZvcm1hdEVycm9yTWVzc2FnZSA9IGZvcm1hdEVycm9yTWVzc2FnZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZvcm1hdC5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pc1ZhbGlkVHJhaWxpbmdXaWxkY2FyZFJvdXRlID0gZXhwb3J0cy5pc1ZhbGlkTGVhZGluZ1dpbGRjYXJkUm91dGUgPSBleHBvcnRzLmlzVmFsaWRXaWxkY2FyZFJvdXRlID0gZXhwb3J0cy5pc1ZhbGlkRGVmYXVsdFJvdXRlID0gZXhwb3J0cy5pc1ZhbGlkUm91dGUgPSB2b2lkIDA7XG5mdW5jdGlvbiBpc1ZhbGlkUm91dGUocm91dGUpIHtcbiAgICBpZiAocm91dGUuaW5jbHVkZXMoXCIqXCIpKSB7XG4gICAgICAgIHJldHVybiBpc1ZhbGlkV2lsZGNhcmRSb3V0ZShyb3V0ZSk7XG4gICAgfVxuICAgIGlmICgvXFxXL2cudGVzdChyb3V0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydHMuaXNWYWxpZFJvdXRlID0gaXNWYWxpZFJvdXRlO1xuZnVuY3Rpb24gaXNWYWxpZERlZmF1bHRSb3V0ZShyb3V0ZSkge1xuICAgIHJldHVybiByb3V0ZSA9PT0gXCIqXCI7XG59XG5leHBvcnRzLmlzVmFsaWREZWZhdWx0Um91dGUgPSBpc1ZhbGlkRGVmYXVsdFJvdXRlO1xuZnVuY3Rpb24gaXNWYWxpZFdpbGRjYXJkUm91dGUocm91dGUpIHtcbiAgICBpZiAoaXNWYWxpZERlZmF1bHRSb3V0ZShyb3V0ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICghcm91dGUuaW5jbHVkZXMoXCIqXCIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHJvdXRlLnNwbGl0KFwiKlwiKS5sZW5ndGggIT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAocm91dGUuc3BsaXQoXCIqXCIpLmZpbHRlcih4ID0+IHgudHJpbSgpID09PSBcIlwiKS5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydHMuaXNWYWxpZFdpbGRjYXJkUm91dGUgPSBpc1ZhbGlkV2lsZGNhcmRSb3V0ZTtcbmZ1bmN0aW9uIGlzVmFsaWRMZWFkaW5nV2lsZGNhcmRSb3V0ZShyb3V0ZSkge1xuICAgIHJldHVybiAhaXNWYWxpZERlZmF1bHRSb3V0ZShyb3V0ZSkgJiYgaXNWYWxpZFdpbGRjYXJkUm91dGUocm91dGUpICYmICFyb3V0ZS5zcGxpdChcIipcIilbMF0udHJpbSgpO1xufVxuZXhwb3J0cy5pc1ZhbGlkTGVhZGluZ1dpbGRjYXJkUm91dGUgPSBpc1ZhbGlkTGVhZGluZ1dpbGRjYXJkUm91dGU7XG5mdW5jdGlvbiBpc1ZhbGlkVHJhaWxpbmdXaWxkY2FyZFJvdXRlKHJvdXRlKSB7XG4gICAgcmV0dXJuICFpc1ZhbGlkRGVmYXVsdFJvdXRlKHJvdXRlKSAmJiBpc1ZhbGlkV2lsZGNhcmRSb3V0ZShyb3V0ZSkgJiYgIXJvdXRlLnNwbGl0KFwiKlwiKVsxXS50cmltKCk7XG59XG5leHBvcnRzLmlzVmFsaWRUcmFpbGluZ1dpbGRjYXJkUm91dGUgPSBpc1ZhbGlkVHJhaWxpbmdXaWxkY2FyZFJvdXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cm91dGluZy5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCJAanNvbi1ycGMtdG9vbHMvdHlwZXNcIiksIGV4cG9ydHMpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHlwZXMuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9ibG9ja2NoYWluXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2pzb25ycGNcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vbWlzY1wiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9tdWx0aVwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9wcm92aWRlclwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9yb3V0ZXJcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vc2NoZW1hXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3ZhbGlkYXRvclwiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JQmxvY2tjaGFpblByb3ZpZGVyID0gZXhwb3J0cy5JQmxvY2tjaGFpbkF1dGhlbnRpY2F0b3IgPSBleHBvcnRzLklQZW5kaW5nUmVxdWVzdHMgPSB2b2lkIDA7XG5jb25zdCBtaXNjXzEgPSByZXF1aXJlKFwiLi9taXNjXCIpO1xuY29uc3QgcHJvdmlkZXJfMSA9IHJlcXVpcmUoXCIuL3Byb3ZpZGVyXCIpO1xuY2xhc3MgSVBlbmRpbmdSZXF1ZXN0cyB7XG4gICAgY29uc3RydWN0b3Ioc3RvcmFnZSkge1xuICAgICAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICAgIH1cbn1cbmV4cG9ydHMuSVBlbmRpbmdSZXF1ZXN0cyA9IElQZW5kaW5nUmVxdWVzdHM7XG5jbGFzcyBJQmxvY2tjaGFpbkF1dGhlbnRpY2F0b3IgZXh0ZW5kcyBtaXNjXzEuSUV2ZW50cyB7XG4gICAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIH1cbn1cbmV4cG9ydHMuSUJsb2NrY2hhaW5BdXRoZW50aWNhdG9yID0gSUJsb2NrY2hhaW5BdXRoZW50aWNhdG9yO1xuY2xhc3MgSUJsb2NrY2hhaW5Qcm92aWRlciBleHRlbmRzIHByb3ZpZGVyXzEuSUpzb25ScGNQcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbiwgY29uZmlnKSB7XG4gICAgICAgIHN1cGVyKGNvbm5lY3Rpb24pO1xuICAgIH1cbn1cbmV4cG9ydHMuSUJsb2NrY2hhaW5Qcm92aWRlciA9IElCbG9ja2NoYWluUHJvdmlkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1ibG9ja2NoYWluLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklFdmVudHMgPSB2b2lkIDA7XG5jbGFzcyBJRXZlbnRzIHtcbn1cbmV4cG9ydHMuSUV2ZW50cyA9IElFdmVudHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1taXNjLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklKc29uUnBjUHJvdmlkZXIgPSBleHBvcnRzLklCYXNlSnNvblJwY1Byb3ZpZGVyID0gZXhwb3J0cy5JSnNvblJwY0Nvbm5lY3Rpb24gPSB2b2lkIDA7XG5jb25zdCBtaXNjXzEgPSByZXF1aXJlKFwiLi9taXNjXCIpO1xuY2xhc3MgSUpzb25ScGNDb25uZWN0aW9uIGV4dGVuZHMgbWlzY18xLklFdmVudHMge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLklKc29uUnBjQ29ubmVjdGlvbiA9IElKc29uUnBjQ29ubmVjdGlvbjtcbmNsYXNzIElCYXNlSnNvblJwY1Byb3ZpZGVyIGV4dGVuZHMgbWlzY18xLklFdmVudHMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuSUJhc2VKc29uUnBjUHJvdmlkZXIgPSBJQmFzZUpzb25ScGNQcm92aWRlcjtcbmNsYXNzIElKc29uUnBjUHJvdmlkZXIgZXh0ZW5kcyBJQmFzZUpzb25ScGNQcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuSUpzb25ScGNQcm92aWRlciA9IElKc29uUnBjUHJvdmlkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm92aWRlci5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9anNvbnJwYy5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JTXVsdGlTZXJ2aWNlUHJvdmlkZXIgPSB2b2lkIDA7XG5jb25zdCBwcm92aWRlcl8xID0gcmVxdWlyZShcIi4vcHJvdmlkZXJcIik7XG5jbGFzcyBJTXVsdGlTZXJ2aWNlUHJvdmlkZXIgZXh0ZW5kcyBwcm92aWRlcl8xLklCYXNlSnNvblJwY1Byb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgfVxufVxuZXhwb3J0cy5JTXVsdGlTZXJ2aWNlUHJvdmlkZXIgPSBJTXVsdGlTZXJ2aWNlUHJvdmlkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tdWx0aS5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JSnNvblJwY1JvdXRlciA9IHZvaWQgMDtcbmNsYXNzIElKc29uUnBjUm91dGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihyb3V0ZXMpIHtcbiAgICAgICAgdGhpcy5yb3V0ZXMgPSByb3V0ZXM7XG4gICAgfVxufVxuZXhwb3J0cy5JSnNvblJwY1JvdXRlciA9IElKc29uUnBjUm91dGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cm91dGVyLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zY2hlbWEuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSUpzb25ScGNWYWxpZGF0b3IgPSB2b2lkIDA7XG5jbGFzcyBJSnNvblJwY1ZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3Ioc2NoZW1hcykge1xuICAgICAgICB0aGlzLnNjaGVtYXMgPSBzY2hlbWFzO1xuICAgIH1cbn1cbmV4cG9ydHMuSUpzb25ScGNWYWxpZGF0b3IgPSBJSnNvblJwY1ZhbGlkYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZhbGlkYXRvci5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pc0pzb25ScGNWYWxpZGF0aW9uSW52YWxpZCA9IGV4cG9ydHMuaXNKc29uUnBjRXJyb3IgPSBleHBvcnRzLmlzSnNvblJwY1Jlc3VsdCA9IGV4cG9ydHMuaXNKc29uUnBjUmVzcG9uc2UgPSBleHBvcnRzLmlzSnNvblJwY1JlcXVlc3QgPSBleHBvcnRzLmlzSnNvblJwY1BheWxvYWQgPSB2b2lkIDA7XG5mdW5jdGlvbiBpc0pzb25ScGNQYXlsb2FkKHBheWxvYWQpIHtcbiAgICByZXR1cm4gXCJpZFwiIGluIHBheWxvYWQgJiYgXCJqc29ucnBjXCIgaW4gcGF5bG9hZCAmJiBwYXlsb2FkLmpzb25ycGMgPT09IFwiMi4wXCI7XG59XG5leHBvcnRzLmlzSnNvblJwY1BheWxvYWQgPSBpc0pzb25ScGNQYXlsb2FkO1xuZnVuY3Rpb24gaXNKc29uUnBjUmVxdWVzdChwYXlsb2FkKSB7XG4gICAgcmV0dXJuIGlzSnNvblJwY1BheWxvYWQocGF5bG9hZCkgJiYgXCJtZXRob2RcIiBpbiBwYXlsb2FkO1xufVxuZXhwb3J0cy5pc0pzb25ScGNSZXF1ZXN0ID0gaXNKc29uUnBjUmVxdWVzdDtcbmZ1bmN0aW9uIGlzSnNvblJwY1Jlc3BvbnNlKHBheWxvYWQpIHtcbiAgICByZXR1cm4gaXNKc29uUnBjUGF5bG9hZChwYXlsb2FkKSAmJiAoaXNKc29uUnBjUmVzdWx0KHBheWxvYWQpIHx8IGlzSnNvblJwY0Vycm9yKHBheWxvYWQpKTtcbn1cbmV4cG9ydHMuaXNKc29uUnBjUmVzcG9uc2UgPSBpc0pzb25ScGNSZXNwb25zZTtcbmZ1bmN0aW9uIGlzSnNvblJwY1Jlc3VsdChwYXlsb2FkKSB7XG4gICAgcmV0dXJuIFwicmVzdWx0XCIgaW4gcGF5bG9hZDtcbn1cbmV4cG9ydHMuaXNKc29uUnBjUmVzdWx0ID0gaXNKc29uUnBjUmVzdWx0O1xuZnVuY3Rpb24gaXNKc29uUnBjRXJyb3IocGF5bG9hZCkge1xuICAgIHJldHVybiBcImVycm9yXCIgaW4gcGF5bG9hZDtcbn1cbmV4cG9ydHMuaXNKc29uUnBjRXJyb3IgPSBpc0pzb25ScGNFcnJvcjtcbmZ1bmN0aW9uIGlzSnNvblJwY1ZhbGlkYXRpb25JbnZhbGlkKHZhbGlkYXRpb24pIHtcbiAgICByZXR1cm4gXCJlcnJvclwiIGluIHZhbGlkYXRpb24gJiYgdmFsaWRhdGlvbi52YWxpZCA9PT0gZmFsc2U7XG59XG5leHBvcnRzLmlzSnNvblJwY1ZhbGlkYXRpb25JbnZhbGlkID0gaXNKc29uUnBjVmFsaWRhdGlvbkludmFsaWQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12YWxpZGF0b3JzLmpzLm1hcCIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSBcIjFlMTkwODI1YmFjZmNjMTZcIjsiXSwibmFtZXMiOlsiZ2xvYmFsVGhpcyIsImNocm9tZSIsInJ1bnRpbWUiLCJpZCIsIkVycm9yIiwiYnJvd3NlciIsIk9iamVjdCIsImdldFByb3RvdHlwZU9mIiwicHJvdG90eXBlIiwiQ0hST01FX1NFTkRfTUVTU0FHRV9DQUxMQkFDS19OT19SRVNQT05TRV9NRVNTQUdFIiwid3JhcEFQSXMiLCJleHRlbnNpb25BUElzIiwiYXBpTWV0YWRhdGEiLCJrZXlzIiwibGVuZ3RoIiwiRGVmYXVsdFdlYWtNYXAiLCJXZWFrTWFwIiwiY29uc3RydWN0b3IiLCJjcmVhdGVJdGVtIiwiaXRlbXMiLCJ1bmRlZmluZWQiLCJnZXQiLCJrZXkiLCJoYXMiLCJzZXQiLCJpc1RoZW5hYmxlIiwidmFsdWUiLCJ0aGVuIiwibWFrZUNhbGxiYWNrIiwicHJvbWlzZSIsIm1ldGFkYXRhIiwiY2FsbGJhY2tBcmdzIiwibGFzdEVycm9yIiwicmVqZWN0IiwibWVzc2FnZSIsInNpbmdsZUNhbGxiYWNrQXJnIiwicmVzb2x2ZSIsInBsdXJhbGl6ZUFyZ3VtZW50cyIsIm51bUFyZ3MiLCJ3cmFwQXN5bmNGdW5jdGlvbiIsIm5hbWUiLCJhc3luY0Z1bmN0aW9uV3JhcHBlciIsInRhcmdldCIsImFyZ3MiLCJtaW5BcmdzIiwibWF4QXJncyIsIlByb21pc2UiLCJmYWxsYmFja1RvTm9DYWxsYmFjayIsImNiRXJyb3IiLCJjb25zb2xlIiwid2FybiIsIm5vQ2FsbGJhY2siLCJ3cmFwTWV0aG9kIiwibWV0aG9kIiwid3JhcHBlciIsIlByb3h5IiwiYXBwbHkiLCJ0YXJnZXRNZXRob2QiLCJ0aGlzT2JqIiwiY2FsbCIsImhhc093blByb3BlcnR5IiwiRnVuY3Rpb24iLCJiaW5kIiwid3JhcE9iamVjdCIsIndyYXBwZXJzIiwiY2FjaGUiLCJjcmVhdGUiLCJoYW5kbGVycyIsInByb3h5VGFyZ2V0IiwicHJvcCIsInJlY2VpdmVyIiwiZGVmaW5lUHJvcGVydHkiLCJjb25maWd1cmFibGUiLCJlbnVtZXJhYmxlIiwiZGVzYyIsIlJlZmxlY3QiLCJkZWxldGVQcm9wZXJ0eSIsIndyYXBFdmVudCIsIndyYXBwZXJNYXAiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiaGFzTGlzdGVuZXIiLCJyZW1vdmVMaXN0ZW5lciIsIm9uUmVxdWVzdEZpbmlzaGVkV3JhcHBlcnMiLCJvblJlcXVlc3RGaW5pc2hlZCIsInJlcSIsIndyYXBwZWRSZXEiLCJnZXRDb250ZW50Iiwib25NZXNzYWdlV3JhcHBlcnMiLCJvbk1lc3NhZ2UiLCJzZW5kZXIiLCJzZW5kUmVzcG9uc2UiLCJkaWRDYWxsU2VuZFJlc3BvbnNlIiwid3JhcHBlZFNlbmRSZXNwb25zZSIsInNlbmRSZXNwb25zZVByb21pc2UiLCJyZXNwb25zZSIsInJlc3VsdCIsImVyciIsImlzUmVzdWx0VGhlbmFibGUiLCJzZW5kUHJvbWlzZWRSZXN1bHQiLCJtc2ciLCJlcnJvciIsIl9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXyIsImNhdGNoIiwid3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2siLCJyZXBseSIsIndyYXBwZWRTZW5kTWVzc2FnZSIsImFwaU5hbWVzcGFjZU9iaiIsIndyYXBwZWRDYiIsInB1c2giLCJzZW5kTWVzc2FnZSIsInN0YXRpY1dyYXBwZXJzIiwiZGV2dG9vbHMiLCJuZXR3b3JrIiwib25NZXNzYWdlRXh0ZXJuYWwiLCJ0YWJzIiwic2V0dGluZ01ldGFkYXRhIiwiY2xlYXIiLCJwcml2YWN5Iiwic2VydmljZXMiLCJ3ZWJzaXRlcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwidmVyc2lvbiI6MywiZmlsZSI6ImNvbnRlbnQtc2NyaXB0LjNkYTJhZTE3LmpzLm1hcCJ9
