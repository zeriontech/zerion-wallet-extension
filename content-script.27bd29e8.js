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
})({"cCMa2":[function(require,module,exports) {
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

},{"nanoid":"j9TCy","webextension-polyfill":"Zel51","@json-rpc-tools/utils":"czhHe","bundle-text:./in-page":"dKBth","@parcel/transformer-js/src/esmodule-helpers.js":"4IpBY"}],"j9TCy":[function(require,module,exports) {
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

},{"./url-alphabet/index.js":false,"@parcel/transformer-js/src/esmodule-helpers.js":"4IpBY"}],"4IpBY":[function(require,module,exports) {
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

},{}],"Zel51":[function(require,module,exports) {
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
    var ref, ref1;
    if (!((ref = globalThis.chrome) === null || ref === void 0 ? void 0 : (ref1 = ref.runtime) === null || ref1 === void 0 ? void 0 : ref1.id)) throw new Error("This script should only be loaded in a browser extension.");
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
                get(key) {
                    if (!this.has(key)) this.set(key, this.createItem(key));
                    return super.get(key);
                }
                constructor(createItem, items){
                    super(items);
                    this.createItem = createItem;
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

},{}],"czhHe":[function(require,module,exports) {
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

},{"tslib":"DcZ3h","./constants":"9opxc","./error":"9Rx3M","./env":"dLiib","./format":"86ZxU","./routing":"6a2JO","./types":"9ODHo","./validators":"3i44x"}],"DcZ3h":[function(require,module,exports) {
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

},{"@parcel/transformer-js/src/esmodule-helpers.js":"4IpBY"}],"9opxc":[function(require,module,exports) {
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

},{}],"9Rx3M":[function(require,module,exports) {
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

},{"./constants":"9opxc"}],"dLiib":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isNodeJs = void 0;
const tslib_1 = require("tslib");
const environment_1 = require("@pedrouid/environment");
exports.isNodeJs = environment_1.isNode;
tslib_1.__exportStar(require("@pedrouid/environment"), exports);

},{"tslib":"DcZ3h","@pedrouid/environment":"58QAW"}],"58QAW":[function(require,module,exports) {
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

},{"./crypto":"e2TkY","./env":"jkj2L"}],"e2TkY":[function(require,module,exports) {
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

},{}],"jkj2L":[function(require,module,exports) {
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

},{"process":"aND2C"}],"aND2C":[function(require,module,exports) {
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

},{}],"86ZxU":[function(require,module,exports) {
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

},{"./error":"9Rx3M","./constants":"9opxc"}],"6a2JO":[function(require,module,exports) {
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

},{}],"9ODHo":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("@json-rpc-tools/types"), exports);

},{"tslib":"DcZ3h","@json-rpc-tools/types":"a9nDl"}],"a9nDl":[function(require,module,exports) {
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

},{"tslib":"DcZ3h","./blockchain":"goDQV","./jsonrpc":"kJnPN","./misc":"g7PF1","./multi":"6Ja1n","./provider":"j5yIg","./router":"alJJY","./schema":"9LXo0","./validator":"4EbwN"}],"goDQV":[function(require,module,exports) {
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

},{"./misc":"g7PF1","./provider":"j5yIg"}],"g7PF1":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IEvents = void 0;
class IEvents {
}
exports.IEvents = IEvents;

},{}],"j5yIg":[function(require,module,exports) {
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

},{"./misc":"g7PF1"}],"kJnPN":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{}],"6Ja1n":[function(require,module,exports) {
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

},{"./provider":"j5yIg"}],"alJJY":[function(require,module,exports) {
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

},{}],"9LXo0":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{}],"4EbwN":[function(require,module,exports) {
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

},{}],"3i44x":[function(require,module,exports) {
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

},{}],"dKBth":[function(require,module,exports) {
module.exports = "// modules are defined as an array\n// [ module function, map of requires ]\n//\n// map of requires is short require name -> numeric require\n//\n// anything defined in a previous bundle is accessed via the\n// orig method which is the require for previous bundles\n\n(function (modules, entry, mainEntry, parcelRequireName, globalName) {\n  /* eslint-disable no-undef */\n  var globalObject =\n    typeof globalThis !== 'undefined'\n      ? globalThis\n      : typeof self !== 'undefined'\n      ? self\n      : typeof window !== 'undefined'\n      ? window\n      : typeof global !== 'undefined'\n      ? global\n      : {};\n  /* eslint-enable no-undef */\n\n  // Save the require from previous bundle to this closure if any\n  var previousRequire =\n    typeof globalObject[parcelRequireName] === 'function' &&\n    globalObject[parcelRequireName];\n\n  var cache = previousRequire.cache || {};\n  // Do not use `require` to prevent Webpack from trying to bundle this call\n  var nodeRequire =\n    typeof module !== 'undefined' &&\n    typeof module.require === 'function' &&\n    module.require.bind(module);\n\n  function newRequire(name, jumped) {\n    if (!cache[name]) {\n      if (!modules[name]) {\n        // if we cannot find the module within our internal map or\n        // cache jump to the current global require ie. the last bundle\n        // that was added to the page.\n        var currentRequire =\n          typeof globalObject[parcelRequireName] === 'function' &&\n          globalObject[parcelRequireName];\n        if (!jumped && currentRequire) {\n          return currentRequire(name, true);\n        }\n\n        // If there are other bundles on this page the require from the\n        // previous one is saved to 'previousRequire'. Repeat this as\n        // many times as there are bundles until the module is found or\n        // we exhaust the require chain.\n        if (previousRequire) {\n          return previousRequire(name, true);\n        }\n\n        // Try the node require function if it exists.\n        if (nodeRequire && typeof name === 'string') {\n          return nodeRequire(name);\n        }\n\n        var err = new Error(\"Cannot find module '\" + name + \"'\");\n        err.code = 'MODULE_NOT_FOUND';\n        throw err;\n      }\n\n      localRequire.resolve = resolve;\n      localRequire.cache = {};\n\n      var module = (cache[name] = new newRequire.Module(name));\n\n      modules[name][0].call(\n        module.exports,\n        localRequire,\n        module,\n        module.exports,\n        this\n      );\n    }\n\n    return cache[name].exports;\n\n    function localRequire(x) {\n      var res = localRequire.resolve(x);\n      return res === false ? {} : newRequire(res);\n    }\n\n    function resolve(x) {\n      var id = modules[name][1][x];\n      return id != null ? id : x;\n    }\n  }\n\n  function Module(moduleName) {\n    this.id = moduleName;\n    this.bundle = newRequire;\n    this.exports = {};\n  }\n\n  newRequire.isParcelRequire = true;\n  newRequire.Module = Module;\n  newRequire.modules = modules;\n  newRequire.cache = cache;\n  newRequire.parent = previousRequire;\n  newRequire.register = function (id, exports) {\n    modules[id] = [\n      function (require, module) {\n        module.exports = exports;\n      },\n      {},\n    ];\n  };\n\n  Object.defineProperty(newRequire, 'root', {\n    get: function () {\n      return globalObject[parcelRequireName];\n    },\n  });\n\n  globalObject[parcelRequireName] = newRequire;\n\n  for (var i = 0; i < entry.length; i++) {\n    newRequire(entry[i]);\n  }\n\n  if (mainEntry) {\n    // Expose entry point to Node, AMD or browser globals\n    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js\n    var mainExports = newRequire(mainEntry);\n\n    // CommonJS\n    if (typeof exports === 'object' && typeof module !== 'undefined') {\n      module.exports = mainExports;\n\n      // RequireJS\n    } else if (typeof define === 'function' && define.amd) {\n      define(function () {\n        return mainExports;\n      });\n\n      // <script>\n    } else if (globalName) {\n      this[globalName] = mainExports;\n    }\n  }\n})({\"cxqj5\":[function(require,module,exports) {\nvar _provider = require(\"src/modules/ethereum/provider\");\nvar _connection = require(\"src/modules/ethereum/connection\");\nvar _walletNameFlag = require(\"src/shared/types/WalletNameFlag\");\nconst broadcastChannel = new BroadcastChannel(window.myWalletChannelId);\nconst connection = new (0, _connection.Connection)(broadcastChannel);\nconst provider = new (0, _provider.EthereumProvider)(connection);\nprovider.connect();\nwindow.ethereum = provider;\n// TODO:\n// Expose other providers similar to how coinbase wallet extension does it:\n// https://docs.cloud.coinbase.com/wallet-sdk/docs/injected-provider-guidance\nconst otherProviders = new Set();\nObject.defineProperty(window, \"ethereum\", {\n    configurable: false,\n    get () {\n        return provider;\n    },\n    set (value) {\n        otherProviders.add(value);\n    }\n});\nprovider.request({\n    method: \"wallet_getWalletNameFlags\"\n}).then((result)=>{\n    if (result.includes((0, _walletNameFlag.WalletNameFlag).isMetaMask)) provider.isMetaMask = true;\n});\nwindow.zerionWallet = provider;\n\n},{\"src/modules/ethereum/provider\":\"cwjvt\",\"src/modules/ethereum/connection\":\"5utHt\",\"src/shared/types/WalletNameFlag\":\"aQWhl\"}],\"cwjvt\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"EthereumProvider\", ()=>EthereumProvider);\nvar _definePropertyJs = require(\"@swc/helpers/lib/_define_property.js\");\nvar _definePropertyJsDefault = parcelHelpers.interopDefault(_definePropertyJs);\nvar _provider = require(\"@json-rpc-tools/provider\");\nvar _utils = require(\"@json-rpc-tools/utils\");\nvar _walletNameFlag = require(\"src/shared/types/WalletNameFlag\");\nfunction accountsEquals(arr1, arr2) {\n    // it's okay to perform search like this because `accounts`\n    // always has at most one element\n    return arr1.length === arr2.length && arr1.every((item)=>arr2.includes(item));\n}\nasync function fetchInitialState(connection) {\n    return Promise.all([\n        connection.send((0, _utils.formatJsonRpcRequest)(\"eth_chainId\", [])),\n        connection.send((0, _utils.formatJsonRpcRequest)(\"eth_accounts\", [])),\n        connection.send((0, _utils.formatJsonRpcRequest)(\"wallet_getWalletNameFlags\", [])), \n    ]).then(([chainId, accounts, walletNameFlags])=>({\n            chainId,\n            accounts,\n            walletNameFlags\n        }));\n}\nfunction updateChainId(self, chainId) {\n    self.chainId = chainId;\n    self.networkVersion = String(parseInt(chainId, 16));\n}\nclass EthereumProvider extends (0, _provider.JsonRpcProvider) {\n    on(event, listener) {\n        super.on(event, listener);\n        return this;\n    }\n    async _prepareState() {\n        return fetchInitialState(this.connection).then(({ chainId , accounts , walletNameFlags  })=>{\n            updateChainId(this, chainId);\n            this.accounts = accounts;\n            if (walletNameFlags.includes((0, _walletNameFlag.WalletNameFlag).isMetaMask)) {\n                console.log(\"is metamask in _prepareState\");\n                this.isMetaMask = true;\n            }\n        });\n    }\n    async request(request, context) {\n        if (request.method === \"eth_chainId\") return Promise.resolve(this.chainId);\n        if (request.method === \"eth_accounts\") return Promise.resolve(this.accounts);\n        return this._getRequestPromise((0, _utils.formatJsonRpcRequest)(request.method, request.params || []), context);\n    }\n    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    async _getRequestPromise(request, _context // eslint-disable-line @typescript-eslint/no-explicit-any\n    ) {\n        if (!this.connection.connected) await this.open();\n        return new Promise((resolve, reject)=>{\n            this.events.once(`${request.id}`, (response)=>{\n                if ((0, _utils.isJsonRpcError)(response)) reject(response.error);\n                else resolve(response.result);\n            });\n            this.connection.send(request);\n        });\n    }\n    shimLegacy() {\n        const legacyMethods = [\n            [\n                \"enable\",\n                \"eth_requestAccounts\"\n            ],\n            [\n                \"net_version\",\n                \"net_version\"\n            ], \n        ];\n        for (const [_method, method] of legacyMethods)// @ts-ignore\n        this[_method] = ()=>this.request({\n                method\n            });\n    }\n    isConnected() {\n        return this.connection.connected;\n    }\n    async _internalOpen(connection) {\n        if (this.connection === connection && this.connection.connected) return;\n        if (this.connection.connected) this.close();\n        this.connection = connection; // this.setConnection();\n        await Promise.all([\n            this.connection.open(),\n            this._prepareState()\n        ]);\n        this.connection.on(\"payload\", (payload)=>this.onPayload(payload));\n        this.connection.on(\"close\", ()=>{\n            this.events.emit(\"disconnect\");\n        });\n        this.events.emit(\"connect\", {\n            chainId: this.chainId\n        });\n    }\n    open(connection = this.connection) {\n        if (!this._openPromise) this._openPromise = this._internalOpen(connection);\n        return this._openPromise;\n    }\n    constructor(connection){\n        super(connection);\n        (0, _definePropertyJsDefault.default)(this, \"isZerionWallet\", true);\n        (0, _definePropertyJsDefault.default)(this, \"_openPromise\", null);\n        // Taken from Rabby\n        // shim to matamask legacy api\n        (0, _definePropertyJsDefault.default)(this, \"sendAsync\", (payload, callback)=>{\n            if (Array.isArray(payload)) return Promise.all(payload.map((item)=>new Promise((resolve)=>{\n                    this.sendAsync(item, (_err, res)=>{\n                        // ignore error\n                        resolve(res);\n                    });\n                }))).then((result)=>callback(null, result));\n            const { method , params , ...rest } = payload;\n            this.request({\n                method,\n                params\n            }).then((result)=>callback(null, {\n                    ...rest,\n                    method,\n                    result\n                })).catch((error)=>callback(error, {\n                    ...rest,\n                    method,\n                    error\n                }));\n        });\n        this.connection = connection;\n        this.shimLegacy();\n        this.chainId = \"0x1\";\n        this.networkVersion = \"1\";\n        this.accounts = [];\n        connection.on(\"ethereumEvent\", ({ event , value  })=>{\n            if (event === \"chainChanged\" && typeof value === \"string\") {\n                if (value === this.chainId) return;\n                updateChainId(this, value);\n            }\n            if (event === \"accountsChanged\" && Array.isArray(value)) {\n                // it's okay to perform search like this because `this.accounts`\n                // always has at most one element\n                if (accountsEquals(value, this.accounts)) // Do not emit accountChanged because value hasn't changed\n                return;\n                else this.accounts = value;\n            }\n            this.events.emit(event, value);\n        });\n        this.open();\n    }\n}\n\n},{\"@swc/helpers/lib/_define_property.js\":\"kkblX\",\"@json-rpc-tools/provider\":\"5xXP8\",\"@json-rpc-tools/utils\":\"czhHe\",\"src/shared/types/WalletNameFlag\":\"aQWhl\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"4IpBY\"}],\"kkblX\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.default = _defineProperty;\nfunction _defineProperty(obj, key, value) {\n    if (key in obj) Object.defineProperty(obj, key, {\n        value: value,\n        enumerable: true,\n        configurable: true,\n        writable: true\n    });\n    else obj[key] = value;\n    return obj;\n}\n\n},{}],\"5xXP8\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\nconst provider_1 = tslib_1.__importDefault(require(\"./provider\"));\ntslib_1.__exportStar(require(\"./http\"), exports);\ntslib_1.__exportStar(require(\"./ws\"), exports);\ntslib_1.__exportStar(require(\"./provider\"), exports);\nexports.default = provider_1.default;\n\n},{\"tslib\":\"DcZ3h\",\"./provider\":\"gDaEX\",\"./http\":\"5R8Jc\",\"./ws\":\"a55sm\"}],\"DcZ3h\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"__extends\", ()=>__extends);\nparcelHelpers.export(exports, \"__assign\", ()=>__assign);\nparcelHelpers.export(exports, \"__rest\", ()=>__rest);\nparcelHelpers.export(exports, \"__decorate\", ()=>__decorate);\nparcelHelpers.export(exports, \"__param\", ()=>__param);\nparcelHelpers.export(exports, \"__metadata\", ()=>__metadata);\nparcelHelpers.export(exports, \"__awaiter\", ()=>__awaiter);\nparcelHelpers.export(exports, \"__generator\", ()=>__generator);\nparcelHelpers.export(exports, \"__createBinding\", ()=>__createBinding);\nparcelHelpers.export(exports, \"__exportStar\", ()=>__exportStar);\nparcelHelpers.export(exports, \"__values\", ()=>__values);\nparcelHelpers.export(exports, \"__read\", ()=>__read);\n/** @deprecated */ parcelHelpers.export(exports, \"__spread\", ()=>__spread);\n/** @deprecated */ parcelHelpers.export(exports, \"__spreadArrays\", ()=>__spreadArrays);\nparcelHelpers.export(exports, \"__spreadArray\", ()=>__spreadArray);\nparcelHelpers.export(exports, \"__await\", ()=>__await);\nparcelHelpers.export(exports, \"__asyncGenerator\", ()=>__asyncGenerator);\nparcelHelpers.export(exports, \"__asyncDelegator\", ()=>__asyncDelegator);\nparcelHelpers.export(exports, \"__asyncValues\", ()=>__asyncValues);\nparcelHelpers.export(exports, \"__makeTemplateObject\", ()=>__makeTemplateObject);\nparcelHelpers.export(exports, \"__importStar\", ()=>__importStar);\nparcelHelpers.export(exports, \"__importDefault\", ()=>__importDefault);\nparcelHelpers.export(exports, \"__classPrivateFieldGet\", ()=>__classPrivateFieldGet);\nparcelHelpers.export(exports, \"__classPrivateFieldSet\", ()=>__classPrivateFieldSet);\nparcelHelpers.export(exports, \"__classPrivateFieldIn\", ()=>__classPrivateFieldIn);\n/******************************************************************************\r\nCopyright (c) Microsoft Corporation.\r\n\r\nPermission to use, copy, modify, and/or distribute this software for any\r\npurpose with or without fee is hereby granted.\r\n\r\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\r\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\r\nAND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\r\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM\r\nLOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR\r\nOTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR\r\nPERFORMANCE OF THIS SOFTWARE.\r\n***************************************************************************** */ /* global Reflect, Promise */ var extendStatics = function(d1, b1) {\n    extendStatics = Object.setPrototypeOf || ({\n        __proto__: []\n    }) instanceof Array && function(d, b) {\n        d.__proto__ = b;\n    } || function(d, b) {\n        for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];\n    };\n    return extendStatics(d1, b1);\n};\nfunction __extends(d, b) {\n    if (typeof b !== \"function\" && b !== null) throw new TypeError(\"Class extends value \" + String(b) + \" is not a constructor or null\");\n    extendStatics(d, b);\n    function __() {\n        this.constructor = d;\n    }\n    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());\n}\nvar __assign = function() {\n    __assign = Object.assign || function __assign(t) {\n        for(var s, i = 1, n = arguments.length; i < n; i++){\n            s = arguments[i];\n            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];\n        }\n        return t;\n    };\n    return __assign.apply(this, arguments);\n};\nfunction __rest(s, e) {\n    var t = {};\n    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];\n    if (s != null && typeof Object.getOwnPropertySymbols === \"function\") {\n        for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];\n    }\n    return t;\n}\nfunction __decorate(decorators, target, key, desc) {\n    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;\n    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);\n    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;\n    return c > 3 && r && Object.defineProperty(target, key, r), r;\n}\nfunction __param(paramIndex, decorator) {\n    return function(target, key) {\n        decorator(target, key, paramIndex);\n    };\n}\nfunction __metadata(metadataKey, metadataValue) {\n    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(metadataKey, metadataValue);\n}\nfunction __awaiter(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n        return value instanceof P ? value : new P(function(resolve) {\n            resolve(value);\n        });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n        function fulfilled(value) {\n            try {\n                step(generator.next(value));\n            } catch (e) {\n                reject(e);\n            }\n        }\n        function rejected(value) {\n            try {\n                step(generator[\"throw\"](value));\n            } catch (e) {\n                reject(e);\n            }\n        }\n        function step(result) {\n            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n        }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n}\nfunction __generator(thisArg, body) {\n    var _ = {\n        label: 0,\n        sent: function() {\n            if (t[0] & 1) throw t[1];\n            return t[1];\n        },\n        trys: [],\n        ops: []\n    }, f, y, t, g;\n    return g = {\n        next: verb(0),\n        \"throw\": verb(1),\n        \"return\": verb(2)\n    }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() {\n        return this;\n    }), g;\n    function verb(n) {\n        return function(v) {\n            return step([\n                n,\n                v\n            ]);\n        };\n    }\n    function step(op) {\n        if (f) throw new TypeError(\"Generator is already executing.\");\n        while(_)try {\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\n            if (y = 0, t) op = [\n                op[0] & 2,\n                t.value\n            ];\n            switch(op[0]){\n                case 0:\n                case 1:\n                    t = op;\n                    break;\n                case 4:\n                    _.label++;\n                    return {\n                        value: op[1],\n                        done: false\n                    };\n                case 5:\n                    _.label++;\n                    y = op[1];\n                    op = [\n                        0\n                    ];\n                    continue;\n                case 7:\n                    op = _.ops.pop();\n                    _.trys.pop();\n                    continue;\n                default:\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {\n                        _ = 0;\n                        continue;\n                    }\n                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {\n                        _.label = op[1];\n                        break;\n                    }\n                    if (op[0] === 6 && _.label < t[1]) {\n                        _.label = t[1];\n                        t = op;\n                        break;\n                    }\n                    if (t && _.label < t[2]) {\n                        _.label = t[2];\n                        _.ops.push(op);\n                        break;\n                    }\n                    if (t[2]) _.ops.pop();\n                    _.trys.pop();\n                    continue;\n            }\n            op = body.call(thisArg, _);\n        } catch (e) {\n            op = [\n                6,\n                e\n            ];\n            y = 0;\n        } finally{\n            f = t = 0;\n        }\n        if (op[0] & 5) throw op[1];\n        return {\n            value: op[0] ? op[1] : void 0,\n            done: true\n        };\n    }\n}\nvar __createBinding = Object.create ? function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {\n        enumerable: true,\n        get: function() {\n            return m[k];\n        }\n    };\n    Object.defineProperty(o, k2, desc);\n} : function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n};\nfunction __exportStar(m, o) {\n    for(var p in m)if (p !== \"default\" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);\n}\nfunction __values(o) {\n    var s = typeof Symbol === \"function\" && Symbol.iterator, m = s && o[s], i = 0;\n    if (m) return m.call(o);\n    if (o && typeof o.length === \"number\") return {\n        next: function() {\n            if (o && i >= o.length) o = void 0;\n            return {\n                value: o && o[i++],\n                done: !o\n            };\n        }\n    };\n    throw new TypeError(s ? \"Object is not iterable.\" : \"Symbol.iterator is not defined.\");\n}\nfunction __read(o, n) {\n    var m = typeof Symbol === \"function\" && o[Symbol.iterator];\n    if (!m) return o;\n    var i = m.call(o), r, ar = [], e;\n    try {\n        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);\n    } catch (error) {\n        e = {\n            error: error\n        };\n    } finally{\n        try {\n            if (r && !r.done && (m = i[\"return\"])) m.call(i);\n        } finally{\n            if (e) throw e.error;\n        }\n    }\n    return ar;\n}\nfunction __spread() {\n    for(var ar = [], i = 0; i < arguments.length; i++)ar = ar.concat(__read(arguments[i]));\n    return ar;\n}\nfunction __spreadArrays() {\n    for(var s = 0, i = 0, il = arguments.length; i < il; i++)s += arguments[i].length;\n    for(var r = Array(s), k = 0, i = 0; i < il; i++)for(var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)r[k] = a[j];\n    return r;\n}\nfunction __spreadArray(to, from, pack) {\n    if (pack || arguments.length === 2) {\n        for(var i = 0, l = from.length, ar; i < l; i++)if (ar || !(i in from)) {\n            if (!ar) ar = Array.prototype.slice.call(from, 0, i);\n            ar[i] = from[i];\n        }\n    }\n    return to.concat(ar || Array.prototype.slice.call(from));\n}\nfunction __await(v) {\n    return this instanceof __await ? (this.v = v, this) : new __await(v);\n}\nfunction __asyncGenerator(thisArg, _arguments, generator) {\n    if (!Symbol.asyncIterator) throw new TypeError(\"Symbol.asyncIterator is not defined.\");\n    var g = generator.apply(thisArg, _arguments || []), i, q = [];\n    return i = {}, verb(\"next\"), verb(\"throw\"), verb(\"return\"), i[Symbol.asyncIterator] = function() {\n        return this;\n    }, i;\n    function verb(n) {\n        if (g[n]) i[n] = function(v) {\n            return new Promise(function(a, b) {\n                q.push([\n                    n,\n                    v,\n                    a,\n                    b\n                ]) > 1 || resume(n, v);\n            });\n        };\n    }\n    function resume(n, v) {\n        try {\n            step(g[n](v));\n        } catch (e) {\n            settle(q[0][3], e);\n        }\n    }\n    function step(r) {\n        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);\n    }\n    function fulfill(value) {\n        resume(\"next\", value);\n    }\n    function reject(value) {\n        resume(\"throw\", value);\n    }\n    function settle(f, v) {\n        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);\n    }\n}\nfunction __asyncDelegator(o) {\n    var i, p;\n    return i = {}, verb(\"next\"), verb(\"throw\", function(e) {\n        throw e;\n    }), verb(\"return\"), i[Symbol.iterator] = function() {\n        return this;\n    }, i;\n    function verb(n, f) {\n        i[n] = o[n] ? function(v) {\n            return (p = !p) ? {\n                value: __await(o[n](v)),\n                done: n === \"return\"\n            } : f ? f(v) : v;\n        } : f;\n    }\n}\nfunction __asyncValues(o) {\n    if (!Symbol.asyncIterator) throw new TypeError(\"Symbol.asyncIterator is not defined.\");\n    var m = o[Symbol.asyncIterator], i;\n    return m ? m.call(o) : (o = typeof __values === \"function\" ? __values(o) : o[Symbol.iterator](), i = {}, verb(\"next\"), verb(\"throw\"), verb(\"return\"), i[Symbol.asyncIterator] = function() {\n        return this;\n    }, i);\n    function verb(n) {\n        i[n] = o[n] && function(v) {\n            return new Promise(function(resolve, reject) {\n                v = o[n](v), settle(resolve, reject, v.done, v.value);\n            });\n        };\n    }\n    function settle(resolve, reject, d, v1) {\n        Promise.resolve(v1).then(function(v) {\n            resolve({\n                value: v,\n                done: d\n            });\n        }, reject);\n    }\n}\nfunction __makeTemplateObject(cooked, raw) {\n    if (Object.defineProperty) Object.defineProperty(cooked, \"raw\", {\n        value: raw\n    });\n    else cooked.raw = raw;\n    return cooked;\n}\nvar __setModuleDefault = Object.create ? function(o, v) {\n    Object.defineProperty(o, \"default\", {\n        enumerable: true,\n        value: v\n    });\n} : function(o, v) {\n    o[\"default\"] = v;\n};\nfunction __importStar(mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) {\n        for(var k in mod)if (k !== \"default\" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);\n    }\n    __setModuleDefault(result, mod);\n    return result;\n}\nfunction __importDefault(mod) {\n    return mod && mod.__esModule ? mod : {\n        default: mod\n    };\n}\nfunction __classPrivateFieldGet(receiver, state, kind, f) {\n    if (kind === \"a\" && !f) throw new TypeError(\"Private accessor was defined without a getter\");\n    if (typeof state === \"function\" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError(\"Cannot read private member from an object whose class did not declare it\");\n    return kind === \"m\" ? f : kind === \"a\" ? f.call(receiver) : f ? f.value : state.get(receiver);\n}\nfunction __classPrivateFieldSet(receiver, state, value, kind, f) {\n    if (kind === \"m\") throw new TypeError(\"Private method is not writable\");\n    if (kind === \"a\" && !f) throw new TypeError(\"Private accessor was defined without a setter\");\n    if (typeof state === \"function\" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError(\"Cannot write private member to an object whose class did not declare it\");\n    return kind === \"a\" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;\n}\nfunction __classPrivateFieldIn(state, receiver) {\n    if (receiver === null || typeof receiver !== \"object\" && typeof receiver !== \"function\") throw new TypeError(\"Cannot use 'in' operator on non-object\");\n    return typeof state === \"function\" ? receiver === state : state.has(receiver);\n}\n\n},{\"@parcel/transformer-js/src/esmodule-helpers.js\":\"4IpBY\"}],\"4IpBY\":[function(require,module,exports) {\nexports.interopDefault = function(a) {\n    return a && a.__esModule ? a : {\n        default: a\n    };\n};\nexports.defineInteropFlag = function(a) {\n    Object.defineProperty(a, \"__esModule\", {\n        value: true\n    });\n};\nexports.exportAll = function(source, dest) {\n    Object.keys(source).forEach(function(key) {\n        if (key === \"default\" || key === \"__esModule\" || dest.hasOwnProperty(key)) return;\n        Object.defineProperty(dest, key, {\n            enumerable: true,\n            get: function() {\n                return source[key];\n            }\n        });\n    });\n    return dest;\n};\nexports.export = function(dest, destName, get) {\n    Object.defineProperty(dest, destName, {\n        enumerable: true,\n        get: get\n    });\n};\n\n},{}],\"gDaEX\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.JsonRpcProvider = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst http_1 = require(\"./http\");\nconst ws_1 = require(\"./ws\");\nconst url_1 = require(\"./url\");\nclass JsonRpcProvider extends utils_1.IJsonRpcProvider {\n    connect(connection = this.connection) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.open(connection);\n        });\n    }\n    disconnect() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.close();\n        });\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    request(request, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            return this.requestStrict(utils_1.formatJsonRpcRequest(request.method, request.params || []), context);\n        });\n    }\n    requestStrict(request, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            return new Promise((resolve, reject)=>tslib_1.__awaiter(this, void 0, void 0, function*() {\n                    if (!this.connection.connected) try {\n                        yield this.open();\n                    } catch (e) {\n                        reject(e.message);\n                    }\n                    this.events.on(`${request.id}`, (response)=>{\n                        if (utils_1.isJsonRpcError(response)) reject(response.error.message);\n                        else resolve(response.result);\n                    });\n                    yield this.connection.send(request);\n                }));\n        });\n    }\n    setConnection(connection = this.connection) {\n        return typeof connection === \"string\" ? url_1.isHttpUrl(connection) ? new http_1.HttpConnection(connection) : new ws_1.WsConnection(connection) : connection;\n    }\n    onPayload(payload) {\n        this.events.emit(\"payload\", payload);\n        if (utils_1.isJsonRpcResponse(payload)) this.events.emit(`${payload.id}`, payload);\n        else this.events.emit(\"message\", {\n            type: payload.method,\n            data: payload.params\n        });\n    }\n    open(connection = this.connection) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (this.connection === connection && this.connection.connected) return;\n            if (this.connection.connected) this.close();\n            this.connection = this.setConnection();\n            yield this.connection.open();\n            this.connection.on(\"payload\", (payload)=>this.onPayload(payload));\n            this.connection.on(\"close\", ()=>this.events.emit(\"disconnect\"));\n            this.connection.on(\"error\", ()=>this.events.emit(\"error\"));\n            this.events.emit(\"connect\");\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.connection.close();\n            this.events.emit(\"disconnect\");\n        });\n    }\n    constructor(connection){\n        super(connection);\n        this.events = new events_1.EventEmitter();\n        this.connection = this.setConnection(connection);\n    }\n}\nexports.JsonRpcProvider = JsonRpcProvider;\nexports.default = JsonRpcProvider;\n\n},{\"tslib\":\"DcZ3h\",\"events\":\"1xaZJ\",\"@json-rpc-tools/utils\":\"czhHe\",\"./http\":\"5R8Jc\",\"./ws\":\"a55sm\",\"./url\":\"j4VRk\"}],\"1xaZJ\":[function(require,module,exports) {\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\"use strict\";\nvar R = typeof Reflect === \"object\" ? Reflect : null;\nvar ReflectApply = R && typeof R.apply === \"function\" ? R.apply : function ReflectApply(target, receiver, args) {\n    return Function.prototype.apply.call(target, receiver, args);\n};\nvar ReflectOwnKeys;\nif (R && typeof R.ownKeys === \"function\") ReflectOwnKeys = R.ownKeys;\nelse if (Object.getOwnPropertySymbols) ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));\n};\nelse ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target);\n};\nfunction ProcessEmitWarning(warning) {\n    if (console && console.warn) console.warn(warning);\n}\nvar NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {\n    return value !== value;\n};\nfunction EventEmitter() {\n    EventEmitter.init.call(this);\n}\nmodule.exports = EventEmitter;\nmodule.exports.once = once;\n// Backwards-compat with node 0.10.x\nEventEmitter.EventEmitter = EventEmitter;\nEventEmitter.prototype._events = undefined;\nEventEmitter.prototype._eventsCount = 0;\nEventEmitter.prototype._maxListeners = undefined;\n// By default EventEmitters will print a warning if more than 10 listeners are\n// added to it. This is a useful default which helps finding memory leaks.\nvar defaultMaxListeners = 10;\nfunction checkListener(listener) {\n    if (typeof listener !== \"function\") throw new TypeError('The \"listener\" argument must be of type Function. Received type ' + typeof listener);\n}\nObject.defineProperty(EventEmitter, \"defaultMaxListeners\", {\n    enumerable: true,\n    get: function() {\n        return defaultMaxListeners;\n    },\n    set: function(arg) {\n        if (typeof arg !== \"number\" || arg < 0 || NumberIsNaN(arg)) throw new RangeError('The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received ' + arg + \".\");\n        defaultMaxListeners = arg;\n    }\n});\nEventEmitter.init = function() {\n    if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {\n        this._events = Object.create(null);\n        this._eventsCount = 0;\n    }\n    this._maxListeners = this._maxListeners || undefined;\n};\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nEventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {\n    if (typeof n !== \"number\" || n < 0 || NumberIsNaN(n)) throw new RangeError('The value of \"n\" is out of range. It must be a non-negative number. Received ' + n + \".\");\n    this._maxListeners = n;\n    return this;\n};\nfunction _getMaxListeners(that) {\n    if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;\n    return that._maxListeners;\n}\nEventEmitter.prototype.getMaxListeners = function getMaxListeners() {\n    return _getMaxListeners(this);\n};\nEventEmitter.prototype.emit = function emit(type) {\n    var args = [];\n    for(var i = 1; i < arguments.length; i++)args.push(arguments[i]);\n    var doError = type === \"error\";\n    var events = this._events;\n    if (events !== undefined) doError = doError && events.error === undefined;\n    else if (!doError) return false;\n    // If there is no 'error' event listener then throw.\n    if (doError) {\n        var er;\n        if (args.length > 0) er = args[0];\n        if (er instanceof Error) // Note: The comments on the `throw` lines are intentional, they show\n        // up in Node's output if this results in an unhandled exception.\n        throw er; // Unhandled 'error' event\n        // At least give some kind of context to the user\n        var err = new Error(\"Unhandled error.\" + (er ? \" (\" + er.message + \")\" : \"\"));\n        err.context = er;\n        throw err; // Unhandled 'error' event\n    }\n    var handler = events[type];\n    if (handler === undefined) return false;\n    if (typeof handler === \"function\") ReflectApply(handler, this, args);\n    else {\n        var len = handler.length;\n        var listeners = arrayClone(handler, len);\n        for(var i = 0; i < len; ++i)ReflectApply(listeners[i], this, args);\n    }\n    return true;\n};\nfunction _addListener(target, type, listener, prepend) {\n    var m;\n    var events;\n    var existing;\n    checkListener(listener);\n    events = target._events;\n    if (events === undefined) {\n        events = target._events = Object.create(null);\n        target._eventsCount = 0;\n    } else {\n        // To avoid recursion in the case that type === \"newListener\"! Before\n        // adding it to the listeners, first emit \"newListener\".\n        if (events.newListener !== undefined) {\n            target.emit(\"newListener\", type, listener.listener ? listener.listener : listener);\n            // Re-assign `events` because a newListener handler could have caused the\n            // this._events to be assigned to a new object\n            events = target._events;\n        }\n        existing = events[type];\n    }\n    if (existing === undefined) {\n        // Optimize the case of one listener. Don't need the extra array object.\n        existing = events[type] = listener;\n        ++target._eventsCount;\n    } else {\n        if (typeof existing === \"function\") // Adding the second element, need to change to array.\n        existing = events[type] = prepend ? [\n            listener,\n            existing\n        ] : [\n            existing,\n            listener\n        ];\n        else if (prepend) existing.unshift(listener);\n        else existing.push(listener);\n        // Check for listener leak\n        m = _getMaxListeners(target);\n        if (m > 0 && existing.length > m && !existing.warned) {\n            existing.warned = true;\n            // No error code for this since it is a Warning\n            // eslint-disable-next-line no-restricted-syntax\n            var w = new Error(\"Possible EventEmitter memory leak detected. \" + existing.length + \" \" + String(type) + \" listeners \" + \"added. Use emitter.setMaxListeners() to \" + \"increase limit\");\n            w.name = \"MaxListenersExceededWarning\";\n            w.emitter = target;\n            w.type = type;\n            w.count = existing.length;\n            ProcessEmitWarning(w);\n        }\n    }\n    return target;\n}\nEventEmitter.prototype.addListener = function addListener(type, listener) {\n    return _addListener(this, type, listener, false);\n};\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\nEventEmitter.prototype.prependListener = function prependListener(type, listener) {\n    return _addListener(this, type, listener, true);\n};\nfunction onceWrapper() {\n    if (!this.fired) {\n        this.target.removeListener(this.type, this.wrapFn);\n        this.fired = true;\n        if (arguments.length === 0) return this.listener.call(this.target);\n        return this.listener.apply(this.target, arguments);\n    }\n}\nfunction _onceWrap(target, type, listener) {\n    var state = {\n        fired: false,\n        wrapFn: undefined,\n        target: target,\n        type: type,\n        listener: listener\n    };\n    var wrapped = onceWrapper.bind(state);\n    wrapped.listener = listener;\n    state.wrapFn = wrapped;\n    return wrapped;\n}\nEventEmitter.prototype.once = function once(type, listener) {\n    checkListener(listener);\n    this.on(type, _onceWrap(this, type, listener));\n    return this;\n};\nEventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {\n    checkListener(listener);\n    this.prependListener(type, _onceWrap(this, type, listener));\n    return this;\n};\n// Emits a 'removeListener' event if and only if the listener was removed.\nEventEmitter.prototype.removeListener = function removeListener(type, listener) {\n    var list, events, position, i, originalListener;\n    checkListener(listener);\n    events = this._events;\n    if (events === undefined) return this;\n    list = events[type];\n    if (list === undefined) return this;\n    if (list === listener || list.listener === listener) {\n        if (--this._eventsCount === 0) this._events = Object.create(null);\n        else {\n            delete events[type];\n            if (events.removeListener) this.emit(\"removeListener\", type, list.listener || listener);\n        }\n    } else if (typeof list !== \"function\") {\n        position = -1;\n        for(i = list.length - 1; i >= 0; i--)if (list[i] === listener || list[i].listener === listener) {\n            originalListener = list[i].listener;\n            position = i;\n            break;\n        }\n        if (position < 0) return this;\n        if (position === 0) list.shift();\n        else spliceOne(list, position);\n        if (list.length === 1) events[type] = list[0];\n        if (events.removeListener !== undefined) this.emit(\"removeListener\", type, originalListener || listener);\n    }\n    return this;\n};\nEventEmitter.prototype.off = EventEmitter.prototype.removeListener;\nEventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {\n    var listeners, events, i;\n    events = this._events;\n    if (events === undefined) return this;\n    // not listening for removeListener, no need to emit\n    if (events.removeListener === undefined) {\n        if (arguments.length === 0) {\n            this._events = Object.create(null);\n            this._eventsCount = 0;\n        } else if (events[type] !== undefined) {\n            if (--this._eventsCount === 0) this._events = Object.create(null);\n            else delete events[type];\n        }\n        return this;\n    }\n    // emit removeListener for all listeners on all events\n    if (arguments.length === 0) {\n        var keys = Object.keys(events);\n        var key;\n        for(i = 0; i < keys.length; ++i){\n            key = keys[i];\n            if (key === \"removeListener\") continue;\n            this.removeAllListeners(key);\n        }\n        this.removeAllListeners(\"removeListener\");\n        this._events = Object.create(null);\n        this._eventsCount = 0;\n        return this;\n    }\n    listeners = events[type];\n    if (typeof listeners === \"function\") this.removeListener(type, listeners);\n    else if (listeners !== undefined) // LIFO order\n    for(i = listeners.length - 1; i >= 0; i--)this.removeListener(type, listeners[i]);\n    return this;\n};\nfunction _listeners(target, type, unwrap) {\n    var events = target._events;\n    if (events === undefined) return [];\n    var evlistener = events[type];\n    if (evlistener === undefined) return [];\n    if (typeof evlistener === \"function\") return unwrap ? [\n        evlistener.listener || evlistener\n    ] : [\n        evlistener\n    ];\n    return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);\n}\nEventEmitter.prototype.listeners = function listeners(type) {\n    return _listeners(this, type, true);\n};\nEventEmitter.prototype.rawListeners = function rawListeners(type) {\n    return _listeners(this, type, false);\n};\nEventEmitter.listenerCount = function(emitter, type) {\n    if (typeof emitter.listenerCount === \"function\") return emitter.listenerCount(type);\n    else return listenerCount.call(emitter, type);\n};\nEventEmitter.prototype.listenerCount = listenerCount;\nfunction listenerCount(type) {\n    var events = this._events;\n    if (events !== undefined) {\n        var evlistener = events[type];\n        if (typeof evlistener === \"function\") return 1;\n        else if (evlistener !== undefined) return evlistener.length;\n    }\n    return 0;\n}\nEventEmitter.prototype.eventNames = function eventNames() {\n    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];\n};\nfunction arrayClone(arr, n) {\n    var copy = new Array(n);\n    for(var i = 0; i < n; ++i)copy[i] = arr[i];\n    return copy;\n}\nfunction spliceOne(list, index) {\n    for(; index + 1 < list.length; index++)list[index] = list[index + 1];\n    list.pop();\n}\nfunction unwrapListeners(arr) {\n    var ret = new Array(arr.length);\n    for(var i = 0; i < ret.length; ++i)ret[i] = arr[i].listener || arr[i];\n    return ret;\n}\nfunction once(emitter, name) {\n    return new Promise(function(resolve, reject) {\n        function errorListener(err) {\n            emitter.removeListener(name, resolver);\n            reject(err);\n        }\n        function resolver() {\n            if (typeof emitter.removeListener === \"function\") emitter.removeListener(\"error\", errorListener);\n            resolve([].slice.call(arguments));\n        }\n        eventTargetAgnosticAddListener(emitter, name, resolver, {\n            once: true\n        });\n        if (name !== \"error\") addErrorHandlerIfEventEmitter(emitter, errorListener, {\n            once: true\n        });\n    });\n}\nfunction addErrorHandlerIfEventEmitter(emitter, handler, flags) {\n    if (typeof emitter.on === \"function\") eventTargetAgnosticAddListener(emitter, \"error\", handler, flags);\n}\nfunction eventTargetAgnosticAddListener(emitter, name, listener, flags) {\n    if (typeof emitter.on === \"function\") {\n        if (flags.once) emitter.once(name, listener);\n        else emitter.on(name, listener);\n    } else if (typeof emitter.addEventListener === \"function\") // EventTarget does not have `error` event semantics like Node\n    // EventEmitters, we do not listen for `error` events here.\n    emitter.addEventListener(name, function wrapListener(arg) {\n        // IE does not have builtin `{ once: true }` support so we\n        // have to do it manually.\n        if (flags.once) emitter.removeEventListener(name, wrapListener);\n        listener(arg);\n    });\n    else throw new TypeError('The \"emitter\" argument must be of type EventEmitter. Received type ' + typeof emitter);\n}\n\n},{}],\"czhHe\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"./constants\"), exports);\ntslib_1.__exportStar(require(\"./error\"), exports);\ntslib_1.__exportStar(require(\"./env\"), exports);\ntslib_1.__exportStar(require(\"./format\"), exports);\ntslib_1.__exportStar(require(\"./routing\"), exports);\ntslib_1.__exportStar(require(\"./types\"), exports);\ntslib_1.__exportStar(require(\"./validators\"), exports);\n\n},{\"tslib\":\"DcZ3h\",\"./constants\":\"9opxc\",\"./error\":\"9Rx3M\",\"./env\":\"dLiib\",\"./format\":\"86ZxU\",\"./routing\":\"6a2JO\",\"./types\":\"9ODHo\",\"./validators\":\"3i44x\"}],\"9opxc\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.STANDARD_ERROR_MAP = exports.SERVER_ERROR_CODE_RANGE = exports.RESERVED_ERROR_CODES = exports.SERVER_ERROR = exports.INTERNAL_ERROR = exports.INVALID_PARAMS = exports.METHOD_NOT_FOUND = exports.INVALID_REQUEST = exports.PARSE_ERROR = void 0;\nexports.PARSE_ERROR = \"PARSE_ERROR\";\nexports.INVALID_REQUEST = \"INVALID_REQUEST\";\nexports.METHOD_NOT_FOUND = \"METHOD_NOT_FOUND\";\nexports.INVALID_PARAMS = \"INVALID_PARAMS\";\nexports.INTERNAL_ERROR = \"INTERNAL_ERROR\";\nexports.SERVER_ERROR = \"SERVER_ERROR\";\nexports.RESERVED_ERROR_CODES = [\n    -32700,\n    -32600,\n    -32601,\n    -32602,\n    -32603\n];\nexports.SERVER_ERROR_CODE_RANGE = [\n    -32000,\n    -32099\n];\nexports.STANDARD_ERROR_MAP = {\n    [exports.PARSE_ERROR]: {\n        code: -32700,\n        message: \"Parse error\"\n    },\n    [exports.INVALID_REQUEST]: {\n        code: -32600,\n        message: \"Invalid Request\"\n    },\n    [exports.METHOD_NOT_FOUND]: {\n        code: -32601,\n        message: \"Method not found\"\n    },\n    [exports.INVALID_PARAMS]: {\n        code: -32602,\n        message: \"Invalid params\"\n    },\n    [exports.INTERNAL_ERROR]: {\n        code: -32603,\n        message: \"Internal error\"\n    },\n    [exports.SERVER_ERROR]: {\n        code: -32000,\n        message: \"Server error\"\n    }\n};\n\n},{}],\"9Rx3M\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.validateJsonRpcError = exports.getErrorByCode = exports.getError = exports.isValidErrorCode = exports.isReservedErrorCode = exports.isServerErrorCode = void 0;\nconst constants_1 = require(\"./constants\");\nfunction isServerErrorCode(code) {\n    return code <= constants_1.SERVER_ERROR_CODE_RANGE[0] && code >= constants_1.SERVER_ERROR_CODE_RANGE[1];\n}\nexports.isServerErrorCode = isServerErrorCode;\nfunction isReservedErrorCode(code) {\n    return constants_1.RESERVED_ERROR_CODES.includes(code);\n}\nexports.isReservedErrorCode = isReservedErrorCode;\nfunction isValidErrorCode(code) {\n    return typeof code === \"number\";\n}\nexports.isValidErrorCode = isValidErrorCode;\nfunction getError(type) {\n    if (!Object.keys(constants_1.STANDARD_ERROR_MAP).includes(type)) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];\n    return constants_1.STANDARD_ERROR_MAP[type];\n}\nexports.getError = getError;\nfunction getErrorByCode(code) {\n    const match = Object.values(constants_1.STANDARD_ERROR_MAP).find((e)=>e.code === code);\n    if (!match) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];\n    return match;\n}\nexports.getErrorByCode = getErrorByCode;\nfunction validateJsonRpcError(response) {\n    if (typeof response.error.code === \"undefined\") return {\n        valid: false,\n        error: \"Missing code for JSON-RPC error\"\n    };\n    if (typeof response.error.message === \"undefined\") return {\n        valid: false,\n        error: \"Missing message for JSON-RPC error\"\n    };\n    if (!isValidErrorCode(response.error.code)) return {\n        valid: false,\n        error: `Invalid error code type for JSON-RPC: ${response.error.code}`\n    };\n    if (isReservedErrorCode(response.error.code)) {\n        const error = getErrorByCode(response.error.code);\n        if (error.message !== constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR].message && response.error.message === error.message) return {\n            valid: false,\n            error: `Invalid error code message for JSON-RPC: ${response.error.code}`\n        };\n    }\n    return {\n        valid: true\n    };\n}\nexports.validateJsonRpcError = validateJsonRpcError;\n\n},{\"./constants\":\"9opxc\"}],\"dLiib\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isNodeJs = void 0;\nconst tslib_1 = require(\"tslib\");\nconst environment_1 = require(\"@pedrouid/environment\");\nexports.isNodeJs = environment_1.isNode;\ntslib_1.__exportStar(require(\"@pedrouid/environment\"), exports);\n\n},{\"tslib\":\"DcZ3h\",\"@pedrouid/environment\":\"58QAW\"}],\"58QAW\":[function(require,module,exports) {\n\"use strict\";\nvar __createBinding = this && this.__createBinding || (Object.create ? function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    Object.defineProperty(o, k2, {\n        enumerable: true,\n        get: function() {\n            return m[k];\n        }\n    });\n} : function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n});\nvar __exportStar = this && this.__exportStar || function(m, exports) {\n    for(var p in m)if (p !== \"default\" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);\n};\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n__exportStar(require(\"./crypto\"), exports);\n__exportStar(require(\"./env\"), exports);\n\n},{\"./crypto\":\"e2TkY\",\"./env\":\"jkj2L\"}],\"e2TkY\":[function(require,module,exports) {\n\"use strict\";\nvar global = arguments[3];\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isBrowserCryptoAvailable = exports.getSubtleCrypto = exports.getBrowerCrypto = void 0;\nfunction getBrowerCrypto() {\n    return (global === null || global === void 0 ? void 0 : global.crypto) || (global === null || global === void 0 ? void 0 : global.msCrypto) || {};\n}\nexports.getBrowerCrypto = getBrowerCrypto;\nfunction getSubtleCrypto() {\n    const browserCrypto = getBrowerCrypto();\n    return browserCrypto.subtle || browserCrypto.webkitSubtle;\n}\nexports.getSubtleCrypto = getSubtleCrypto;\nfunction isBrowserCryptoAvailable() {\n    return !!getBrowerCrypto() && !!getSubtleCrypto();\n}\nexports.isBrowserCryptoAvailable = isBrowserCryptoAvailable;\n\n},{}],\"jkj2L\":[function(require,module,exports) {\n\"use strict\";\nvar process = require(\"process\");\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isBrowser = exports.isNode = exports.isReactNative = void 0;\nfunction isReactNative() {\n    return typeof document === \"undefined\" && typeof navigator !== \"undefined\" && navigator.product === \"ReactNative\";\n}\nexports.isReactNative = isReactNative;\nfunction isNode() {\n    return typeof process !== \"undefined\" && typeof process.versions !== \"undefined\" && typeof process.versions.node !== \"undefined\";\n}\nexports.isNode = isNode;\nfunction isBrowser() {\n    return !isReactNative() && !isNode();\n}\nexports.isBrowser = isBrowser;\n\n},{\"process\":\"aND2C\"}],\"aND2C\":[function(require,module,exports) {\n// shim for using process in browser\nvar process = module.exports = {};\n// cached from whatever global is present so that test runners that stub it\n// don't break things.  But we need to wrap it in a try catch in case it is\n// wrapped in strict mode code which doesn't define any globals.  It's inside a\n// function because try/catches deoptimize in certain engines.\nvar cachedSetTimeout;\nvar cachedClearTimeout;\nfunction defaultSetTimout() {\n    throw new Error(\"setTimeout has not been defined\");\n}\nfunction defaultClearTimeout() {\n    throw new Error(\"clearTimeout has not been defined\");\n}\n(function() {\n    try {\n        if (typeof setTimeout === \"function\") cachedSetTimeout = setTimeout;\n        else cachedSetTimeout = defaultSetTimout;\n    } catch (e) {\n        cachedSetTimeout = defaultSetTimout;\n    }\n    try {\n        if (typeof clearTimeout === \"function\") cachedClearTimeout = clearTimeout;\n        else cachedClearTimeout = defaultClearTimeout;\n    } catch (e1) {\n        cachedClearTimeout = defaultClearTimeout;\n    }\n})();\nfunction runTimeout(fun) {\n    if (cachedSetTimeout === setTimeout) //normal enviroments in sane situations\n    return setTimeout(fun, 0);\n    // if setTimeout wasn't available but was latter defined\n    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {\n        cachedSetTimeout = setTimeout;\n        return setTimeout(fun, 0);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedSetTimeout(fun, 0);\n    } catch (e) {\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally\n            return cachedSetTimeout.call(null, fun, 0);\n        } catch (e) {\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error\n            return cachedSetTimeout.call(this, fun, 0);\n        }\n    }\n}\nfunction runClearTimeout(marker) {\n    if (cachedClearTimeout === clearTimeout) //normal enviroments in sane situations\n    return clearTimeout(marker);\n    // if clearTimeout wasn't available but was latter defined\n    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {\n        cachedClearTimeout = clearTimeout;\n        return clearTimeout(marker);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedClearTimeout(marker);\n    } catch (e) {\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally\n            return cachedClearTimeout.call(null, marker);\n        } catch (e) {\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.\n            // Some versions of I.E. have different rules for clearTimeout vs setTimeout\n            return cachedClearTimeout.call(this, marker);\n        }\n    }\n}\nvar queue = [];\nvar draining = false;\nvar currentQueue;\nvar queueIndex = -1;\nfunction cleanUpNextTick() {\n    if (!draining || !currentQueue) return;\n    draining = false;\n    if (currentQueue.length) queue = currentQueue.concat(queue);\n    else queueIndex = -1;\n    if (queue.length) drainQueue();\n}\nfunction drainQueue() {\n    if (draining) return;\n    var timeout = runTimeout(cleanUpNextTick);\n    draining = true;\n    var len = queue.length;\n    while(len){\n        currentQueue = queue;\n        queue = [];\n        while(++queueIndex < len)if (currentQueue) currentQueue[queueIndex].run();\n        queueIndex = -1;\n        len = queue.length;\n    }\n    currentQueue = null;\n    draining = false;\n    runClearTimeout(timeout);\n}\nprocess.nextTick = function(fun) {\n    var args = new Array(arguments.length - 1);\n    if (arguments.length > 1) for(var i = 1; i < arguments.length; i++)args[i - 1] = arguments[i];\n    queue.push(new Item(fun, args));\n    if (queue.length === 1 && !draining) runTimeout(drainQueue);\n};\n// v8 likes predictible objects\nfunction Item(fun, array) {\n    this.fun = fun;\n    this.array = array;\n}\nItem.prototype.run = function() {\n    this.fun.apply(null, this.array);\n};\nprocess.title = \"browser\";\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\nprocess.version = \"\"; // empty string to avoid regexp issues\nprocess.versions = {};\nfunction noop() {}\nprocess.on = noop;\nprocess.addListener = noop;\nprocess.once = noop;\nprocess.off = noop;\nprocess.removeListener = noop;\nprocess.removeAllListeners = noop;\nprocess.emit = noop;\nprocess.prependListener = noop;\nprocess.prependOnceListener = noop;\nprocess.listeners = function(name) {\n    return [];\n};\nprocess.binding = function(name) {\n    throw new Error(\"process.binding is not supported\");\n};\nprocess.cwd = function() {\n    return \"/\";\n};\nprocess.chdir = function(dir) {\n    throw new Error(\"process.chdir is not supported\");\n};\nprocess.umask = function() {\n    return 0;\n};\n\n},{}],\"86ZxU\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.formatErrorMessage = exports.formatJsonRpcError = exports.formatJsonRpcResult = exports.formatJsonRpcRequest = exports.payloadId = void 0;\nconst error_1 = require(\"./error\");\nconst constants_1 = require(\"./constants\");\nfunction payloadId() {\n    const date = Date.now() * Math.pow(10, 3);\n    const extra = Math.floor(Math.random() * Math.pow(10, 3));\n    return date + extra;\n}\nexports.payloadId = payloadId;\nfunction formatJsonRpcRequest(method, params, id) {\n    return {\n        id: id || payloadId(),\n        jsonrpc: \"2.0\",\n        method,\n        params\n    };\n}\nexports.formatJsonRpcRequest = formatJsonRpcRequest;\nfunction formatJsonRpcResult(id, result) {\n    return {\n        id,\n        jsonrpc: \"2.0\",\n        result\n    };\n}\nexports.formatJsonRpcResult = formatJsonRpcResult;\nfunction formatJsonRpcError(id, error) {\n    return {\n        id,\n        jsonrpc: \"2.0\",\n        error: formatErrorMessage(error)\n    };\n}\nexports.formatJsonRpcError = formatJsonRpcError;\nfunction formatErrorMessage(error) {\n    if (typeof error === \"undefined\") return error_1.getError(constants_1.INTERNAL_ERROR);\n    if (typeof error === \"string\") error = Object.assign(Object.assign({}, error_1.getError(constants_1.SERVER_ERROR)), {\n        message: error\n    });\n    if (error_1.isReservedErrorCode(error.code)) error = error_1.getErrorByCode(error.code);\n    if (!error_1.isServerErrorCode(error.code)) throw new Error(\"Error code is not in server code range\");\n    return error;\n}\nexports.formatErrorMessage = formatErrorMessage;\n\n},{\"./error\":\"9Rx3M\",\"./constants\":\"9opxc\"}],\"6a2JO\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isValidTrailingWildcardRoute = exports.isValidLeadingWildcardRoute = exports.isValidWildcardRoute = exports.isValidDefaultRoute = exports.isValidRoute = void 0;\nfunction isValidRoute(route) {\n    if (route.includes(\"*\")) return isValidWildcardRoute(route);\n    if (/\\W/g.test(route)) return false;\n    return true;\n}\nexports.isValidRoute = isValidRoute;\nfunction isValidDefaultRoute(route) {\n    return route === \"*\";\n}\nexports.isValidDefaultRoute = isValidDefaultRoute;\nfunction isValidWildcardRoute(route) {\n    if (isValidDefaultRoute(route)) return true;\n    if (!route.includes(\"*\")) return false;\n    if (route.split(\"*\").length !== 2) return false;\n    if (route.split(\"*\").filter((x)=>x.trim() === \"\").length !== 1) return false;\n    return true;\n}\nexports.isValidWildcardRoute = isValidWildcardRoute;\nfunction isValidLeadingWildcardRoute(route) {\n    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split(\"*\")[0].trim();\n}\nexports.isValidLeadingWildcardRoute = isValidLeadingWildcardRoute;\nfunction isValidTrailingWildcardRoute(route) {\n    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split(\"*\")[1].trim();\n}\nexports.isValidTrailingWildcardRoute = isValidTrailingWildcardRoute;\n\n},{}],\"9ODHo\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"@json-rpc-tools/types\"), exports);\n\n},{\"tslib\":\"DcZ3h\",\"@json-rpc-tools/types\":\"a9nDl\"}],\"a9nDl\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"./blockchain\"), exports);\ntslib_1.__exportStar(require(\"./jsonrpc\"), exports);\ntslib_1.__exportStar(require(\"./misc\"), exports);\ntslib_1.__exportStar(require(\"./multi\"), exports);\ntslib_1.__exportStar(require(\"./provider\"), exports);\ntslib_1.__exportStar(require(\"./router\"), exports);\ntslib_1.__exportStar(require(\"./schema\"), exports);\ntslib_1.__exportStar(require(\"./validator\"), exports);\n\n},{\"tslib\":\"DcZ3h\",\"./blockchain\":\"goDQV\",\"./jsonrpc\":\"kJnPN\",\"./misc\":\"g7PF1\",\"./multi\":\"6Ja1n\",\"./provider\":\"j5yIg\",\"./router\":\"alJJY\",\"./schema\":\"9LXo0\",\"./validator\":\"4EbwN\"}],\"goDQV\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IBlockchainProvider = exports.IBlockchainAuthenticator = exports.IPendingRequests = void 0;\nconst misc_1 = require(\"./misc\");\nconst provider_1 = require(\"./provider\");\nclass IPendingRequests {\n    constructor(storage){\n        this.storage = storage;\n    }\n}\nexports.IPendingRequests = IPendingRequests;\nclass IBlockchainAuthenticator extends misc_1.IEvents {\n    constructor(config){\n        super();\n        this.config = config;\n    }\n}\nexports.IBlockchainAuthenticator = IBlockchainAuthenticator;\nclass IBlockchainProvider extends provider_1.IJsonRpcProvider {\n    constructor(connection, config){\n        super(connection);\n    }\n}\nexports.IBlockchainProvider = IBlockchainProvider;\n\n},{\"./misc\":\"g7PF1\",\"./provider\":\"j5yIg\"}],\"g7PF1\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IEvents = void 0;\nclass IEvents {\n}\nexports.IEvents = IEvents;\n\n},{}],\"j5yIg\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcProvider = exports.IBaseJsonRpcProvider = exports.IJsonRpcConnection = void 0;\nconst misc_1 = require(\"./misc\");\nclass IJsonRpcConnection extends misc_1.IEvents {\n    constructor(opts){\n        super();\n    }\n}\nexports.IJsonRpcConnection = IJsonRpcConnection;\nclass IBaseJsonRpcProvider extends misc_1.IEvents {\n    constructor(){\n        super();\n    }\n}\nexports.IBaseJsonRpcProvider = IBaseJsonRpcProvider;\nclass IJsonRpcProvider extends IBaseJsonRpcProvider {\n    constructor(connection){\n        super();\n    }\n}\nexports.IJsonRpcProvider = IJsonRpcProvider;\n\n},{\"./misc\":\"g7PF1\"}],\"kJnPN\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n\n},{}],\"6Ja1n\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IMultiServiceProvider = void 0;\nconst provider_1 = require(\"./provider\");\nclass IMultiServiceProvider extends provider_1.IBaseJsonRpcProvider {\n    constructor(config){\n        super();\n        this.config = config;\n    }\n}\nexports.IMultiServiceProvider = IMultiServiceProvider;\n\n},{\"./provider\":\"j5yIg\"}],\"alJJY\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcRouter = void 0;\nclass IJsonRpcRouter {\n    constructor(routes){\n        this.routes = routes;\n    }\n}\nexports.IJsonRpcRouter = IJsonRpcRouter;\n\n},{}],\"9LXo0\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n\n},{}],\"4EbwN\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcValidator = void 0;\nclass IJsonRpcValidator {\n    constructor(schemas){\n        this.schemas = schemas;\n    }\n}\nexports.IJsonRpcValidator = IJsonRpcValidator;\n\n},{}],\"3i44x\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isJsonRpcValidationInvalid = exports.isJsonRpcError = exports.isJsonRpcResult = exports.isJsonRpcResponse = exports.isJsonRpcRequest = exports.isJsonRpcPayload = void 0;\nfunction isJsonRpcPayload(payload) {\n    return \"id\" in payload && \"jsonrpc\" in payload && payload.jsonrpc === \"2.0\";\n}\nexports.isJsonRpcPayload = isJsonRpcPayload;\nfunction isJsonRpcRequest(payload) {\n    return isJsonRpcPayload(payload) && \"method\" in payload;\n}\nexports.isJsonRpcRequest = isJsonRpcRequest;\nfunction isJsonRpcResponse(payload) {\n    return isJsonRpcPayload(payload) && (isJsonRpcResult(payload) || isJsonRpcError(payload));\n}\nexports.isJsonRpcResponse = isJsonRpcResponse;\nfunction isJsonRpcResult(payload) {\n    return \"result\" in payload;\n}\nexports.isJsonRpcResult = isJsonRpcResult;\nfunction isJsonRpcError(payload) {\n    return \"error\" in payload;\n}\nexports.isJsonRpcError = isJsonRpcError;\nfunction isJsonRpcValidationInvalid(validation) {\n    return \"error\" in validation && validation.valid === false;\n}\nexports.isJsonRpcValidationInvalid = isJsonRpcValidationInvalid;\n\n},{}],\"5R8Jc\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.HttpConnection = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst axios_1 = tslib_1.__importDefault(require(\"axios\"));\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst safe_json_utils_1 = require(\"safe-json-utils\");\nconst url_1 = require(\"./url\");\nclass HttpConnection {\n    get connected() {\n        return typeof this.api !== \"undefined\";\n    }\n    get connecting() {\n        return this.registering;\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    open(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.api = yield this.register(url);\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.onClose();\n        });\n    }\n    send(payload, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.api === \"undefined\") this.api = yield this.register();\n            this.api.post(\"/\", payload).then((res)=>this.onPayload(res)).catch((err)=>this.onError(payload.id, err));\n        });\n    }\n    register(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (!url_1.isHttpUrl(url)) throw new Error(`Provided URL is not compatible with HTTP connection: ${url}`);\n            if (this.registering) return new Promise((resolve, reject)=>{\n                this.events.once(\"open\", ()=>{\n                    if (typeof this.api === \"undefined\") return reject(new Error(\"HTTP connection is missing or invalid\"));\n                    resolve(this.api);\n                });\n            });\n            this.url = url;\n            this.registering = true;\n            const api = axios_1.default.create({\n                baseURL: url,\n                timeout: 30000,\n                headers: {\n                    Accept: \"application/json\",\n                    \"Content-Type\": \"application/json\"\n                }\n            });\n            try {\n                yield api.post(\"/\", {\n                    id: 1,\n                    jsonrpc: \"2.0\",\n                    method: \"test\",\n                    params: []\n                });\n                this.onOpen(api);\n            } catch (e) {\n                this.onClose();\n                throw new Error(`Unavailable HTTP RPC url at ${url}`);\n            }\n            return api;\n        });\n    }\n    onOpen(api) {\n        this.api = api;\n        this.registering = false;\n        this.events.emit(\"open\");\n    }\n    onClose() {\n        this.api = undefined;\n        this.events.emit(\"close\");\n    }\n    onPayload(e) {\n        if (typeof e.data === \"undefined\") return;\n        const payload = typeof e.data === \"string\" ? safe_json_utils_1.safeJsonParse(e.data) : e.data;\n        this.events.emit(\"payload\", payload);\n    }\n    onError(id, e) {\n        const message = e.message || e.toString();\n        const payload = utils_1.formatJsonRpcError(id, message);\n        this.events.emit(\"payload\", payload);\n    }\n    constructor(url){\n        this.url = url;\n        this.events = new events_1.EventEmitter();\n        this.registering = false;\n        if (!url_1.isHttpUrl(url)) throw new Error(`Provided URL is not compatible with HTTP connection: ${url}`);\n        this.url = url;\n    }\n}\nexports.HttpConnection = HttpConnection;\n\n},{\"tslib\":\"DcZ3h\",\"events\":\"1xaZJ\",\"axios\":\"3Mlqq\",\"@json-rpc-tools/utils\":\"czhHe\",\"safe-json-utils\":\"4m0ZM\",\"./url\":\"j4VRk\"}],\"3Mlqq\":[function(require,module,exports) {\nmodule.exports = require(\"./lib/axios\");\n\n},{\"./lib/axios\":\"6H5GR\"}],\"6H5GR\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./utils\");\nvar bind = require(\"./helpers/bind\");\nvar Axios = require(\"./core/Axios\");\nvar mergeConfig = require(\"./core/mergeConfig\");\nvar defaults = require(\"./defaults\");\n/**\n * Create an instance of Axios\n *\n * @param {Object} defaultConfig The default config for the instance\n * @return {Axios} A new instance of Axios\n */ function createInstance(defaultConfig) {\n    var context = new Axios(defaultConfig);\n    var instance = bind(Axios.prototype.request, context);\n    // Copy axios.prototype to instance\n    utils.extend(instance, Axios.prototype, context);\n    // Copy context to instance\n    utils.extend(instance, context);\n    return instance;\n}\n// Create the default instance to be exported\nvar axios = createInstance(defaults);\n// Expose Axios class to allow class inheritance\naxios.Axios = Axios;\n// Factory for creating new instances\naxios.create = function create(instanceConfig) {\n    return createInstance(mergeConfig(axios.defaults, instanceConfig));\n};\n// Expose Cancel & CancelToken\naxios.Cancel = require(\"./cancel/Cancel\");\naxios.CancelToken = require(\"./cancel/CancelToken\");\naxios.isCancel = require(\"./cancel/isCancel\");\n// Expose all/spread\naxios.all = function all(promises) {\n    return Promise.all(promises);\n};\naxios.spread = require(\"./helpers/spread\");\n// Expose isAxiosError\naxios.isAxiosError = require(\"./helpers/isAxiosError\");\nmodule.exports = axios;\n// Allow use of default import syntax in TypeScript\nmodule.exports.default = axios;\n\n},{\"./utils\":\"duYAn\",\"./helpers/bind\":\"54X8T\",\"./core/Axios\":\"kpuRe\",\"./core/mergeConfig\":\"ibDVI\",\"./defaults\":\"6fo2s\",\"./cancel/Cancel\":\"8kjT7\",\"./cancel/CancelToken\":\"3pdZx\",\"./cancel/isCancel\":\"hGa5h\",\"./helpers/spread\":\"iD93M\",\"./helpers/isAxiosError\":\"ewarG\"}],\"duYAn\":[function(require,module,exports) {\n\"use strict\";\nvar bind = require(\"./helpers/bind\");\n// utils is a library of generic helper functions non-specific to axios\nvar toString = Object.prototype.toString;\n/**\n * Determine if a value is an Array\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an Array, otherwise false\n */ function isArray(val) {\n    return toString.call(val) === \"[object Array]\";\n}\n/**\n * Determine if a value is undefined\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if the value is undefined, otherwise false\n */ function isUndefined(val) {\n    return typeof val === \"undefined\";\n}\n/**\n * Determine if a value is a Buffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Buffer, otherwise false\n */ function isBuffer(val) {\n    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && typeof val.constructor.isBuffer === \"function\" && val.constructor.isBuffer(val);\n}\n/**\n * Determine if a value is an ArrayBuffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an ArrayBuffer, otherwise false\n */ function isArrayBuffer(val) {\n    return toString.call(val) === \"[object ArrayBuffer]\";\n}\n/**\n * Determine if a value is a FormData\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an FormData, otherwise false\n */ function isFormData(val) {\n    return typeof FormData !== \"undefined\" && val instanceof FormData;\n}\n/**\n * Determine if a value is a view on an ArrayBuffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false\n */ function isArrayBufferView(val) {\n    var result;\n    if (typeof ArrayBuffer !== \"undefined\" && ArrayBuffer.isView) result = ArrayBuffer.isView(val);\n    else result = val && val.buffer && val.buffer instanceof ArrayBuffer;\n    return result;\n}\n/**\n * Determine if a value is a String\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a String, otherwise false\n */ function isString(val) {\n    return typeof val === \"string\";\n}\n/**\n * Determine if a value is a Number\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Number, otherwise false\n */ function isNumber(val) {\n    return typeof val === \"number\";\n}\n/**\n * Determine if a value is an Object\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an Object, otherwise false\n */ function isObject(val) {\n    return val !== null && typeof val === \"object\";\n}\n/**\n * Determine if a value is a plain Object\n *\n * @param {Object} val The value to test\n * @return {boolean} True if value is a plain Object, otherwise false\n */ function isPlainObject(val) {\n    if (toString.call(val) !== \"[object Object]\") return false;\n    var prototype = Object.getPrototypeOf(val);\n    return prototype === null || prototype === Object.prototype;\n}\n/**\n * Determine if a value is a Date\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Date, otherwise false\n */ function isDate(val) {\n    return toString.call(val) === \"[object Date]\";\n}\n/**\n * Determine if a value is a File\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a File, otherwise false\n */ function isFile(val) {\n    return toString.call(val) === \"[object File]\";\n}\n/**\n * Determine if a value is a Blob\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Blob, otherwise false\n */ function isBlob(val) {\n    return toString.call(val) === \"[object Blob]\";\n}\n/**\n * Determine if a value is a Function\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Function, otherwise false\n */ function isFunction(val) {\n    return toString.call(val) === \"[object Function]\";\n}\n/**\n * Determine if a value is a Stream\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Stream, otherwise false\n */ function isStream(val) {\n    return isObject(val) && isFunction(val.pipe);\n}\n/**\n * Determine if a value is a URLSearchParams object\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a URLSearchParams object, otherwise false\n */ function isURLSearchParams(val) {\n    return typeof URLSearchParams !== \"undefined\" && val instanceof URLSearchParams;\n}\n/**\n * Trim excess whitespace off the beginning and end of a string\n *\n * @param {String} str The String to trim\n * @returns {String} The String freed of excess whitespace\n */ function trim(str) {\n    return str.trim ? str.trim() : str.replace(/^\\s+|\\s+$/g, \"\");\n}\n/**\n * Determine if we're running in a standard browser environment\n *\n * This allows axios to run in a web worker, and react-native.\n * Both environments support XMLHttpRequest, but not fully standard globals.\n *\n * web workers:\n *  typeof window -> undefined\n *  typeof document -> undefined\n *\n * react-native:\n *  navigator.product -> 'ReactNative'\n * nativescript\n *  navigator.product -> 'NativeScript' or 'NS'\n */ function isStandardBrowserEnv() {\n    if (typeof navigator !== \"undefined\" && (navigator.product === \"ReactNative\" || navigator.product === \"NativeScript\" || navigator.product === \"NS\")) return false;\n    return typeof window !== \"undefined\" && typeof document !== \"undefined\";\n}\n/**\n * Iterate over an Array or an Object invoking a function for each item.\n *\n * If `obj` is an Array callback will be called passing\n * the value, index, and complete array for each item.\n *\n * If 'obj' is an Object callback will be called passing\n * the value, key, and complete object for each property.\n *\n * @param {Object|Array} obj The object to iterate\n * @param {Function} fn The callback to invoke for each item\n */ function forEach(obj, fn) {\n    // Don't bother if no value provided\n    if (obj === null || typeof obj === \"undefined\") return;\n    // Force an array if not already something iterable\n    if (typeof obj !== \"object\") /*eslint no-param-reassign:0*/ obj = [\n        obj\n    ];\n    if (isArray(obj)) // Iterate over array values\n    for(var i = 0, l = obj.length; i < l; i++)fn.call(null, obj[i], i, obj);\n    else {\n        // Iterate over object keys\n        for(var key in obj)if (Object.prototype.hasOwnProperty.call(obj, key)) fn.call(null, obj[key], key, obj);\n    }\n}\n/**\n * Accepts varargs expecting each argument to be an object, then\n * immutably merges the properties of each object and returns result.\n *\n * When multiple objects contain the same key the later object in\n * the arguments list will take precedence.\n *\n * Example:\n *\n * ```js\n * var result = merge({foo: 123}, {foo: 456});\n * console.log(result.foo); // outputs 456\n * ```\n *\n * @param {Object} obj1 Object to merge\n * @returns {Object} Result of all merge properties\n */ function merge() {\n    var result = {};\n    function assignValue(val, key) {\n        if (isPlainObject(result[key]) && isPlainObject(val)) result[key] = merge(result[key], val);\n        else if (isPlainObject(val)) result[key] = merge({}, val);\n        else if (isArray(val)) result[key] = val.slice();\n        else result[key] = val;\n    }\n    for(var i = 0, l = arguments.length; i < l; i++)forEach(arguments[i], assignValue);\n    return result;\n}\n/**\n * Extends object a by mutably adding to it the properties of object b.\n *\n * @param {Object} a The object to be extended\n * @param {Object} b The object to copy properties from\n * @param {Object} thisArg The object to bind function to\n * @return {Object} The resulting value of object a\n */ function extend(a, b, thisArg) {\n    forEach(b, function assignValue(val, key) {\n        if (thisArg && typeof val === \"function\") a[key] = bind(val, thisArg);\n        else a[key] = val;\n    });\n    return a;\n}\n/**\n * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)\n *\n * @param {string} content with BOM\n * @return {string} content value without BOM\n */ function stripBOM(content) {\n    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);\n    return content;\n}\nmodule.exports = {\n    isArray: isArray,\n    isArrayBuffer: isArrayBuffer,\n    isBuffer: isBuffer,\n    isFormData: isFormData,\n    isArrayBufferView: isArrayBufferView,\n    isString: isString,\n    isNumber: isNumber,\n    isObject: isObject,\n    isPlainObject: isPlainObject,\n    isUndefined: isUndefined,\n    isDate: isDate,\n    isFile: isFile,\n    isBlob: isBlob,\n    isFunction: isFunction,\n    isStream: isStream,\n    isURLSearchParams: isURLSearchParams,\n    isStandardBrowserEnv: isStandardBrowserEnv,\n    forEach: forEach,\n    merge: merge,\n    extend: extend,\n    trim: trim,\n    stripBOM: stripBOM\n};\n\n},{\"./helpers/bind\":\"54X8T\"}],\"54X8T\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function bind(fn, thisArg) {\n    return function wrap() {\n        var args = new Array(arguments.length);\n        for(var i = 0; i < args.length; i++)args[i] = arguments[i];\n        return fn.apply(thisArg, args);\n    };\n};\n\n},{}],\"kpuRe\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar buildURL = require(\"../helpers/buildURL\");\nvar InterceptorManager = require(\"./InterceptorManager\");\nvar dispatchRequest = require(\"./dispatchRequest\");\nvar mergeConfig = require(\"./mergeConfig\");\nvar validator = require(\"../helpers/validator\");\nvar validators = validator.validators;\n/**\n * Create a new instance of Axios\n *\n * @param {Object} instanceConfig The default config for the instance\n */ function Axios(instanceConfig) {\n    this.defaults = instanceConfig;\n    this.interceptors = {\n        request: new InterceptorManager(),\n        response: new InterceptorManager()\n    };\n}\n/**\n * Dispatch a request\n *\n * @param {Object} config The config specific for this request (merged with this.defaults)\n */ Axios.prototype.request = function request(config) {\n    /*eslint no-param-reassign:0*/ // Allow for axios('example/url'[, config]) a la fetch API\n    if (typeof config === \"string\") {\n        config = arguments[1] || {};\n        config.url = arguments[0];\n    } else config = config || {};\n    config = mergeConfig(this.defaults, config);\n    // Set config.method\n    if (config.method) config.method = config.method.toLowerCase();\n    else if (this.defaults.method) config.method = this.defaults.method.toLowerCase();\n    else config.method = \"get\";\n    var transitional = config.transitional;\n    if (transitional !== undefined) validator.assertOptions(transitional, {\n        silentJSONParsing: validators.transitional(validators.boolean, \"1.0.0\"),\n        forcedJSONParsing: validators.transitional(validators.boolean, \"1.0.0\"),\n        clarifyTimeoutError: validators.transitional(validators.boolean, \"1.0.0\")\n    }, false);\n    // filter out skipped interceptors\n    var requestInterceptorChain = [];\n    var synchronousRequestInterceptors = true;\n    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {\n        if (typeof interceptor.runWhen === \"function\" && interceptor.runWhen(config) === false) return;\n        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;\n        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);\n    });\n    var responseInterceptorChain = [];\n    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {\n        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);\n    });\n    var promise;\n    if (!synchronousRequestInterceptors) {\n        var chain = [\n            dispatchRequest,\n            undefined\n        ];\n        Array.prototype.unshift.apply(chain, requestInterceptorChain);\n        chain = chain.concat(responseInterceptorChain);\n        promise = Promise.resolve(config);\n        while(chain.length)promise = promise.then(chain.shift(), chain.shift());\n        return promise;\n    }\n    var newConfig = config;\n    while(requestInterceptorChain.length){\n        var onFulfilled = requestInterceptorChain.shift();\n        var onRejected = requestInterceptorChain.shift();\n        try {\n            newConfig = onFulfilled(newConfig);\n        } catch (error) {\n            onRejected(error);\n            break;\n        }\n    }\n    try {\n        promise = dispatchRequest(newConfig);\n    } catch (error) {\n        return Promise.reject(error);\n    }\n    while(responseInterceptorChain.length)promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());\n    return promise;\n};\nAxios.prototype.getUri = function getUri(config) {\n    config = mergeConfig(this.defaults, config);\n    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\\?/, \"\");\n};\n// Provide aliases for supported request methods\nutils.forEach([\n    \"delete\",\n    \"get\",\n    \"head\",\n    \"options\"\n], function forEachMethodNoData(method) {\n    /*eslint func-names:0*/ Axios.prototype[method] = function(url, config) {\n        return this.request(mergeConfig(config || {}, {\n            method: method,\n            url: url,\n            data: (config || {}).data\n        }));\n    };\n});\nutils.forEach([\n    \"post\",\n    \"put\",\n    \"patch\"\n], function forEachMethodWithData(method) {\n    /*eslint func-names:0*/ Axios.prototype[method] = function(url, data, config) {\n        return this.request(mergeConfig(config || {}, {\n            method: method,\n            url: url,\n            data: data\n        }));\n    };\n});\nmodule.exports = Axios;\n\n},{\"./../utils\":\"duYAn\",\"../helpers/buildURL\":\"ixGgI\",\"./InterceptorManager\":\"jkuDT\",\"./dispatchRequest\":\"32ROm\",\"./mergeConfig\":\"ibDVI\",\"../helpers/validator\":\"cTqr5\"}],\"ixGgI\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nfunction encode(val) {\n    return encodeURIComponent(val).replace(/%3A/gi, \":\").replace(/%24/g, \"$\").replace(/%2C/gi, \",\").replace(/%20/g, \"+\").replace(/%5B/gi, \"[\").replace(/%5D/gi, \"]\");\n}\n/**\n * Build a URL by appending params to the end\n *\n * @param {string} url The base of the url (e.g., http://www.google.com)\n * @param {object} [params] The params to be appended\n * @returns {string} The formatted url\n */ module.exports = function buildURL(url, params, paramsSerializer) {\n    /*eslint no-param-reassign:0*/ if (!params) return url;\n    var serializedParams;\n    if (paramsSerializer) serializedParams = paramsSerializer(params);\n    else if (utils.isURLSearchParams(params)) serializedParams = params.toString();\n    else {\n        var parts = [];\n        utils.forEach(params, function serialize(val, key) {\n            if (val === null || typeof val === \"undefined\") return;\n            if (utils.isArray(val)) key = key + \"[]\";\n            else val = [\n                val\n            ];\n            utils.forEach(val, function parseValue(v) {\n                if (utils.isDate(v)) v = v.toISOString();\n                else if (utils.isObject(v)) v = JSON.stringify(v);\n                parts.push(encode(key) + \"=\" + encode(v));\n            });\n        });\n        serializedParams = parts.join(\"&\");\n    }\n    if (serializedParams) {\n        var hashmarkIndex = url.indexOf(\"#\");\n        if (hashmarkIndex !== -1) url = url.slice(0, hashmarkIndex);\n        url += (url.indexOf(\"?\") === -1 ? \"?\" : \"&\") + serializedParams;\n    }\n    return url;\n};\n\n},{\"./../utils\":\"duYAn\"}],\"jkuDT\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nfunction InterceptorManager() {\n    this.handlers = [];\n}\n/**\n * Add a new interceptor to the stack\n *\n * @param {Function} fulfilled The function to handle `then` for a `Promise`\n * @param {Function} rejected The function to handle `reject` for a `Promise`\n *\n * @return {Number} An ID used to remove interceptor later\n */ InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {\n    this.handlers.push({\n        fulfilled: fulfilled,\n        rejected: rejected,\n        synchronous: options ? options.synchronous : false,\n        runWhen: options ? options.runWhen : null\n    });\n    return this.handlers.length - 1;\n};\n/**\n * Remove an interceptor from the stack\n *\n * @param {Number} id The ID that was returned by `use`\n */ InterceptorManager.prototype.eject = function eject(id) {\n    if (this.handlers[id]) this.handlers[id] = null;\n};\n/**\n * Iterate over all the registered interceptors\n *\n * This method is particularly useful for skipping over any\n * interceptors that may have become `null` calling `eject`.\n *\n * @param {Function} fn The function to call for each interceptor\n */ InterceptorManager.prototype.forEach = function forEach(fn) {\n    utils.forEach(this.handlers, function forEachHandler(h) {\n        if (h !== null) fn(h);\n    });\n};\nmodule.exports = InterceptorManager;\n\n},{\"./../utils\":\"duYAn\"}],\"32ROm\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar transformData = require(\"./transformData\");\nvar isCancel = require(\"../cancel/isCancel\");\nvar defaults = require(\"../defaults\");\n/**\n * Throws a `Cancel` if cancellation has been requested.\n */ function throwIfCancellationRequested(config) {\n    if (config.cancelToken) config.cancelToken.throwIfRequested();\n}\n/**\n * Dispatch a request to the server using the configured adapter.\n *\n * @param {object} config The config that is to be used for the request\n * @returns {Promise} The Promise to be fulfilled\n */ module.exports = function dispatchRequest(config) {\n    throwIfCancellationRequested(config);\n    // Ensure headers exist\n    config.headers = config.headers || {};\n    // Transform request data\n    config.data = transformData.call(config, config.data, config.headers, config.transformRequest);\n    // Flatten headers\n    config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers);\n    utils.forEach([\n        \"delete\",\n        \"get\",\n        \"head\",\n        \"post\",\n        \"put\",\n        \"patch\",\n        \"common\"\n    ], function cleanHeaderConfig(method) {\n        delete config.headers[method];\n    });\n    var adapter = config.adapter || defaults.adapter;\n    return adapter(config).then(function onAdapterResolution(response) {\n        throwIfCancellationRequested(config);\n        // Transform response data\n        response.data = transformData.call(config, response.data, response.headers, config.transformResponse);\n        return response;\n    }, function onAdapterRejection(reason) {\n        if (!isCancel(reason)) {\n            throwIfCancellationRequested(config);\n            // Transform response data\n            if (reason && reason.response) reason.response.data = transformData.call(config, reason.response.data, reason.response.headers, config.transformResponse);\n        }\n        return Promise.reject(reason);\n    });\n};\n\n},{\"./../utils\":\"duYAn\",\"./transformData\":\"lr274\",\"../cancel/isCancel\":\"hGa5h\",\"../defaults\":\"6fo2s\"}],\"lr274\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar defaults = require(\"./../defaults\");\n/**\n * Transform the data for a request or a response\n *\n * @param {Object|String} data The data to be transformed\n * @param {Array} headers The headers for the request or response\n * @param {Array|Function} fns A single function or Array of functions\n * @returns {*} The resulting transformed data\n */ module.exports = function transformData(data, headers, fns) {\n    var context = this || defaults;\n    /*eslint no-param-reassign:0*/ utils.forEach(fns, function transform(fn) {\n        data = fn.call(context, data, headers);\n    });\n    return data;\n};\n\n},{\"./../utils\":\"duYAn\",\"./../defaults\":\"6fo2s\"}],\"6fo2s\":[function(require,module,exports) {\n\"use strict\";\nvar process = require(\"process\");\nvar utils = require(\"./utils\");\nvar normalizeHeaderName = require(\"./helpers/normalizeHeaderName\");\nvar enhanceError = require(\"./core/enhanceError\");\nvar DEFAULT_CONTENT_TYPE = {\n    \"Content-Type\": \"application/x-www-form-urlencoded\"\n};\nfunction setContentTypeIfUnset(headers, value) {\n    if (!utils.isUndefined(headers) && utils.isUndefined(headers[\"Content-Type\"])) headers[\"Content-Type\"] = value;\n}\nfunction getDefaultAdapter() {\n    var adapter;\n    if (typeof XMLHttpRequest !== \"undefined\") // For browsers use XHR adapter\n    adapter = require(\"./adapters/xhr\");\n    else if (typeof process !== \"undefined\" && Object.prototype.toString.call(process) === \"[object process]\") // For node use HTTP adapter\n    adapter = require(\"./adapters/http\");\n    return adapter;\n}\nfunction stringifySafely(rawValue, parser, encoder) {\n    if (utils.isString(rawValue)) try {\n        (parser || JSON.parse)(rawValue);\n        return utils.trim(rawValue);\n    } catch (e) {\n        if (e.name !== \"SyntaxError\") throw e;\n    }\n    return (encoder || JSON.stringify)(rawValue);\n}\nvar defaults = {\n    transitional: {\n        silentJSONParsing: true,\n        forcedJSONParsing: true,\n        clarifyTimeoutError: false\n    },\n    adapter: getDefaultAdapter(),\n    transformRequest: [\n        function transformRequest(data, headers) {\n            normalizeHeaderName(headers, \"Accept\");\n            normalizeHeaderName(headers, \"Content-Type\");\n            if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) return data;\n            if (utils.isArrayBufferView(data)) return data.buffer;\n            if (utils.isURLSearchParams(data)) {\n                setContentTypeIfUnset(headers, \"application/x-www-form-urlencoded;charset=utf-8\");\n                return data.toString();\n            }\n            if (utils.isObject(data) || headers && headers[\"Content-Type\"] === \"application/json\") {\n                setContentTypeIfUnset(headers, \"application/json\");\n                return stringifySafely(data);\n            }\n            return data;\n        }\n    ],\n    transformResponse: [\n        function transformResponse(data) {\n            var transitional = this.transitional;\n            var silentJSONParsing = transitional && transitional.silentJSONParsing;\n            var forcedJSONParsing = transitional && transitional.forcedJSONParsing;\n            var strictJSONParsing = !silentJSONParsing && this.responseType === \"json\";\n            if (strictJSONParsing || forcedJSONParsing && utils.isString(data) && data.length) try {\n                return JSON.parse(data);\n            } catch (e) {\n                if (strictJSONParsing) {\n                    if (e.name === \"SyntaxError\") throw enhanceError(e, this, \"E_JSON_PARSE\");\n                    throw e;\n                }\n            }\n            return data;\n        }\n    ],\n    /**\n   * A timeout in milliseconds to abort a request. If set to 0 (default) a\n   * timeout is not created.\n   */ timeout: 0,\n    xsrfCookieName: \"XSRF-TOKEN\",\n    xsrfHeaderName: \"X-XSRF-TOKEN\",\n    maxContentLength: -1,\n    maxBodyLength: -1,\n    validateStatus: function validateStatus(status) {\n        return status >= 200 && status < 300;\n    }\n};\ndefaults.headers = {\n    common: {\n        \"Accept\": \"application/json, text/plain, */*\"\n    }\n};\nutils.forEach([\n    \"delete\",\n    \"get\",\n    \"head\"\n], function forEachMethodNoData(method) {\n    defaults.headers[method] = {};\n});\nutils.forEach([\n    \"post\",\n    \"put\",\n    \"patch\"\n], function forEachMethodWithData(method) {\n    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);\n});\nmodule.exports = defaults;\n\n},{\"process\":\"aND2C\",\"./utils\":\"duYAn\",\"./helpers/normalizeHeaderName\":\"60WUC\",\"./core/enhanceError\":\"l61XN\",\"./adapters/xhr\":\"4ZKwG\",\"./adapters/http\":\"4ZKwG\"}],\"60WUC\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"../utils\");\nmodule.exports = function normalizeHeaderName(headers, normalizedName) {\n    utils.forEach(headers, function processHeader(value, name) {\n        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {\n            headers[normalizedName] = value;\n            delete headers[name];\n        }\n    });\n};\n\n},{\"../utils\":\"duYAn\"}],\"l61XN\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Update an Error with the specified config, error code, and response.\n *\n * @param {Error} error The error to update.\n * @param {Object} config The config.\n * @param {string} [code] The error code (for example, 'ECONNABORTED').\n * @param {Object} [request] The request.\n * @param {Object} [response] The response.\n * @returns {Error} The error.\n */ module.exports = function enhanceError(error, config, code, request, response) {\n    error.config = config;\n    if (code) error.code = code;\n    error.request = request;\n    error.response = response;\n    error.isAxiosError = true;\n    error.toJSON = function toJSON() {\n        return {\n            // Standard\n            message: this.message,\n            name: this.name,\n            // Microsoft\n            description: this.description,\n            number: this.number,\n            // Mozilla\n            fileName: this.fileName,\n            lineNumber: this.lineNumber,\n            columnNumber: this.columnNumber,\n            stack: this.stack,\n            // Axios\n            config: this.config,\n            code: this.code\n        };\n    };\n    return error;\n};\n\n},{}],\"4ZKwG\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar settle = require(\"./../core/settle\");\nvar cookies = require(\"./../helpers/cookies\");\nvar buildURL = require(\"./../helpers/buildURL\");\nvar buildFullPath = require(\"../core/buildFullPath\");\nvar parseHeaders = require(\"./../helpers/parseHeaders\");\nvar isURLSameOrigin = require(\"./../helpers/isURLSameOrigin\");\nvar createError = require(\"../core/createError\");\nmodule.exports = function xhrAdapter(config) {\n    return new Promise(function dispatchXhrRequest(resolve, reject) {\n        var requestData = config.data;\n        var requestHeaders = config.headers;\n        var responseType = config.responseType;\n        if (utils.isFormData(requestData)) delete requestHeaders[\"Content-Type\"]; // Let the browser set it\n        var request = new XMLHttpRequest();\n        // HTTP basic authentication\n        if (config.auth) {\n            var username = config.auth.username || \"\";\n            var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : \"\";\n            requestHeaders.Authorization = \"Basic \" + btoa(username + \":\" + password);\n        }\n        var fullPath = buildFullPath(config.baseURL, config.url);\n        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);\n        // Set the request timeout in MS\n        request.timeout = config.timeout;\n        function onloadend() {\n            if (!request) return;\n            // Prepare the response\n            var responseHeaders = \"getAllResponseHeaders\" in request ? parseHeaders(request.getAllResponseHeaders()) : null;\n            var responseData = !responseType || responseType === \"text\" || responseType === \"json\" ? request.responseText : request.response;\n            var response = {\n                data: responseData,\n                status: request.status,\n                statusText: request.statusText,\n                headers: responseHeaders,\n                config: config,\n                request: request\n            };\n            settle(resolve, reject, response);\n            // Clean up request\n            request = null;\n        }\n        if (\"onloadend\" in request) // Use onloadend if available\n        request.onloadend = onloadend;\n        else // Listen for ready state to emulate onloadend\n        request.onreadystatechange = function handleLoad() {\n            if (!request || request.readyState !== 4) return;\n            // The request errored out and we didn't get a response, this will be\n            // handled by onerror instead\n            // With one exception: request that using file: protocol, most browsers\n            // will return status as 0 even though it's a successful request\n            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf(\"file:\") === 0)) return;\n            // readystate handler is calling before onerror or ontimeout handlers,\n            // so we should call onloadend on the next 'tick'\n            setTimeout(onloadend);\n        };\n        // Handle browser request cancellation (as opposed to a manual cancellation)\n        request.onabort = function handleAbort() {\n            if (!request) return;\n            reject(createError(\"Request aborted\", config, \"ECONNABORTED\", request));\n            // Clean up request\n            request = null;\n        };\n        // Handle low level network errors\n        request.onerror = function handleError() {\n            // Real errors are hidden from us by the browser\n            // onerror should only fire if it's a network error\n            reject(createError(\"Network Error\", config, null, request));\n            // Clean up request\n            request = null;\n        };\n        // Handle timeout\n        request.ontimeout = function handleTimeout() {\n            var timeoutErrorMessage = \"timeout of \" + config.timeout + \"ms exceeded\";\n            if (config.timeoutErrorMessage) timeoutErrorMessage = config.timeoutErrorMessage;\n            reject(createError(timeoutErrorMessage, config, config.transitional && config.transitional.clarifyTimeoutError ? \"ETIMEDOUT\" : \"ECONNABORTED\", request));\n            // Clean up request\n            request = null;\n        };\n        // Add xsrf header\n        // This is only done if running in a standard browser environment.\n        // Specifically not if we're in a web worker, or react-native.\n        if (utils.isStandardBrowserEnv()) {\n            // Add xsrf header\n            var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : undefined;\n            if (xsrfValue) requestHeaders[config.xsrfHeaderName] = xsrfValue;\n        }\n        // Add headers to the request\n        if (\"setRequestHeader\" in request) utils.forEach(requestHeaders, function setRequestHeader(val, key) {\n            if (typeof requestData === \"undefined\" && key.toLowerCase() === \"content-type\") // Remove Content-Type if data is undefined\n            delete requestHeaders[key];\n            else // Otherwise add header to the request\n            request.setRequestHeader(key, val);\n        });\n        // Add withCredentials to request if needed\n        if (!utils.isUndefined(config.withCredentials)) request.withCredentials = !!config.withCredentials;\n        // Add responseType to request if needed\n        if (responseType && responseType !== \"json\") request.responseType = config.responseType;\n        // Handle progress if needed\n        if (typeof config.onDownloadProgress === \"function\") request.addEventListener(\"progress\", config.onDownloadProgress);\n        // Not all browsers support upload events\n        if (typeof config.onUploadProgress === \"function\" && request.upload) request.upload.addEventListener(\"progress\", config.onUploadProgress);\n        if (config.cancelToken) // Handle cancellation\n        config.cancelToken.promise.then(function onCanceled(cancel) {\n            if (!request) return;\n            request.abort();\n            reject(cancel);\n            // Clean up request\n            request = null;\n        });\n        if (!requestData) requestData = null;\n        // Send the request\n        request.send(requestData);\n    });\n};\n\n},{\"./../utils\":\"duYAn\",\"./../core/settle\":\"fwlzf\",\"./../helpers/cookies\":\"prIUM\",\"./../helpers/buildURL\":\"ixGgI\",\"../core/buildFullPath\":\"6Exrt\",\"./../helpers/parseHeaders\":\"9f9f7\",\"./../helpers/isURLSameOrigin\":\"7Y5Pi\",\"../core/createError\":\"4vGKg\"}],\"fwlzf\":[function(require,module,exports) {\n\"use strict\";\nvar createError = require(\"./createError\");\n/**\n * Resolve or reject a Promise based on response status.\n *\n * @param {Function} resolve A function that resolves the promise.\n * @param {Function} reject A function that rejects the promise.\n * @param {object} response The response.\n */ module.exports = function settle(resolve, reject, response) {\n    var validateStatus = response.config.validateStatus;\n    if (!response.status || !validateStatus || validateStatus(response.status)) resolve(response);\n    else reject(createError(\"Request failed with status code \" + response.status, response.config, null, response.request, response));\n};\n\n},{\"./createError\":\"4vGKg\"}],\"4vGKg\":[function(require,module,exports) {\n\"use strict\";\nvar enhanceError = require(\"./enhanceError\");\n/**\n * Create an Error with the specified message, config, error code, request and response.\n *\n * @param {string} message The error message.\n * @param {Object} config The config.\n * @param {string} [code] The error code (for example, 'ECONNABORTED').\n * @param {Object} [request] The request.\n * @param {Object} [response] The response.\n * @returns {Error} The created error.\n */ module.exports = function createError(message, config, code, request, response) {\n    var error = new Error(message);\n    return enhanceError(error, config, code, request, response);\n};\n\n},{\"./enhanceError\":\"l61XN\"}],\"prIUM\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nmodule.exports = utils.isStandardBrowserEnv() ? // Standard browser envs support document.cookie\nfunction standardBrowserEnv() {\n    return {\n        write: function write(name, value, expires, path, domain, secure) {\n            var cookie = [];\n            cookie.push(name + \"=\" + encodeURIComponent(value));\n            if (utils.isNumber(expires)) cookie.push(\"expires=\" + new Date(expires).toGMTString());\n            if (utils.isString(path)) cookie.push(\"path=\" + path);\n            if (utils.isString(domain)) cookie.push(\"domain=\" + domain);\n            if (secure === true) cookie.push(\"secure\");\n            document.cookie = cookie.join(\"; \");\n        },\n        read: function read(name) {\n            var match = document.cookie.match(new RegExp(\"(^|;\\\\s*)(\" + name + \")=([^;]*)\"));\n            return match ? decodeURIComponent(match[3]) : null;\n        },\n        remove: function remove(name) {\n            this.write(name, \"\", Date.now() - 86400000);\n        }\n    };\n}() : // Non standard browser env (web workers, react-native) lack needed support.\nfunction nonStandardBrowserEnv() {\n    return {\n        write: function write() {},\n        read: function read() {\n            return null;\n        },\n        remove: function remove() {}\n    };\n}();\n\n},{\"./../utils\":\"duYAn\"}],\"6Exrt\":[function(require,module,exports) {\n\"use strict\";\nvar isAbsoluteURL = require(\"../helpers/isAbsoluteURL\");\nvar combineURLs = require(\"../helpers/combineURLs\");\n/**\n * Creates a new URL by combining the baseURL with the requestedURL,\n * only when the requestedURL is not already an absolute URL.\n * If the requestURL is absolute, this function returns the requestedURL untouched.\n *\n * @param {string} baseURL The base URL\n * @param {string} requestedURL Absolute or relative URL to combine\n * @returns {string} The combined full path\n */ module.exports = function buildFullPath(baseURL, requestedURL) {\n    if (baseURL && !isAbsoluteURL(requestedURL)) return combineURLs(baseURL, requestedURL);\n    return requestedURL;\n};\n\n},{\"../helpers/isAbsoluteURL\":\"ixw6G\",\"../helpers/combineURLs\":\"jGtkp\"}],\"ixw6G\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Determines whether the specified URL is absolute\n *\n * @param {string} url The URL to test\n * @returns {boolean} True if the specified URL is absolute, otherwise false\n */ module.exports = function isAbsoluteURL(url) {\n    // A URL is considered absolute if it begins with \"<scheme>://\" or \"//\" (protocol-relative URL).\n    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed\n    // by any combination of letters, digits, plus, period, or hyphen.\n    return /^([a-z][a-z\\d\\+\\-\\.]*:)?\\/\\//i.test(url);\n};\n\n},{}],\"jGtkp\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Creates a new URL by combining the specified URLs\n *\n * @param {string} baseURL The base URL\n * @param {string} relativeURL The relative URL\n * @returns {string} The combined URL\n */ module.exports = function combineURLs(baseURL, relativeURL) {\n    return relativeURL ? baseURL.replace(/\\/+$/, \"\") + \"/\" + relativeURL.replace(/^\\/+/, \"\") : baseURL;\n};\n\n},{}],\"9f9f7\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\n// Headers whose duplicates are ignored by node\n// c.f. https://nodejs.org/api/http.html#http_message_headers\nvar ignoreDuplicateOf = [\n    \"age\",\n    \"authorization\",\n    \"content-length\",\n    \"content-type\",\n    \"etag\",\n    \"expires\",\n    \"from\",\n    \"host\",\n    \"if-modified-since\",\n    \"if-unmodified-since\",\n    \"last-modified\",\n    \"location\",\n    \"max-forwards\",\n    \"proxy-authorization\",\n    \"referer\",\n    \"retry-after\",\n    \"user-agent\"\n];\n/**\n * Parse headers into an object\n *\n * ```\n * Date: Wed, 27 Aug 2014 08:58:49 GMT\n * Content-Type: application/json\n * Connection: keep-alive\n * Transfer-Encoding: chunked\n * ```\n *\n * @param {String} headers Headers needing to be parsed\n * @returns {Object} Headers parsed into an object\n */ module.exports = function parseHeaders(headers) {\n    var parsed = {};\n    var key;\n    var val;\n    var i;\n    if (!headers) return parsed;\n    utils.forEach(headers.split(\"\\n\"), function parser(line) {\n        i = line.indexOf(\":\");\n        key = utils.trim(line.substr(0, i)).toLowerCase();\n        val = utils.trim(line.substr(i + 1));\n        if (key) {\n            if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) return;\n            if (key === \"set-cookie\") parsed[key] = (parsed[key] ? parsed[key] : []).concat([\n                val\n            ]);\n            else parsed[key] = parsed[key] ? parsed[key] + \", \" + val : val;\n        }\n    });\n    return parsed;\n};\n\n},{\"./../utils\":\"duYAn\"}],\"7Y5Pi\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nmodule.exports = utils.isStandardBrowserEnv() ? // Standard browser envs have full support of the APIs needed to test\n// whether the request URL is of the same origin as current location.\nfunction standardBrowserEnv() {\n    var msie = /(msie|trident)/i.test(navigator.userAgent);\n    var urlParsingNode = document.createElement(\"a\");\n    var originURL;\n    /**\n    * Parse a URL to discover it's components\n    *\n    * @param {String} url The URL to be parsed\n    * @returns {Object}\n    */ function resolveURL(url) {\n        var href = url;\n        if (msie) {\n            // IE needs attribute set twice to normalize properties\n            urlParsingNode.setAttribute(\"href\", href);\n            href = urlParsingNode.href;\n        }\n        urlParsingNode.setAttribute(\"href\", href);\n        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils\n        return {\n            href: urlParsingNode.href,\n            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, \"\") : \"\",\n            host: urlParsingNode.host,\n            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\\?/, \"\") : \"\",\n            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, \"\") : \"\",\n            hostname: urlParsingNode.hostname,\n            port: urlParsingNode.port,\n            pathname: urlParsingNode.pathname.charAt(0) === \"/\" ? urlParsingNode.pathname : \"/\" + urlParsingNode.pathname\n        };\n    }\n    originURL = resolveURL(window.location.href);\n    /**\n    * Determine if a URL shares the same origin as the current location\n    *\n    * @param {String} requestURL The URL to test\n    * @returns {boolean} True if URL shares the same origin, otherwise false\n    */ return function isURLSameOrigin(requestURL) {\n        var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;\n        return parsed.protocol === originURL.protocol && parsed.host === originURL.host;\n    };\n}() : // Non standard browser envs (web workers, react-native) lack needed support.\nfunction nonStandardBrowserEnv() {\n    return function isURLSameOrigin() {\n        return true;\n    };\n}();\n\n},{\"./../utils\":\"duYAn\"}],\"hGa5h\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function isCancel(value) {\n    return !!(value && value.__CANCEL__);\n};\n\n},{}],\"ibDVI\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"../utils\");\n/**\n * Config-specific merge-function which creates a new config-object\n * by merging two configuration objects together.\n *\n * @param {Object} config1\n * @param {Object} config2\n * @returns {Object} New object resulting from merging config2 to config1\n */ module.exports = function mergeConfig(config1, config2) {\n    // eslint-disable-next-line no-param-reassign\n    config2 = config2 || {};\n    var config = {};\n    var valueFromConfig2Keys = [\n        \"url\",\n        \"method\",\n        \"data\"\n    ];\n    var mergeDeepPropertiesKeys = [\n        \"headers\",\n        \"auth\",\n        \"proxy\",\n        \"params\"\n    ];\n    var defaultToConfig2Keys = [\n        \"baseURL\",\n        \"transformRequest\",\n        \"transformResponse\",\n        \"paramsSerializer\",\n        \"timeout\",\n        \"timeoutMessage\",\n        \"withCredentials\",\n        \"adapter\",\n        \"responseType\",\n        \"xsrfCookieName\",\n        \"xsrfHeaderName\",\n        \"onUploadProgress\",\n        \"onDownloadProgress\",\n        \"decompress\",\n        \"maxContentLength\",\n        \"maxBodyLength\",\n        \"maxRedirects\",\n        \"transport\",\n        \"httpAgent\",\n        \"httpsAgent\",\n        \"cancelToken\",\n        \"socketPath\",\n        \"responseEncoding\"\n    ];\n    var directMergeKeys = [\n        \"validateStatus\"\n    ];\n    function getMergedValue(target, source) {\n        if (utils.isPlainObject(target) && utils.isPlainObject(source)) return utils.merge(target, source);\n        else if (utils.isPlainObject(source)) return utils.merge({}, source);\n        else if (utils.isArray(source)) return source.slice();\n        return source;\n    }\n    function mergeDeepProperties(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(config1[prop], config2[prop]);\n        else if (!utils.isUndefined(config1[prop])) config[prop] = getMergedValue(undefined, config1[prop]);\n    }\n    utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(undefined, config2[prop]);\n    });\n    utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);\n    utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(undefined, config2[prop]);\n        else if (!utils.isUndefined(config1[prop])) config[prop] = getMergedValue(undefined, config1[prop]);\n    });\n    utils.forEach(directMergeKeys, function merge(prop) {\n        if (prop in config2) config[prop] = getMergedValue(config1[prop], config2[prop]);\n        else if (prop in config1) config[prop] = getMergedValue(undefined, config1[prop]);\n    });\n    var axiosKeys = valueFromConfig2Keys.concat(mergeDeepPropertiesKeys).concat(defaultToConfig2Keys).concat(directMergeKeys);\n    var otherKeys = Object.keys(config1).concat(Object.keys(config2)).filter(function filterAxiosKeys(key) {\n        return axiosKeys.indexOf(key) === -1;\n    });\n    utils.forEach(otherKeys, mergeDeepProperties);\n    return config;\n};\n\n},{\"../utils\":\"duYAn\"}],\"cTqr5\":[function(require,module,exports) {\n\"use strict\";\nvar pkg = require(\"./../../package.json\");\nvar validators = {};\n// eslint-disable-next-line func-names\n[\n    \"object\",\n    \"boolean\",\n    \"number\",\n    \"function\",\n    \"string\",\n    \"symbol\"\n].forEach(function(type, i) {\n    validators[type] = function validator(thing) {\n        return typeof thing === type || \"a\" + (i < 1 ? \"n \" : \" \") + type;\n    };\n});\nvar deprecatedWarnings = {};\nvar currentVerArr = pkg.version.split(\".\");\n/**\n * Compare package versions\n * @param {string} version\n * @param {string?} thanVersion\n * @returns {boolean}\n */ function isOlderVersion(version, thanVersion) {\n    var pkgVersionArr = thanVersion ? thanVersion.split(\".\") : currentVerArr;\n    var destVer = version.split(\".\");\n    for(var i = 0; i < 3; i++){\n        if (pkgVersionArr[i] > destVer[i]) return true;\n        else if (pkgVersionArr[i] < destVer[i]) return false;\n    }\n    return false;\n}\n/**\n * Transitional option validator\n * @param {function|boolean?} validator\n * @param {string?} version\n * @param {string} message\n * @returns {function}\n */ validators.transitional = function transitional(validator, version, message) {\n    var isDeprecated = version && isOlderVersion(version);\n    function formatMessage(opt, desc) {\n        return \"[Axios v\" + pkg.version + \"] Transitional option '\" + opt + \"'\" + desc + (message ? \". \" + message : \"\");\n    }\n    // eslint-disable-next-line func-names\n    return function(value, opt, opts) {\n        if (validator === false) throw new Error(formatMessage(opt, \" has been removed in \" + version));\n        if (isDeprecated && !deprecatedWarnings[opt]) {\n            deprecatedWarnings[opt] = true;\n            // eslint-disable-next-line no-console\n            console.warn(formatMessage(opt, \" has been deprecated since v\" + version + \" and will be removed in the near future\"));\n        }\n        return validator ? validator(value, opt, opts) : true;\n    };\n};\n/**\n * Assert object's properties type\n * @param {object} options\n * @param {object} schema\n * @param {boolean?} allowUnknown\n */ function assertOptions(options, schema, allowUnknown) {\n    if (typeof options !== \"object\") throw new TypeError(\"options must be an object\");\n    var keys = Object.keys(options);\n    var i = keys.length;\n    while(i-- > 0){\n        var opt = keys[i];\n        var validator = schema[opt];\n        if (validator) {\n            var value = options[opt];\n            var result = value === undefined || validator(value, opt, options);\n            if (result !== true) throw new TypeError(\"option \" + opt + \" must be \" + result);\n            continue;\n        }\n        if (allowUnknown !== true) throw Error(\"Unknown option \" + opt);\n    }\n}\nmodule.exports = {\n    isOlderVersion: isOlderVersion,\n    assertOptions: assertOptions,\n    validators: validators\n};\n\n},{\"./../../package.json\":\"69pP4\"}],\"69pP4\":[function(require,module,exports) {\nmodule.exports = JSON.parse('{\"name\":\"axios\",\"version\":\"0.21.4\",\"description\":\"Promise based HTTP client for the browser and node.js\",\"main\":\"index.js\",\"scripts\":{\"test\":\"grunt test\",\"start\":\"node ./sandbox/server.js\",\"build\":\"NODE_ENV=production grunt build\",\"preversion\":\"npm test\",\"version\":\"npm run build && grunt version && git add -A dist && git add CHANGELOG.md bower.json package.json\",\"postversion\":\"git push && git push --tags\",\"examples\":\"node ./examples/server.js\",\"coveralls\":\"cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js\",\"fix\":\"eslint --fix lib/**/*.js\"},\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/axios/axios.git\"},\"keywords\":[\"xhr\",\"http\",\"ajax\",\"promise\",\"node\"],\"author\":\"Matt Zabriskie\",\"license\":\"MIT\",\"bugs\":{\"url\":\"https://github.com/axios/axios/issues\"},\"homepage\":\"https://axios-http.com\",\"devDependencies\":{\"coveralls\":\"^3.0.0\",\"es6-promise\":\"^4.2.4\",\"grunt\":\"^1.3.0\",\"grunt-banner\":\"^0.6.0\",\"grunt-cli\":\"^1.2.0\",\"grunt-contrib-clean\":\"^1.1.0\",\"grunt-contrib-watch\":\"^1.0.0\",\"grunt-eslint\":\"^23.0.0\",\"grunt-karma\":\"^4.0.0\",\"grunt-mocha-test\":\"^0.13.3\",\"grunt-ts\":\"^6.0.0-beta.19\",\"grunt-webpack\":\"^4.0.2\",\"istanbul-instrumenter-loader\":\"^1.0.0\",\"jasmine-core\":\"^2.4.1\",\"karma\":\"^6.3.2\",\"karma-chrome-launcher\":\"^3.1.0\",\"karma-firefox-launcher\":\"^2.1.0\",\"karma-jasmine\":\"^1.1.1\",\"karma-jasmine-ajax\":\"^0.1.13\",\"karma-safari-launcher\":\"^1.0.0\",\"karma-sauce-launcher\":\"^4.3.6\",\"karma-sinon\":\"^1.0.5\",\"karma-sourcemap-loader\":\"^0.3.8\",\"karma-webpack\":\"^4.0.2\",\"load-grunt-tasks\":\"^3.5.2\",\"minimist\":\"^1.2.0\",\"mocha\":\"^8.2.1\",\"sinon\":\"^4.5.0\",\"terser-webpack-plugin\":\"^4.2.3\",\"typescript\":\"^4.0.5\",\"url-search-params\":\"^0.10.0\",\"webpack\":\"^4.44.2\",\"webpack-dev-server\":\"^3.11.0\"},\"browser\":{\"./lib/adapters/http.js\":\"./lib/adapters/xhr.js\"},\"jsdelivr\":\"dist/axios.min.js\",\"unpkg\":\"dist/axios.min.js\",\"typings\":\"./index.d.ts\",\"dependencies\":{\"follow-redirects\":\"^1.14.0\"},\"bundlesize\":[{\"path\":\"./dist/axios.min.js\",\"threshold\":\"5kB\"}]}');\n\n},{}],\"8kjT7\":[function(require,module,exports) {\n\"use strict\";\n/**\n * A `Cancel` is an object that is thrown when an operation is canceled.\n *\n * @class\n * @param {string=} message The message.\n */ function Cancel(message) {\n    this.message = message;\n}\nCancel.prototype.toString = function toString() {\n    return \"Cancel\" + (this.message ? \": \" + this.message : \"\");\n};\nCancel.prototype.__CANCEL__ = true;\nmodule.exports = Cancel;\n\n},{}],\"3pdZx\":[function(require,module,exports) {\n\"use strict\";\nvar Cancel = require(\"./Cancel\");\n/**\n * A `CancelToken` is an object that can be used to request cancellation of an operation.\n *\n * @class\n * @param {Function} executor The executor function.\n */ function CancelToken(executor) {\n    if (typeof executor !== \"function\") throw new TypeError(\"executor must be a function.\");\n    var resolvePromise;\n    this.promise = new Promise(function promiseExecutor(resolve) {\n        resolvePromise = resolve;\n    });\n    var token = this;\n    executor(function cancel(message) {\n        if (token.reason) // Cancellation has already been requested\n        return;\n        token.reason = new Cancel(message);\n        resolvePromise(token.reason);\n    });\n}\n/**\n * Throws a `Cancel` if cancellation has been requested.\n */ CancelToken.prototype.throwIfRequested = function throwIfRequested() {\n    if (this.reason) throw this.reason;\n};\n/**\n * Returns an object that contains a new `CancelToken` and a function that, when called,\n * cancels the `CancelToken`.\n */ CancelToken.source = function source() {\n    var cancel;\n    var token = new CancelToken(function executor(c) {\n        cancel = c;\n    });\n    return {\n        token: token,\n        cancel: cancel\n    };\n};\nmodule.exports = CancelToken;\n\n},{\"./Cancel\":\"8kjT7\"}],\"iD93M\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Syntactic sugar for invoking a function and expanding an array for arguments.\n *\n * Common use case would be to use `Function.prototype.apply`.\n *\n *  ```js\n *  function f(x, y, z) {}\n *  var args = [1, 2, 3];\n *  f.apply(null, args);\n *  ```\n *\n * With `spread` this example can be re-written.\n *\n *  ```js\n *  spread(function(x, y, z) {})([1, 2, 3]);\n *  ```\n *\n * @param {Function} callback\n * @returns {Function}\n */ module.exports = function spread(callback) {\n    return function wrap(arr) {\n        return callback.apply(null, arr);\n    };\n};\n\n},{}],\"ewarG\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Determines whether the payload is an error thrown by Axios\n *\n * @param {*} payload The value to test\n * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false\n */ module.exports = function isAxiosError(payload) {\n    return typeof payload === \"object\" && payload.isAxiosError === true;\n};\n\n},{}],\"4m0ZM\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nfunction safeJsonParse(value) {\n    if (typeof value !== \"string\") throw new Error(`Cannot safe json parse value of type ${typeof value}`);\n    try {\n        return JSON.parse(value);\n    } catch (_a) {\n        return value;\n    }\n}\nexports.safeJsonParse = safeJsonParse;\nfunction safeJsonStringify(value1) {\n    return typeof value1 === \"string\" ? value1 : JSON.stringify(value1, (key, value)=>typeof value === \"undefined\" ? null : value);\n}\nexports.safeJsonStringify = safeJsonStringify;\n\n},{}],\"j4VRk\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isLocalhostUrl = exports.isWsUrl = exports.isHttpUrl = void 0;\nconst HTTP_REGEX = \"^https?:\";\nconst WS_REGEX = \"^wss?:\";\nfunction getUrlProtocol(url) {\n    const matches = url.match(new RegExp(/^\\w+:/, \"gi\"));\n    if (!matches || !matches.length) return;\n    return matches[0];\n}\nfunction matchRegexProtocol(url, regex) {\n    const protocol = getUrlProtocol(url);\n    if (typeof protocol === \"undefined\") return false;\n    return new RegExp(regex).test(protocol);\n}\nfunction isHttpUrl(url) {\n    return matchRegexProtocol(url, HTTP_REGEX);\n}\nexports.isHttpUrl = isHttpUrl;\nfunction isWsUrl(url) {\n    return matchRegexProtocol(url, WS_REGEX);\n}\nexports.isWsUrl = isWsUrl;\nfunction isLocalhostUrl(url) {\n    return new RegExp(\"wss?://localhost(:d{2,5})?\").test(url);\n}\nexports.isLocalhostUrl = isLocalhostUrl;\n\n},{}],\"a55sm\":[function(require,module,exports) {\n\"use strict\";\nvar global = arguments[3];\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.WsConnection = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst safe_json_utils_1 = require(\"safe-json-utils\");\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst url_1 = require(\"./url\");\nconst WS = typeof global.WebSocket !== \"undefined\" ? global.WebSocket : require(\"ws\");\nclass WsConnection {\n    get connected() {\n        return typeof this.socket !== \"undefined\";\n    }\n    get connecting() {\n        return this.registering;\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    open(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.socket = yield this.register(url);\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.socket === \"undefined\") throw new Error(\"Already disconnected\");\n            this.socket.close();\n            this.onClose();\n        });\n    }\n    send(payload, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.socket === \"undefined\") this.socket = yield this.register();\n            this.socket.send(safe_json_utils_1.safeJsonStringify(payload));\n        });\n    }\n    register(url = this.url) {\n        if (!url_1.isWsUrl(url)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${url}`);\n        if (this.registering) return new Promise((resolve, reject)=>{\n            this.events.once(\"open\", ()=>{\n                if (typeof this.socket === \"undefined\") return reject(new Error(\"WebSocket connection is missing or invalid\"));\n                resolve(this.socket);\n            });\n        });\n        this.url = url;\n        this.registering = true;\n        return new Promise((resolve, reject)=>{\n            const opts = !utils_1.isReactNative() ? {\n                rejectUnauthorized: !url_1.isLocalhostUrl(url)\n            } : undefined;\n            const socket = new WS(url, [], opts);\n            socket.onopen = ()=>{\n                this.onOpen(socket);\n                resolve(socket);\n            };\n            socket.onerror = (event)=>{\n                this.events.emit(\"error\", event);\n                reject(event);\n            };\n        });\n    }\n    onOpen(socket) {\n        socket.onmessage = (event)=>this.onPayload(event);\n        socket.onclose = ()=>this.onClose();\n        this.socket = socket;\n        this.registering = false;\n        this.events.emit(\"open\");\n    }\n    onClose() {\n        this.socket = undefined;\n        this.events.emit(\"close\");\n    }\n    onPayload(e) {\n        if (typeof e.data === \"undefined\") return;\n        const payload = typeof e.data === \"string\" ? safe_json_utils_1.safeJsonParse(e.data) : e.data;\n        this.events.emit(\"payload\", payload);\n    }\n    constructor(url){\n        this.url = url;\n        this.events = new events_1.EventEmitter();\n        this.registering = false;\n        if (!url_1.isWsUrl(url)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${url}`);\n        this.url = url;\n    }\n}\nexports.WsConnection = WsConnection;\n\n},{\"tslib\":\"DcZ3h\",\"events\":\"1xaZJ\",\"safe-json-utils\":\"4m0ZM\",\"@json-rpc-tools/utils\":\"czhHe\",\"./url\":\"j4VRk\",\"ws\":\"4TXbV\"}],\"4TXbV\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function() {\n    throw new Error(\"ws does not work in the browser. Browser clients must use the native WebSocket object\");\n};\n\n},{}],\"aQWhl\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"WalletNameFlag\", ()=>(0, _walletNameFlag.WalletNameFlag));\nvar _walletNameFlag = require(\"src/background/Wallet/model/WalletNameFlag\");\n\n},{\"src/background/Wallet/model/WalletNameFlag\":\"jneXN\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"4IpBY\"}],\"jneXN\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"WalletNameFlag\", ()=>WalletNameFlag);\nlet WalletNameFlag;\n(function(WalletNameFlag1) {\n    WalletNameFlag1[WalletNameFlag1[\"isMetaMask\"] = 0] = \"isMetaMask\";\n})(WalletNameFlag || (WalletNameFlag = {}));\n\n},{\"@parcel/transformer-js/src/esmodule-helpers.js\":\"4IpBY\"}],\"5utHt\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"Connection\", ()=>Connection);\nvar _definePropertyJs = require(\"@swc/helpers/lib/_define_property.js\");\nvar _definePropertyJsDefault = parcelHelpers.interopDefault(_definePropertyJs);\nvar _events = require(\"events\");\nvar _eventsDefault = parcelHelpers.interopDefault(_events);\nvar _utils = require(\"@json-rpc-tools/utils\");\nclass Connection extends (0, _eventsDefault.default) {\n    async open() {\n        return Promise.resolve().then(()=>{\n            this.connected = true;\n        });\n    }\n    async close() {\n        return Promise.resolve();\n    }\n    send(payload) {\n        this.broadcastChannel.postMessage(payload);\n        return this.getPromise(payload.id);\n    }\n    getPromise(id) {\n        return new Promise((resolve, reject)=>{\n            const handler = (event)=>{\n                const { data  } = event;\n                if (data.id === id && (0, _utils.isJsonRpcResponse)(data)) {\n                    if ((0, _utils.isJsonRpcError)(data)) reject(data.error);\n                    else resolve(data.result);\n                    this.broadcastChannel.removeEventListener(\"message\", handler);\n                }\n            };\n            this.broadcastChannel.addEventListener(\"message\", handler);\n        });\n    }\n    constructor(broadcastChannel){\n        super();\n        (0, _definePropertyJsDefault.default)(this, \"events\", new (0, _eventsDefault.default)());\n        (0, _definePropertyJsDefault.default)(this, \"connected\", false);\n        (0, _definePropertyJsDefault.default)(this, \"connecting\", false);\n        this.broadcastChannel = broadcastChannel;\n        this.broadcastChannel.addEventListener(\"message\", (event)=>{\n            var ref;\n            if (((ref = event.data) === null || ref === void 0 ? void 0 : ref.type) === \"ethereumEvent\") this.emit(\"ethereumEvent\", {\n                event: event.data.event,\n                value: event.data.value\n            });\n            else this.emit(\"payload\", event.data);\n        });\n    }\n}\n\n},{\"@swc/helpers/lib/_define_property.js\":\"kkblX\",\"events\":\"1xaZJ\",\"@json-rpc-tools/utils\":\"czhHe\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"4IpBY\"}]},[\"cxqj5\"], \"cxqj5\", \"parcelRequire7f4b\")\n\n";

},{}]},["cCMa2"], "cCMa2", "parcelRequire7f4b")

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RyxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQUMsU0FBUztnQkFDakQ7b0JBQ0ksSUFBSSxDQUFFLENBQUEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBLEFBQUMsSUFBSyxDQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLEVBQUU7d0JBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFBQyxTQUFTO3FCQUFFO29CQUM1RyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUssQ0FBQSxDQUFDLENBQUMsSUFBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsQ0FBQSxBQUFDLEVBQUU7d0JBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQUMsTUFBTTtxQkFBRTtvQkFDdEYsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7d0JBQUMsTUFBTTtxQkFBRTtvQkFDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxD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Y0FBYyxDQUFDLENBQUMsT0FBTyxJQUM1RCxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsT0FBTyxFQUV4QyxPQUFPO1lBQ0wsS0FBSyxFQUFFLEtBQUs7WUFDWixLQUFLLEVBQUUsQ0FBQSx5Q0FBQSxFQUE0QyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQSxDQUFFO1NBQ3pFLENBQUM7S0FFTDtJQUNELE9BQU87UUFBRSxLQUFLLEVBQUUsSUFBSTtLQUFFLENBQUM7Q0FDeEI7QUExQkQsT0FBQSxDQUFBLG9CQUFBLEdBQUEsb0JBQUEsQ0EwQkM7OztBLFksQztBLE0sQyxjLEMsTyxFLFksRTtJLEssRSxJO0MsQyxDO0EsTyxDLFEsRyxLLEMsQztBLE0sTyxHLE8sQyxPLEMsQTtBRTlERCxNQUFBLGFBQUEsR0FBQSxPQUFBLENBQUEsdUJBQUEsQ0FBQSxBQUErQztBQUdsQyxPQUFBLENBQUEsUUFBUSxHQUFHLGFBQUEsQ0FBQSxNQUFNLENBQUM7QUFFL0IsT0FBQSxDQUFBLFlBQUEsQ0FBQSxPQUFBLENBQUEsdUJBQUEsQ0FBQSxFQUFBLE9BQUEsQ0FBQSxDQUFzQzs7O0EsWSxDO0EsSSxlLEcsQSxJLEksSSxDLGUsSSxDLE0sQyxNLEcsUyxDLEUsQyxFLEMsRSxFLEU7SSxJLEUsSyxTLEUsRSxHLEMsQztJLE0sQyxjLEMsQyxFLEUsRTtRLFUsRSxJO1EsRyxFLFc7WSxPLEMsQyxDLEMsQztTO0ssQyxDO0MsRyxTLEMsRSxDLEUsQyxFLEUsRTtJLEksRSxLLFMsRSxFLEcsQyxDO0ksQyxDLEUsQyxHLEMsQyxDLEMsQztDLEEsQyxBLEE7QSxJLFksRyxBLEksSSxJLEMsWSxJLFMsQyxFLE8sRTtJLEksSSxDLEksQyxDLEksQyxLLFMsSSxDLE8sQyxjLEMsQyxDLEUsZSxDLE8sRSxDLEUsQyxDLEM7QyxBO0EsTSxDLGMsQyxPLEUsWSxFO0ksSyxFLEk7QyxDLEM7QUVMdEMsWUFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUEsRUFBQSxPQUFBLENBQUEsQ0FBeUI7QUFD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QUFBLENBQUEsZUFBQSxHQUFBLGVBQUEsQ0FFQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxPQUF1QixFQUF0RDtJQUNFLE9BQU8sT0FBTyxJQUFJLE9BQU8sQ0FBQztDQUMzQjtBQUZELE9BQUEsQ0FBQSxjQUFBLEdBQUEsY0FBQSxDQUVDO0FBRUQsU0FBZ0IsMEJBQTBCLENBQ3hDLFVBQTZCLEVBRC9CO0lBR0UsT0FBTyxPQUFPLElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDO0NBQzVEO0FBSkQsT0FBQSxDQUFBLDBCQUFBLEdBQUEsMEJBQUEsQ0FJQzs7O0FDbENELE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMiLCJzb3VyY2VzIjpbInNyYy9jb250ZW50LXNjcmlwdC9pbmRleC50cyIsIm5vZGVfbW9kdWxlcy9uYW5vaWQvaW5kZXguYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9AcGFyY2VsL3RyYW5zZm9ybWVyLWpzL3NyYy9lc21vZHVsZS1oZWxwZXJzLmpzIiwibm9kZV9tb2R1bGVzL3dlYmV4dGVuc2lvbi1wb2x5ZmlsbC9kaXN0L2Jyb3dzZXItcG9seWZpbGwuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL2Rpc3QvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvaW5kZXgudHMiLCJub2RlX21vZHVsZXMvdHNsaWIvdHNsaWIuZXM2LmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL3NyYy9jb25zdGFudHMudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL2Rpc3QvY2pzL2Vycm9yLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvZXJyb3IudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL2Rpc3QvY2pzL2Vudi5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL2Vudi50cyIsIm5vZGVfbW9kdWxlcy9AcGVkcm91aWQvZW52aXJvbm1lbnQvZGlzdC9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHBlZHJvdWlkL2Vudmlyb25tZW50L3NyYy9pbmRleC50cyIsIm5vZGVfbW9kdWxlcy9AcGVkcm91aWQvZW52aXJvbm1lbnQvZGlzdC9janMvY3J5cHRvLmpzIiwibm9kZV9tb2R1bGVzL0BwZWRyb3VpZC9lbnZpcm9ubWVudC9zcmMvY3J5cHRvLnRzIiwibm9kZV9tb2R1bGVzL0BwZWRyb3VpZC9lbnZpcm9ubWVudC9kaXN0L2Nqcy9lbnYuanMiLCJub2RlX21vZHVsZXMvQHBlZHJvdWlkL2Vudmlyb25tZW50L3NyYy9lbnYudHMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9mb3JtYXQuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL3NyYy9mb3JtYXQudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL2Rpc3QvY2pzL3JvdXRpbmcuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL3NyYy9yb3V0aW5nLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy90eXBlcy5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL3R5cGVzLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL2luZGV4LnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9ibG9ja2NoYWluLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9zcmMvYmxvY2tjaGFpbi50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvbWlzYy5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL21pc2MudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL2Rpc3QvY2pzL3Byb3ZpZGVyLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9zcmMvcHJvdmlkZXIudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL2Rpc3QvY2pzL2pzb25ycGMuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9qc29ucnBjLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9tdWx0aS5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL211bHRpLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9yb3V0ZXIuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9yb3V0ZXIudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL2Rpc3QvY2pzL3NjaGVtYS5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL3NjaGVtYS50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvdmFsaWRhdG9yLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9zcmMvdmFsaWRhdG9yLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy92YWxpZGF0b3JzLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvdmFsaWRhdG9ycy50cyIsIm5vZGVfbW9kdWxlcy9AcGFyY2VsL3J1bnRpbWUtanMvbGliL2J1bmRsZXMvcnVudGltZS1mMTU2OTUwZDQxNjI3YWQxLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG5hbm9pZCB9IGZyb20gJ25hbm9pZCc7XG5pbXBvcnQgYnJvd3NlciBmcm9tICd3ZWJleHRlbnNpb24tcG9seWZpbGwnO1xuaW1wb3J0IHsgaXNKc29uUnBjUmVxdWVzdCwgaXNKc29uUnBjUmVzcG9uc2UgfSBmcm9tICdAanNvbi1ycGMtdG9vbHMvdXRpbHMnO1xuLy8gQHRzLWlnbm9yZSBwYXJjZWwgc3ludGF4IGZvciBpbmxpbmluZzogaHR0cHM6Ly9wYXJjZWxqcy5vcmcvZmVhdHVyZXMvYnVuZGxlLWlubGluaW5nLyNpbmxpbmluZy1hLWJ1bmRsZS1hcy10ZXh0XG5pbXBvcnQgaW5QYWdlQ29udGVudCBmcm9tICdidW5kbGUtdGV4dDouL2luLXBhZ2UnO1xuXG5jb25zdCBpZCA9IG5hbm9pZCgpO1xuXG5jb25zdCBicm9hZGNhc3RDaGFubmVsID0gbmV3IEJyb2FkY2FzdENoYW5uZWwoaWQpO1xuXG5jb25zdCBwb3J0ID0gYnJvd3Nlci5ydW50aW1lLmNvbm5lY3Qoe1xuICBuYW1lOiBgJHticm93c2VyLnJ1bnRpbWUuaWR9L2V0aGVyZXVtYCxcbn0pO1xuXG5wb3J0Lm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobXNnKSA9PiB7XG4gIGlmIChpc0pzb25ScGNSZXNwb25zZShtc2cpKSB7XG4gICAgYnJvYWRjYXN0Q2hhbm5lbC5wb3N0TWVzc2FnZShtc2cpO1xuICB9IGVsc2UgaWYgKG1zZy50eXBlID09PSAnZXRoZXJldW1FdmVudCcpIHtcbiAgICBicm9hZGNhc3RDaGFubmVsLnBvc3RNZXNzYWdlKG1zZyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ2lnbm9yZWQgbWVzc2FnZScpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgfVxufSk7XG5cbmJyb2FkY2FzdENoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICBjb25zdCB7IGRhdGEgfSA9IGV2ZW50O1xuICBpZiAoaXNKc29uUnBjUmVxdWVzdChkYXRhKSkge1xuICAgIHBvcnQucG9zdE1lc3NhZ2UoZGF0YSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ25vdCBhIEpzb25ScGNSZXF1ZXN0Jyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICB9XG59KTtcblxuLy8gSW5zZXJ0IHNjcmlwdCB3aXRoIGV0aGVyZXVtIHByb3ZpZGVyIF9hZnRlcl8gY3JlYXRpbmcgYSBCcm9hZGNhc3RDaGFubmVsXG5sZXQgY29udGVudCA9IGB3aW5kb3cubXlXYWxsZXRDaGFubmVsSWQgPSBcIiR7aWR9XCI7O2A7XG5jb250ZW50ICs9IGluUGFnZUNvbnRlbnQ7XG5cbmNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuc2NyaXB0LnRleHRDb250ZW50ID0gY29udGVudDtcbnNjcmlwdC5kYXRhc2V0LndhbGxldEV4dGVuc2lvbiA9ICd0cnVlJztcblxuY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5jb250YWluZXIuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiIsImV4cG9ydCB7IHVybEFscGhhYmV0IH0gZnJvbSAnLi91cmwtYWxwaGFiZXQvaW5kZXguanMnXG5leHBvcnQgbGV0IHJhbmRvbSA9IGJ5dGVzID0+IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoYnl0ZXMpKVxuZXhwb3J0IGxldCBjdXN0b21SYW5kb20gPSAoYWxwaGFiZXQsIGRlZmF1bHRTaXplLCBnZXRSYW5kb20pID0+IHtcbiAgbGV0IG1hc2sgPSAoMiA8PCAoTWF0aC5sb2coYWxwaGFiZXQubGVuZ3RoIC0gMSkgLyBNYXRoLkxOMikpIC0gMVxuICBsZXQgc3RlcCA9IC1+KCgxLjYgKiBtYXNrICogZGVmYXVsdFNpemUpIC8gYWxwaGFiZXQubGVuZ3RoKVxuICByZXR1cm4gKHNpemUgPSBkZWZhdWx0U2l6ZSkgPT4ge1xuICAgIGxldCBpZCA9ICcnXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGxldCBieXRlcyA9IGdldFJhbmRvbShzdGVwKVxuICAgICAgbGV0IGogPSBzdGVwXG4gICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgIGlkICs9IGFscGhhYmV0W2J5dGVzW2pdICYgbWFza10gfHwgJydcbiAgICAgICAgaWYgKGlkLmxlbmd0aCA9PT0gc2l6ZSkgcmV0dXJuIGlkXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5leHBvcnQgbGV0IGN1c3RvbUFscGhhYmV0ID0gKGFscGhhYmV0LCBzaXplID0gMjEpID0+XG4gIGN1c3RvbVJhbmRvbShhbHBoYWJldCwgc2l6ZSwgcmFuZG9tKVxuZXhwb3J0IGxldCBuYW5vaWQgPSAoc2l6ZSA9IDIxKSA9PlxuICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KHNpemUpKS5yZWR1Y2UoKGlkLCBieXRlKSA9PiB7XG4gICAgYnl0ZSAmPSA2M1xuICAgIGlmIChieXRlIDwgMzYpIHtcbiAgICAgIGlkICs9IGJ5dGUudG9TdHJpbmcoMzYpXG4gICAgfSBlbHNlIGlmIChieXRlIDwgNjIpIHtcbiAgICAgIGlkICs9IChieXRlIC0gMjYpLnRvU3RyaW5nKDM2KS50b1VwcGVyQ2FzZSgpXG4gICAgfSBlbHNlIGlmIChieXRlID4gNjIpIHtcbiAgICAgIGlkICs9ICctJ1xuICAgIH0gZWxzZSB7XG4gICAgICBpZCArPSAnXydcbiAgICB9XG4gICAgcmV0dXJuIGlkXG4gIH0sICcnKVxuIiwiZXhwb3J0cy5pbnRlcm9wRGVmYXVsdCA9IGZ1bmN0aW9uIChhKSB7XG4gIHJldHVybiBhICYmIGEuX19lc01vZHVsZSA/IGEgOiB7ZGVmYXVsdDogYX07XG59O1xuXG5leHBvcnRzLmRlZmluZUludGVyb3BGbGFnID0gZnVuY3Rpb24gKGEpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGEsICdfX2VzTW9kdWxlJywge3ZhbHVlOiB0cnVlfSk7XG59O1xuXG5leHBvcnRzLmV4cG9ydEFsbCA9IGZ1bmN0aW9uIChzb3VyY2UsIGRlc3QpIHtcbiAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAoa2V5ID09PSAnZGVmYXVsdCcgfHwga2V5ID09PSAnX19lc01vZHVsZScgfHwgZGVzdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRlc3QsIGtleSwge1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc291cmNlW2tleV07XG4gICAgICB9LFxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gZGVzdDtcbn07XG5cbmV4cG9ydHMuZXhwb3J0ID0gZnVuY3Rpb24gKGRlc3QsIGRlc3ROYW1lLCBnZXQpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRlc3QsIGRlc3ROYW1lLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGdldCxcbiAgfSk7XG59O1xuIiwiLyogd2ViZXh0ZW5zaW9uLXBvbHlmaWxsIC0gdjAuMTAuMCAtIEZyaSBBdWcgMTIgMjAyMiAxOTo0Mjo0NCAqL1xuLyogLSotIE1vZGU6IGluZGVudC10YWJzLW1vZGU6IG5pbDsganMtaW5kZW50LWxldmVsOiAyIC0qLSAqL1xuLyogdmltOiBzZXQgc3RzPTIgc3c9MiBldCB0dz04MDogKi9cbi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uICovXG5cInVzZSBzdHJpY3RcIjtcblxuaWYgKCFnbG9iYWxUaGlzLmNocm9tZT8ucnVudGltZT8uaWQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBzY3JpcHQgc2hvdWxkIG9ubHkgYmUgbG9hZGVkIGluIGEgYnJvd3NlciBleHRlbnNpb24uXCIpO1xufVxuXG5pZiAodHlwZW9mIGdsb2JhbFRoaXMuYnJvd3NlciA9PT0gXCJ1bmRlZmluZWRcIiB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZ2xvYmFsVGhpcy5icm93c2VyKSAhPT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICBjb25zdCBDSFJPTUVfU0VORF9NRVNTQUdFX0NBTExCQUNLX05PX1JFU1BPTlNFX01FU1NBR0UgPSBcIlRoZSBtZXNzYWdlIHBvcnQgY2xvc2VkIGJlZm9yZSBhIHJlc3BvbnNlIHdhcyByZWNlaXZlZC5cIjtcblxuICAvLyBXcmFwcGluZyB0aGUgYnVsayBvZiB0aGlzIHBvbHlmaWxsIGluIGEgb25lLXRpbWUtdXNlIGZ1bmN0aW9uIGlzIGEgbWlub3JcbiAgLy8gb3B0aW1pemF0aW9uIGZvciBGaXJlZm94LiBTaW5jZSBTcGlkZXJtb25rZXkgZG9lcyBub3QgZnVsbHkgcGFyc2UgdGhlXG4gIC8vIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24gdW50aWwgdGhlIGZpcnN0IHRpbWUgaXQncyBjYWxsZWQsIGFuZCBzaW5jZSBpdCB3aWxsXG4gIC8vIG5ldmVyIGFjdHVhbGx5IG5lZWQgdG8gYmUgY2FsbGVkLCB0aGlzIGFsbG93cyB0aGUgcG9seWZpbGwgdG8gYmUgaW5jbHVkZWRcbiAgLy8gaW4gRmlyZWZveCBuZWFybHkgZm9yIGZyZWUuXG4gIGNvbnN0IHdyYXBBUElzID0gZXh0ZW5zaW9uQVBJcyA9PiB7XG4gICAgLy8gTk9URTogYXBpTWV0YWRhdGEgaXMgYXNzb2NpYXRlZCB0byB0aGUgY29udGVudCBvZiB0aGUgYXBpLW1ldGFkYXRhLmpzb24gZmlsZVxuICAgIC8vIGF0IGJ1aWxkIHRpbWUgYnkgcmVwbGFjaW5nIHRoZSBmb2xsb3dpbmcgXCJpbmNsdWRlXCIgd2l0aCB0aGUgY29udGVudCBvZiB0aGVcbiAgICAvLyBKU09OIGZpbGUuXG4gICAgY29uc3QgYXBpTWV0YWRhdGEgPSB7XG4gICAgICBcImFsYXJtc1wiOiB7XG4gICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiY2xlYXJBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiYm9va21hcmtzXCI6IHtcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldENoaWxkcmVuXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFJlY2VudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRTdWJUcmVlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFRyZWVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlVHJlZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJicm93c2VyQWN0aW9uXCI6IHtcbiAgICAgICAgXCJkaXNhYmxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJlbmFibGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcImdldEJhZGdlQmFja2dyb3VuZENvbG9yXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRQb3B1cFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRUaXRsZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGVuUG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0QmFkZ2VCYWNrZ3JvdW5kQ29sb3JcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0SWNvblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRQb3B1cFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0VGl0bGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJicm93c2luZ0RhdGFcIjoge1xuICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVDYWNoZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVDb29raWVzXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZURvd25sb2Fkc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVGb3JtRGF0YVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVIaXN0b3J5XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZUxvY2FsU3RvcmFnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVQYXNzd29yZHNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlUGx1Z2luRGF0YVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29tbWFuZHNcIjoge1xuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29udGV4dE1lbnVzXCI6IHtcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlQWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29va2llc1wiOiB7XG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxDb29raWVTdG9yZXNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiZGV2dG9vbHNcIjoge1xuICAgICAgICBcImluc3BlY3RlZFdpbmRvd1wiOiB7XG4gICAgICAgICAgXCJldmFsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDIsXG4gICAgICAgICAgICBcInNpbmdsZUNhbGxiYWNrQXJnXCI6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBhbmVsc1wiOiB7XG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDMsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMyxcbiAgICAgICAgICAgIFwic2luZ2xlQ2FsbGJhY2tBcmdcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlbGVtZW50c1wiOiB7XG4gICAgICAgICAgICBcImNyZWF0ZVNpZGViYXJQYW5lXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJkb3dubG9hZHNcIjoge1xuICAgICAgICBcImNhbmNlbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkb3dubG9hZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJlcmFzZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRGaWxlSWNvblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGVuXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJwYXVzZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVGaWxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlc3VtZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2hvd1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImV4dGVuc2lvblwiOiB7XG4gICAgICAgIFwiaXNBbGxvd2VkRmlsZVNjaGVtZUFjY2Vzc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJpc0FsbG93ZWRJbmNvZ25pdG9BY2Nlc3NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImhpc3RvcnlcIjoge1xuICAgICAgICBcImFkZFVybFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlUmFuZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlVXJsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFZpc2l0c1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImkxOG5cIjoge1xuICAgICAgICBcImRldGVjdExhbmd1YWdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFjY2VwdExhbmd1YWdlc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiaWRlbnRpdHlcIjoge1xuICAgICAgICBcImxhdW5jaFdlYkF1dGhGbG93XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJpZGxlXCI6IHtcbiAgICAgICAgXCJxdWVyeVN0YXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJtYW5hZ2VtZW50XCI6IHtcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFNlbGZcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0RW5hYmxlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1bmluc3RhbGxTZWxmXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJub3RpZmljYXRpb25zXCI6IHtcbiAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFBlcm1pc3Npb25MZXZlbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInBhZ2VBY3Rpb25cIjoge1xuICAgICAgICBcImdldFBvcHVwXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFRpdGxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImhpZGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldEljb25cIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0UG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldFRpdGxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaG93XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwicGVybWlzc2lvbnNcIjoge1xuICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVxdWVzdFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwicnVudGltZVwiOiB7XG4gICAgICAgIFwiZ2V0QmFja2dyb3VuZFBhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0UGxhdGZvcm1JbmZvXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcIm9wZW5PcHRpb25zUGFnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZXF1ZXN0VXBkYXRlQ2hlY2tcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VuZE1lc3NhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAzXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VuZE5hdGl2ZU1lc3NhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0VW5pbnN0YWxsVVJMXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJzZXNzaW9uc1wiOiB7XG4gICAgICAgIFwiZ2V0RGV2aWNlc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRSZWNlbnRseUNsb3NlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZXN0b3JlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJzdG9yYWdlXCI6IHtcbiAgICAgICAgXCJsb2NhbFwiOiB7XG4gICAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYW5hZ2VkXCI6IHtcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzeW5jXCI6IHtcbiAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Qnl0ZXNJblVzZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJ0YWJzXCI6IHtcbiAgICAgICAgXCJjYXB0dXJlVmlzaWJsZVRhYlwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGV0ZWN0TGFuZ3VhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGlzY2FyZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkdXBsaWNhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZXhlY3V0ZVNjcmlwdFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRab29tXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFpvb21TZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnb0JhY2tcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ29Gb3J3YXJkXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImhpZ2hsaWdodFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJpbnNlcnRDU1NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJxdWVyeVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZWxvYWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZUNTU1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZW5kTWVzc2FnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDNcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRab29tXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9LFxuICAgICAgICBcInNldFpvb21TZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInRvcFNpdGVzXCI6IHtcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcIndlYk5hdmlnYXRpb25cIjoge1xuICAgICAgICBcImdldEFsbEZyYW1lc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRGcmFtZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwid2ViUmVxdWVzdFwiOiB7XG4gICAgICAgIFwiaGFuZGxlckJlaGF2aW9yQ2hhbmdlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwid2luZG93c1wiOiB7XG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRMYXN0Rm9jdXNlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChPYmplY3Qua2V5cyhhcGlNZXRhZGF0YSkubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhcGktbWV0YWRhdGEuanNvbiBoYXMgbm90IGJlZW4gaW5jbHVkZWQgaW4gYnJvd3Nlci1wb2x5ZmlsbFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIFdlYWtNYXAgc3ViY2xhc3Mgd2hpY2ggY3JlYXRlcyBhbmQgc3RvcmVzIGEgdmFsdWUgZm9yIGFueSBrZXkgd2hpY2ggZG9lc1xuICAgICAqIG5vdCBleGlzdCB3aGVuIGFjY2Vzc2VkLCBidXQgYmVoYXZlcyBleGFjdGx5IGFzIGFuIG9yZGluYXJ5IFdlYWtNYXBcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjcmVhdGVJdGVtXG4gICAgICogICAgICAgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gY3JlYXRlIHRoZSB2YWx1ZSBmb3IgYW55XG4gICAgICogICAgICAgIGtleSB3aGljaCBkb2VzIG5vdCBleGlzdCwgdGhlIGZpcnN0IHRpbWUgaXQgaXMgYWNjZXNzZWQuIFRoZVxuICAgICAqICAgICAgICBmdW5jdGlvbiByZWNlaXZlcywgYXMgaXRzIG9ubHkgYXJndW1lbnQsIHRoZSBrZXkgYmVpbmcgY3JlYXRlZC5cbiAgICAgKi9cbiAgICBjbGFzcyBEZWZhdWx0V2Vha01hcCBleHRlbmRzIFdlYWtNYXAge1xuICAgICAgY29uc3RydWN0b3IoY3JlYXRlSXRlbSwgaXRlbXMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VwZXIoaXRlbXMpO1xuICAgICAgICB0aGlzLmNyZWF0ZUl0ZW0gPSBjcmVhdGVJdGVtO1xuICAgICAgfVxuXG4gICAgICBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICAgIHRoaXMuc2V0KGtleSwgdGhpcy5jcmVhdGVJdGVtKGtleSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmdldChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGFuIG9iamVjdCB3aXRoIGEgYHRoZW5gIG1ldGhvZCwgYW5kIGNhblxuICAgICAqIHRoZXJlZm9yZSBiZSBhc3N1bWVkIHRvIGJlaGF2ZSBhcyBhIFByb21pc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byB0ZXN0LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB2YWx1ZSBpcyB0aGVuYWJsZS5cbiAgICAgKi9cbiAgICBjb25zdCBpc1RoZW5hYmxlID0gdmFsdWUgPT4ge1xuICAgICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0XG4gICAgICogdGhlIGdpdmVuIHByb21pc2UgYmFzZWQgb24gaG93IGl0IGlzIGNhbGxlZDpcbiAgICAgKlxuICAgICAqIC0gSWYsIHdoZW4gY2FsbGVkLCBgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yYCBjb250YWlucyBhIG5vbi1udWxsIG9iamVjdCxcbiAgICAgKiAgIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIHdpdGggdGhhdCB2YWx1ZS5cbiAgICAgKiAtIElmIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBleGFjdGx5IG9uZSBhcmd1bWVudCwgdGhlIHByb21pc2UgaXNcbiAgICAgKiAgIHJlc29sdmVkIHRvIHRoYXQgdmFsdWUuXG4gICAgICogLSBPdGhlcndpc2UsIHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHRvIGFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIG9mIHRoZVxuICAgICAqICAgZnVuY3Rpb24ncyBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvbWlzZVxuICAgICAqICAgICAgICBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgcmVzb2x1dGlvbiBhbmQgcmVqZWN0aW9uIGZ1bmN0aW9ucyBvZiBhXG4gICAgICogICAgICAgIHByb21pc2UuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvbWlzZS5yZXNvbHZlXG4gICAgICogICAgICAgIFRoZSBwcm9taXNlJ3MgcmVzb2x1dGlvbiBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9taXNlLnJlamVjdFxuICAgICAqICAgICAgICBUaGUgcHJvbWlzZSdzIHJlamVjdGlvbiBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbWV0YWRhdGFcbiAgICAgKiAgICAgICAgTWV0YWRhdGEgYWJvdXQgdGhlIHdyYXBwZWQgbWV0aG9kIHdoaWNoIGhhcyBjcmVhdGVkIHRoZSBjYWxsYmFjay5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnXG4gICAgICogICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggb25seSB0aGUgZmlyc3RcbiAgICAgKiAgICAgICAgYXJndW1lbnQgb2YgdGhlIGNhbGxiYWNrLCBhbHRlcm5hdGl2ZWx5IGFuIGFycmF5IG9mIGFsbCB0aGVcbiAgICAgKiAgICAgICAgY2FsbGJhY2sgYXJndW1lbnRzIGlzIHJlc29sdmVkLiBCeSBkZWZhdWx0LCBpZiB0aGUgY2FsbGJhY2tcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIG9ubHkgYSBzaW5nbGUgYXJndW1lbnQsIHRoYXQgd2lsbCBiZVxuICAgICAqICAgICAgICByZXNvbHZlZCB0byB0aGUgcHJvbWlzZSwgd2hpbGUgYWxsIGFyZ3VtZW50cyB3aWxsIGJlIHJlc29sdmVkIGFzXG4gICAgICogICAgICAgIGFuIGFycmF5IGlmIG11bHRpcGxlIGFyZSBnaXZlbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn1cbiAgICAgKiAgICAgICAgVGhlIGdlbmVyYXRlZCBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBjb25zdCBtYWtlQ2FsbGJhY2sgPSAocHJvbWlzZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgIHJldHVybiAoLi4uY2FsbGJhY2tBcmdzKSA9PiB7XG4gICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgcHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnIHx8XG4gICAgICAgICAgICAgICAgICAgKGNhbGxiYWNrQXJncy5sZW5ndGggPD0gMSAmJiBtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZyAhPT0gZmFsc2UpKSB7XG4gICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJnc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJncyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcblxuICAgIGNvbnN0IHBsdXJhbGl6ZUFyZ3VtZW50cyA9IChudW1BcmdzKSA9PiBudW1BcmdzID09IDEgPyBcImFyZ3VtZW50XCIgOiBcImFyZ3VtZW50c1wiO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHdyYXBwZXIgZnVuY3Rpb24gZm9yIGEgbWV0aG9kIHdpdGggdGhlIGdpdmVuIG5hbWUgYW5kIG1ldGFkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiAgICAgICAgVGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aGljaCBpcyBiZWluZyB3cmFwcGVkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtZXRhZGF0YVxuICAgICAqICAgICAgICBNZXRhZGF0YSBhYm91dCB0aGUgbWV0aG9kIGJlaW5nIHdyYXBwZWQuXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5taW5BcmdzXG4gICAgICogICAgICAgIFRoZSBtaW5pbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbXVzdCBiZSBwYXNzZWQgdG8gdGhlXG4gICAgICogICAgICAgIGZ1bmN0aW9uLiBJZiBjYWxsZWQgd2l0aCBmZXdlciB0aGFuIHRoaXMgbnVtYmVyIG9mIGFyZ3VtZW50cywgdGhlXG4gICAgICogICAgICAgIHdyYXBwZXIgd2lsbCByYWlzZSBhbiBleGNlcHRpb24uXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5tYXhBcmdzXG4gICAgICogICAgICAgIFRoZSBtYXhpbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbWF5IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgKiAgICAgICAgZnVuY3Rpb24uIElmIGNhbGxlZCB3aXRoIG1vcmUgdGhhbiB0aGlzIG51bWJlciBvZiBhcmd1bWVudHMsIHRoZVxuICAgICAqICAgICAgICB3cmFwcGVyIHdpbGwgcmFpc2UgYW4gZXhjZXB0aW9uLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmdcbiAgICAgKiAgICAgICAgV2hldGhlciBvciBub3QgdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCBvbmx5IHRoZSBmaXJzdFxuICAgICAqICAgICAgICBhcmd1bWVudCBvZiB0aGUgY2FsbGJhY2ssIGFsdGVybmF0aXZlbHkgYW4gYXJyYXkgb2YgYWxsIHRoZVxuICAgICAqICAgICAgICBjYWxsYmFjayBhcmd1bWVudHMgaXMgcmVzb2x2ZWQuIEJ5IGRlZmF1bHQsIGlmIHRoZSBjYWxsYmFja1xuICAgICAqICAgICAgICBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggb25seSBhIHNpbmdsZSBhcmd1bWVudCwgdGhhdCB3aWxsIGJlXG4gICAgICogICAgICAgIHJlc29sdmVkIHRvIHRoZSBwcm9taXNlLCB3aGlsZSBhbGwgYXJndW1lbnRzIHdpbGwgYmUgcmVzb2x2ZWQgYXNcbiAgICAgKiAgICAgICAgYW4gYXJyYXkgaWYgbXVsdGlwbGUgYXJlIGdpdmVuLlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9uKG9iamVjdCwgLi4uKil9XG4gICAgICogICAgICAgVGhlIGdlbmVyYXRlZCB3cmFwcGVyIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBBc3luY0Z1bmN0aW9uID0gKG5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gYXN5bmNGdW5jdGlvbldyYXBwZXIodGFyZ2V0LCAuLi5hcmdzKSB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IG1ldGFkYXRhLm1pbkFyZ3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IGxlYXN0ICR7bWV0YWRhdGEubWluQXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWluQXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gbWV0YWRhdGEubWF4QXJncykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbW9zdCAke21ldGFkYXRhLm1heEFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1heEFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUaGlzIEFQSSBtZXRob2QgaGFzIGN1cnJlbnRseSBubyBjYWxsYmFjayBvbiBDaHJvbWUsIGJ1dCBpdCByZXR1cm4gYSBwcm9taXNlIG9uIEZpcmVmb3gsXG4gICAgICAgICAgICAvLyBhbmQgc28gdGhlIHBvbHlmaWxsIHdpbGwgdHJ5IHRvIGNhbGwgaXQgd2l0aCBhIGNhbGxiYWNrIGZpcnN0LCBhbmQgaXQgd2lsbCBmYWxsYmFja1xuICAgICAgICAgICAgLy8gdG8gbm90IHBhc3NpbmcgdGhlIGNhbGxiYWNrIGlmIHRoZSBmaXJzdCBjYWxsIGZhaWxzLlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MsIG1ha2VDYWxsYmFjayh7cmVzb2x2ZSwgcmVqZWN0fSwgbWV0YWRhdGEpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGNiRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAke25hbWV9IEFQSSBtZXRob2QgZG9lc24ndCBzZWVtIHRvIHN1cHBvcnQgdGhlIGNhbGxiYWNrIHBhcmFtZXRlciwgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhbGxpbmcgYmFjayB0byBjYWxsIGl0IHdpdGhvdXQgYSBjYWxsYmFjazogXCIsIGNiRXJyb3IpO1xuXG4gICAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzKTtcblxuICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIEFQSSBtZXRob2QgbWV0YWRhdGEsIHNvIHRoYXQgdGhlIG5leHQgQVBJIGNhbGxzIHdpbGwgbm90IHRyeSB0b1xuICAgICAgICAgICAgICAvLyB1c2UgdGhlIHVuc3VwcG9ydGVkIGNhbGxiYWNrIGFueW1vcmUuXG4gICAgICAgICAgICAgIG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrID0gZmFsc2U7XG4gICAgICAgICAgICAgIG1ldGFkYXRhLm5vQ2FsbGJhY2sgPSB0cnVlO1xuXG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLm5vQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MsIG1ha2VDYWxsYmFjayh7cmVzb2x2ZSwgcmVqZWN0fSwgbWV0YWRhdGEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYW4gZXhpc3RpbmcgbWV0aG9kIG9mIHRoZSB0YXJnZXQgb2JqZWN0LCBzbyB0aGF0IGNhbGxzIHRvIGl0IGFyZVxuICAgICAqIGludGVyY2VwdGVkIGJ5IHRoZSBnaXZlbiB3cmFwcGVyIGZ1bmN0aW9uLiBUaGUgd3JhcHBlciBmdW5jdGlvbiByZWNlaXZlcyxcbiAgICAgKiBhcyBpdHMgZmlyc3QgYXJndW1lbnQsIHRoZSBvcmlnaW5hbCBgdGFyZ2V0YCBvYmplY3QsIGZvbGxvd2VkIGJ5IGVhY2ggb2ZcbiAgICAgKiB0aGUgYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgb3JpZ2luYWwgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAqICAgICAgICBUaGUgb3JpZ2luYWwgdGFyZ2V0IG9iamVjdCB0aGF0IHRoZSB3cmFwcGVkIG1ldGhvZCBiZWxvbmdzIHRvLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1ldGhvZFxuICAgICAqICAgICAgICBUaGUgbWV0aG9kIGJlaW5nIHdyYXBwZWQuIFRoaXMgaXMgdXNlZCBhcyB0aGUgdGFyZ2V0IG9mIHRoZSBQcm94eVxuICAgICAqICAgICAgICBvYmplY3Qgd2hpY2ggaXMgY3JlYXRlZCB0byB3cmFwIHRoZSBtZXRob2QuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gd3JhcHBlclxuICAgICAqICAgICAgICBUaGUgd3JhcHBlciBmdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgaW4gcGxhY2Ugb2YgYSBkaXJlY3QgaW52b2NhdGlvblxuICAgICAqICAgICAgICBvZiB0aGUgd3JhcHBlZCBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJveHk8ZnVuY3Rpb24+fVxuICAgICAqICAgICAgICBBIFByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIG1ldGhvZCwgd2hpY2ggaW52b2tlcyB0aGUgZ2l2ZW4gd3JhcHBlclxuICAgICAqICAgICAgICBtZXRob2QgaW4gaXRzIHBsYWNlLlxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBNZXRob2QgPSAodGFyZ2V0LCBtZXRob2QsIHdyYXBwZXIpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkobWV0aG9kLCB7XG4gICAgICAgIGFwcGx5KHRhcmdldE1ldGhvZCwgdGhpc09iaiwgYXJncykge1xuICAgICAgICAgIHJldHVybiB3cmFwcGVyLmNhbGwodGhpc09iaiwgdGFyZ2V0LCAuLi5hcmdzKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsZXQgaGFzT3duUHJvcGVydHkgPSBGdW5jdGlvbi5jYWxsLmJpbmQoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbiAgICAvKipcbiAgICAgKiBXcmFwcyBhbiBvYmplY3QgaW4gYSBQcm94eSB3aGljaCBpbnRlcmNlcHRzIGFuZCB3cmFwcyBjZXJ0YWluIG1ldGhvZHNcbiAgICAgKiBiYXNlZCBvbiB0aGUgZ2l2ZW4gYHdyYXBwZXJzYCBhbmQgYG1ldGFkYXRhYCBvYmplY3RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAqICAgICAgICBUaGUgdGFyZ2V0IG9iamVjdCB0byB3cmFwLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFt3cmFwcGVycyA9IHt9XVxuICAgICAqICAgICAgICBBbiBvYmplY3QgdHJlZSBjb250YWluaW5nIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBzcGVjaWFsIGNhc2VzLiBBbnlcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gcHJlc2VudCBpbiB0aGlzIG9iamVjdCB0cmVlIGlzIGNhbGxlZCBpbiBwbGFjZSBvZiB0aGVcbiAgICAgKiAgICAgICAgbWV0aG9kIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgdGFyZ2V0YCBvYmplY3QgdHJlZS4gVGhlc2VcbiAgICAgKiAgICAgICAgd3JhcHBlciBtZXRob2RzIGFyZSBpbnZva2VkIGFzIGRlc2NyaWJlZCBpbiB7QHNlZSB3cmFwTWV0aG9kfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbbWV0YWRhdGEgPSB7fV1cbiAgICAgKiAgICAgICAgQW4gb2JqZWN0IHRyZWUgY29udGFpbmluZyBtZXRhZGF0YSB1c2VkIHRvIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVcbiAgICAgKiAgICAgICAgUHJvbWlzZS1iYXNlZCB3cmFwcGVyIGZ1bmN0aW9ucyBmb3IgYXN5bmNocm9ub3VzLiBBbnkgZnVuY3Rpb24gaW5cbiAgICAgKiAgICAgICAgdGhlIGB0YXJnZXRgIG9iamVjdCB0cmVlIHdoaWNoIGhhcyBhIGNvcnJlc3BvbmRpbmcgbWV0YWRhdGEgb2JqZWN0XG4gICAgICogICAgICAgIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgbWV0YWRhdGFgIHRyZWUgaXMgcmVwbGFjZWQgd2l0aCBhblxuICAgICAqICAgICAgICBhdXRvbWF0aWNhbGx5LWdlbmVyYXRlZCB3cmFwcGVyIGZ1bmN0aW9uLCBhcyBkZXNjcmliZWQgaW5cbiAgICAgKiAgICAgICAge0BzZWUgd3JhcEFzeW5jRnVuY3Rpb259XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJveHk8b2JqZWN0Pn1cbiAgICAgKi9cbiAgICBjb25zdCB3cmFwT2JqZWN0ID0gKHRhcmdldCwgd3JhcHBlcnMgPSB7fSwgbWV0YWRhdGEgPSB7fSkgPT4ge1xuICAgICAgbGV0IGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIGxldCBoYW5kbGVycyA9IHtcbiAgICAgICAgaGFzKHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgcmV0dXJuIHByb3AgaW4gdGFyZ2V0IHx8IHByb3AgaW4gY2FjaGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0KHByb3h5VGFyZ2V0LCBwcm9wLCByZWNlaXZlcikge1xuICAgICAgICAgIGlmIChwcm9wIGluIGNhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbcHJvcF07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCEocHJvcCBpbiB0YXJnZXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB2YWx1ZSA9IHRhcmdldFtwcm9wXTtcblxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG1ldGhvZCBvbiB0aGUgdW5kZXJseWluZyBvYmplY3QuIENoZWNrIGlmIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFueSB3cmFwcGluZy5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3cmFwcGVyc1twcm9wXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIC8vIFdlIGhhdmUgYSBzcGVjaWFsLWNhc2Ugd3JhcHBlciBmb3IgdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcnNbcHJvcF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBhc3luYyBtZXRob2QgdGhhdCB3ZSBoYXZlIG1ldGFkYXRhIGZvci4gQ3JlYXRlIGFcbiAgICAgICAgICAgICAgLy8gUHJvbWlzZSB3cmFwcGVyIGZvciBpdC5cbiAgICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSB3cmFwQXN5bmNGdW5jdGlvbihwcm9wLCBtZXRhZGF0YVtwcm9wXSk7XG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbWV0aG9kIHRoYXQgd2UgZG9uJ3Qga25vdyBvciBjYXJlIGFib3V0LiBSZXR1cm4gdGhlXG4gICAgICAgICAgICAgIC8vIG9yaWdpbmFsIG1ldGhvZCwgYm91bmQgdG8gdGhlIHVuZGVybHlpbmcgb2JqZWN0LlxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmJpbmQodGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgKGhhc093blByb3BlcnR5KHdyYXBwZXJzLCBwcm9wKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBwcm9wKSkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gb2JqZWN0IHRoYXQgd2UgbmVlZCB0byBkbyBzb21lIHdyYXBwaW5nIGZvciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIC8vIG9mLiBDcmVhdGUgYSBzdWItb2JqZWN0IHdyYXBwZXIgZm9yIGl0IHdpdGggdGhlIGFwcHJvcHJpYXRlIGNoaWxkXG4gICAgICAgICAgICAvLyBtZXRhZGF0YS5cbiAgICAgICAgICAgIHZhbHVlID0gd3JhcE9iamVjdCh2YWx1ZSwgd3JhcHBlcnNbcHJvcF0sIG1ldGFkYXRhW3Byb3BdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBcIipcIikpIHtcbiAgICAgICAgICAgIC8vIFdyYXAgYWxsIHByb3BlcnRpZXMgaW4gKiBuYW1lc3BhY2UuXG4gICAgICAgICAgICB2YWx1ZSA9IHdyYXBPYmplY3QodmFsdWUsIHdyYXBwZXJzW3Byb3BdLCBtZXRhZGF0YVtcIipcIl0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGRvIGFueSB3cmFwcGluZyBmb3IgdGhpcyBwcm9wZXJ0eSxcbiAgICAgICAgICAgIC8vIHNvIGp1c3QgZm9yd2FyZCBhbGwgYWNjZXNzIHRvIHRoZSB1bmRlcmx5aW5nIG9iamVjdC5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYWNoZSwgcHJvcCwge1xuICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BdO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBzZXQodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0KHByb3h5VGFyZ2V0LCBwcm9wLCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICBpZiAocHJvcCBpbiBjYWNoZSkge1xuICAgICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlZmluZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wLCBkZXNjKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVmaW5lUHJvcGVydHkoY2FjaGUsIHByb3AsIGRlc2MpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoY2FjaGUsIHByb3ApO1xuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgLy8gUGVyIGNvbnRyYWN0IG9mIHRoZSBQcm94eSBBUEksIHRoZSBcImdldFwiIHByb3h5IGhhbmRsZXIgbXVzdCByZXR1cm4gdGhlXG4gICAgICAvLyBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgdGFyZ2V0IGlmIHRoYXQgdmFsdWUgaXMgZGVjbGFyZWQgcmVhZC1vbmx5IGFuZFxuICAgICAgLy8gbm9uLWNvbmZpZ3VyYWJsZS4gRm9yIHRoaXMgcmVhc29uLCB3ZSBjcmVhdGUgYW4gb2JqZWN0IHdpdGggdGhlXG4gICAgICAvLyBwcm90b3R5cGUgc2V0IHRvIGB0YXJnZXRgIGluc3RlYWQgb2YgdXNpbmcgYHRhcmdldGAgZGlyZWN0bHkuXG4gICAgICAvLyBPdGhlcndpc2Ugd2UgY2Fubm90IHJldHVybiBhIGN1c3RvbSBvYmplY3QgZm9yIEFQSXMgdGhhdFxuICAgICAgLy8gYXJlIGRlY2xhcmVkIHJlYWQtb25seSBhbmQgbm9uLWNvbmZpZ3VyYWJsZSwgc3VjaCBhcyBgY2hyb21lLmRldnRvb2xzYC5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgcHJveHkgaGFuZGxlcnMgdGhlbXNlbHZlcyB3aWxsIHN0aWxsIHVzZSB0aGUgb3JpZ2luYWwgYHRhcmdldGBcbiAgICAgIC8vIGluc3RlYWQgb2YgdGhlIGBwcm94eVRhcmdldGAsIHNvIHRoYXQgdGhlIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgYXJlXG4gICAgICAvLyBkZXJlZmVyZW5jZWQgdmlhIHRoZSBvcmlnaW5hbCB0YXJnZXRzLlxuICAgICAgbGV0IHByb3h5VGFyZ2V0ID0gT2JqZWN0LmNyZWF0ZSh0YXJnZXQpO1xuICAgICAgcmV0dXJuIG5ldyBQcm94eShwcm94eVRhcmdldCwgaGFuZGxlcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc2V0IG9mIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBvYmplY3QsIHdoaWNoIGhhbmRsZXNcbiAgICAgKiB3cmFwcGluZyBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdGhhdCB0aG9zZSBtZXNzYWdlcyBhcmUgcGFzc2VkLlxuICAgICAqXG4gICAgICogQSBzaW5nbGUgd3JhcHBlciBpcyBjcmVhdGVkIGZvciBlYWNoIGxpc3RlbmVyIGZ1bmN0aW9uLCBhbmQgc3RvcmVkIGluIGFcbiAgICAgKiBtYXAuIFN1YnNlcXVlbnQgY2FsbHMgdG8gYGFkZExpc3RlbmVyYCwgYGhhc0xpc3RlbmVyYCwgb3IgYHJlbW92ZUxpc3RlbmVyYFxuICAgICAqIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB3cmFwcGVyLCBzbyB0aGF0ICBhdHRlbXB0cyB0byByZW1vdmUgYVxuICAgICAqIHByZXZpb3VzbHktYWRkZWQgbGlzdGVuZXIgd29yayBhcyBleHBlY3RlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RGVmYXVsdFdlYWtNYXA8ZnVuY3Rpb24sIGZ1bmN0aW9uPn0gd3JhcHBlck1hcFxuICAgICAqICAgICAgICBBIERlZmF1bHRXZWFrTWFwIG9iamVjdCB3aGljaCB3aWxsIGNyZWF0ZSB0aGUgYXBwcm9wcmlhdGUgd3JhcHBlclxuICAgICAqICAgICAgICBmb3IgYSBnaXZlbiBsaXN0ZW5lciBmdW5jdGlvbiB3aGVuIG9uZSBkb2VzIG5vdCBleGlzdCwgYW5kIHJldHJpZXZlXG4gICAgICogICAgICAgIGFuIGV4aXN0aW5nIG9uZSB3aGVuIGl0IGRvZXMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fVxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBFdmVudCA9IHdyYXBwZXJNYXAgPT4gKHtcbiAgICAgIGFkZExpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIsIC4uLmFyZ3MpIHtcbiAgICAgICAgdGFyZ2V0LmFkZExpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSwgLi4uYXJncyk7XG4gICAgICB9LFxuXG4gICAgICBoYXNMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQuaGFzTGlzdGVuZXIod3JhcHBlck1hcC5nZXQobGlzdGVuZXIpKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUxpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb25SZXF1ZXN0RmluaXNoZWRXcmFwcGVycyA9IG5ldyBEZWZhdWx0V2Vha01hcChsaXN0ZW5lciA9PiB7XG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFdyYXBzIGFuIG9uUmVxdWVzdEZpbmlzaGVkIGxpc3RlbmVyIGZ1bmN0aW9uIHNvIHRoYXQgaXQgd2lsbCByZXR1cm4gYVxuICAgICAgICogYGdldENvbnRlbnQoKWAgcHJvcGVydHkgd2hpY2ggcmV0dXJucyBhIGBQcm9taXNlYCByYXRoZXIgdGhhbiB1c2luZyBhXG4gICAgICAgKiBjYWxsYmFjayBBUEkuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICAgICAgICogICAgICAgIFRoZSBIQVIgZW50cnkgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgbmV0d29yayByZXF1ZXN0LlxuICAgICAgICovXG4gICAgICByZXR1cm4gZnVuY3Rpb24gb25SZXF1ZXN0RmluaXNoZWQocmVxKSB7XG4gICAgICAgIGNvbnN0IHdyYXBwZWRSZXEgPSB3cmFwT2JqZWN0KHJlcSwge30gLyogd3JhcHBlcnMgKi8sIHtcbiAgICAgICAgICBnZXRDb250ZW50OiB7XG4gICAgICAgICAgICBtaW5BcmdzOiAwLFxuICAgICAgICAgICAgbWF4QXJnczogMCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgbGlzdGVuZXIod3JhcHBlZFJlcSk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgY29uc3Qgb25NZXNzYWdlV3JhcHBlcnMgPSBuZXcgRGVmYXVsdFdlYWtNYXAobGlzdGVuZXIgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBXcmFwcyBhIG1lc3NhZ2UgbGlzdGVuZXIgZnVuY3Rpb24gc28gdGhhdCBpdCBtYXkgc2VuZCByZXNwb25zZXMgYmFzZWQgb25cbiAgICAgICAqIGl0cyByZXR1cm4gdmFsdWUsIHJhdGhlciB0aGFuIGJ5IHJldHVybmluZyBhIHNlbnRpbmVsIHZhbHVlIGFuZCBjYWxsaW5nIGFcbiAgICAgICAqIGNhbGxiYWNrLiBJZiB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gcmV0dXJucyBhIFByb21pc2UsIHRoZSByZXNwb25zZSBpc1xuICAgICAgICogc2VudCB3aGVuIHRoZSBwcm9taXNlIGVpdGhlciByZXNvbHZlcyBvciByZWplY3RzLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7Kn0gbWVzc2FnZVxuICAgICAgICogICAgICAgIFRoZSBtZXNzYWdlIHNlbnQgYnkgdGhlIG90aGVyIGVuZCBvZiB0aGUgY2hhbm5lbC5cbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzZW5kZXJcbiAgICAgICAqICAgICAgICBEZXRhaWxzIGFib3V0IHRoZSBzZW5kZXIgb2YgdGhlIG1lc3NhZ2UuXG4gICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKCopfSBzZW5kUmVzcG9uc2VcbiAgICAgICAqICAgICAgICBBIGNhbGxiYWNrIHdoaWNoLCB3aGVuIGNhbGxlZCB3aXRoIGFuIGFyYml0cmFyeSBhcmd1bWVudCwgc2VuZHNcbiAgICAgICAqICAgICAgICB0aGF0IHZhbHVlIGFzIGEgcmVzcG9uc2UuXG4gICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAqICAgICAgICBUcnVlIGlmIHRoZSB3cmFwcGVkIGxpc3RlbmVyIHJldHVybmVkIGEgUHJvbWlzZSwgd2hpY2ggd2lsbCBsYXRlclxuICAgICAgICogICAgICAgIHlpZWxkIGEgcmVzcG9uc2UuIEZhbHNlIG90aGVyd2lzZS5cbiAgICAgICAqL1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIG9uTWVzc2FnZShtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICAgICAgICBsZXQgZGlkQ2FsbFNlbmRSZXNwb25zZSA9IGZhbHNlO1xuXG4gICAgICAgIGxldCB3cmFwcGVkU2VuZFJlc3BvbnNlO1xuICAgICAgICBsZXQgc2VuZFJlc3BvbnNlUHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHdyYXBwZWRTZW5kUmVzcG9uc2UgPSBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgZGlkQ2FsbFNlbmRSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc3VsdCA9IGxpc3RlbmVyKG1lc3NhZ2UsIHNlbmRlciwgd3JhcHBlZFNlbmRSZXNwb25zZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHJlc3VsdCA9IFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpc1Jlc3VsdFRoZW5hYmxlID0gcmVzdWx0ICE9PSB0cnVlICYmIGlzVGhlbmFibGUocmVzdWx0KTtcblxuICAgICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgZGlkbid0IHJldHVybmVkIHRydWUgb3IgYSBQcm9taXNlLCBvciBjYWxsZWRcbiAgICAgICAgLy8gd3JhcHBlZFNlbmRSZXNwb25zZSBzeW5jaHJvbm91c2x5LCB3ZSBjYW4gZXhpdCBlYXJsaWVyXG4gICAgICAgIC8vIGJlY2F1c2UgdGhlcmUgd2lsbCBiZSBubyByZXNwb25zZSBzZW50IGZyb20gdGhpcyBsaXN0ZW5lci5cbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSAmJiAhaXNSZXN1bHRUaGVuYWJsZSAmJiAhZGlkQ2FsbFNlbmRSZXNwb25zZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEEgc21hbGwgaGVscGVyIHRvIHNlbmQgdGhlIG1lc3NhZ2UgaWYgdGhlIHByb21pc2UgcmVzb2x2ZXNcbiAgICAgICAgLy8gYW5kIGFuIGVycm9yIGlmIHRoZSBwcm9taXNlIHJlamVjdHMgKGEgd3JhcHBlZCBzZW5kTWVzc2FnZSBoYXNcbiAgICAgICAgLy8gdG8gdHJhbnNsYXRlIHRoZSBtZXNzYWdlIGludG8gYSByZXNvbHZlZCBwcm9taXNlIG9yIGEgcmVqZWN0ZWRcbiAgICAgICAgLy8gcHJvbWlzZSkuXG4gICAgICAgIGNvbnN0IHNlbmRQcm9taXNlZFJlc3VsdCA9IChwcm9taXNlKSA9PiB7XG4gICAgICAgICAgcHJvbWlzZS50aGVuKG1zZyA9PiB7XG4gICAgICAgICAgICAvLyBzZW5kIHRoZSBtZXNzYWdlIHZhbHVlLlxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKG1zZyk7XG4gICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgLy8gU2VuZCBhIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIGVycm9yIGlmIHRoZSByZWplY3RlZCB2YWx1ZVxuICAgICAgICAgICAgLy8gaXMgYW4gaW5zdGFuY2Ugb2YgZXJyb3IsIG9yIHRoZSBvYmplY3QgaXRzZWxmIG90aGVyd2lzZS5cbiAgICAgICAgICAgIGxldCBtZXNzYWdlO1xuICAgICAgICAgICAgaWYgKGVycm9yICYmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yIHx8XG4gICAgICAgICAgICAgICAgdHlwZW9mIGVycm9yLm1lc3NhZ2UgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICBfX21veldlYkV4dGVuc2lvblBvbHlmaWxsUmVqZWN0X186IHRydWUsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy8gUHJpbnQgYW4gZXJyb3Igb24gdGhlIGNvbnNvbGUgaWYgdW5hYmxlIHRvIHNlbmQgdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzZW5kIG9uTWVzc2FnZSByZWplY3RlZCByZXBseVwiLCBlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5lZCBhIFByb21pc2UsIHNlbmQgdGhlIHJlc29sdmVkIHZhbHVlIGFzIGFcbiAgICAgICAgLy8gcmVzdWx0LCBvdGhlcndpc2Ugd2FpdCB0aGUgcHJvbWlzZSByZWxhdGVkIHRvIHRoZSB3cmFwcGVkU2VuZFJlc3BvbnNlXG4gICAgICAgIC8vIGNhbGxiYWNrIHRvIHJlc29sdmUgYW5kIHNlbmQgaXQgYXMgYSByZXNwb25zZS5cbiAgICAgICAgaWYgKGlzUmVzdWx0VGhlbmFibGUpIHtcbiAgICAgICAgICBzZW5kUHJvbWlzZWRSZXN1bHQocmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZW5kUHJvbWlzZWRSZXN1bHQoc2VuZFJlc3BvbnNlUHJvbWlzZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMZXQgQ2hyb21lIGtub3cgdGhhdCB0aGUgbGlzdGVuZXIgaXMgcmVwbHlpbmcuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHdyYXBwZWRTZW5kTWVzc2FnZUNhbGxiYWNrID0gKHtyZWplY3QsIHJlc29sdmV9LCByZXBseSkgPT4ge1xuICAgICAgaWYgKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgLy8gRGV0ZWN0IHdoZW4gbm9uZSBvZiB0aGUgbGlzdGVuZXJzIHJlcGxpZWQgdG8gdGhlIHNlbmRNZXNzYWdlIGNhbGwgYW5kIHJlc29sdmVcbiAgICAgICAgLy8gdGhlIHByb21pc2UgdG8gdW5kZWZpbmVkIGFzIGluIEZpcmVmb3guXG4gICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS93ZWJleHRlbnNpb24tcG9seWZpbGwvaXNzdWVzLzEzMFxuICAgICAgICBpZiAoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlID09PSBDSFJPTUVfU0VORF9NRVNTQUdFX0NBTExCQUNLX05PX1JFU1BPTlNFX01FU1NBR0UpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChyZXBseSAmJiByZXBseS5fX21veldlYkV4dGVuc2lvblBvbHlmaWxsUmVqZWN0X18pIHtcbiAgICAgICAgLy8gQ29udmVydCBiYWNrIHRoZSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBlcnJvciBpbnRvXG4gICAgICAgIC8vIGFuIEVycm9yIGluc3RhbmNlLlxuICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcGx5Lm1lc3NhZ2UpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUocmVwbHkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCB3cmFwcGVkU2VuZE1lc3NhZ2UgPSAobmFtZSwgbWV0YWRhdGEsIGFwaU5hbWVzcGFjZU9iaiwgLi4uYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MubGVuZ3RoIDwgbWV0YWRhdGEubWluQXJncykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IGxlYXN0ICR7bWV0YWRhdGEubWluQXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWluQXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXJncy5sZW5ndGggPiBtZXRhZGF0YS5tYXhBcmdzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbW9zdCAke21ldGFkYXRhLm1heEFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1heEFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgd3JhcHBlZENiID0gd3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2suYmluZChudWxsLCB7cmVzb2x2ZSwgcmVqZWN0fSk7XG4gICAgICAgIGFyZ3MucHVzaCh3cmFwcGVkQ2IpO1xuICAgICAgICBhcGlOYW1lc3BhY2VPYmouc2VuZE1lc3NhZ2UoLi4uYXJncyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3RhdGljV3JhcHBlcnMgPSB7XG4gICAgICBkZXZ0b29sczoge1xuICAgICAgICBuZXR3b3JrOiB7XG4gICAgICAgICAgb25SZXF1ZXN0RmluaXNoZWQ6IHdyYXBFdmVudChvblJlcXVlc3RGaW5pc2hlZFdyYXBwZXJzKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBydW50aW1lOiB7XG4gICAgICAgIG9uTWVzc2FnZTogd3JhcEV2ZW50KG9uTWVzc2FnZVdyYXBwZXJzKSxcbiAgICAgICAgb25NZXNzYWdlRXh0ZXJuYWw6IHdyYXBFdmVudChvbk1lc3NhZ2VXcmFwcGVycyksXG4gICAgICAgIHNlbmRNZXNzYWdlOiB3cmFwcGVkU2VuZE1lc3NhZ2UuYmluZChudWxsLCBcInNlbmRNZXNzYWdlXCIsIHttaW5BcmdzOiAxLCBtYXhBcmdzOiAzfSksXG4gICAgICB9LFxuICAgICAgdGFiczoge1xuICAgICAgICBzZW5kTWVzc2FnZTogd3JhcHBlZFNlbmRNZXNzYWdlLmJpbmQobnVsbCwgXCJzZW5kTWVzc2FnZVwiLCB7bWluQXJnczogMiwgbWF4QXJnczogM30pLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHNldHRpbmdNZXRhZGF0YSA9IHtcbiAgICAgIGNsZWFyOiB7bWluQXJnczogMSwgbWF4QXJnczogMX0sXG4gICAgICBnZXQ6IHttaW5BcmdzOiAxLCBtYXhBcmdzOiAxfSxcbiAgICAgIHNldDoge21pbkFyZ3M6IDEsIG1heEFyZ3M6IDF9LFxuICAgIH07XG4gICAgYXBpTWV0YWRhdGEucHJpdmFjeSA9IHtcbiAgICAgIG5ldHdvcms6IHtcIipcIjogc2V0dGluZ01ldGFkYXRhfSxcbiAgICAgIHNlcnZpY2VzOiB7XCIqXCI6IHNldHRpbmdNZXRhZGF0YX0sXG4gICAgICB3ZWJzaXRlczoge1wiKlwiOiBzZXR0aW5nTWV0YWRhdGF9LFxuICAgIH07XG5cbiAgICByZXR1cm4gd3JhcE9iamVjdChleHRlbnNpb25BUElzLCBzdGF0aWNXcmFwcGVycywgYXBpTWV0YWRhdGEpO1xuICB9O1xuXG4gIC8vIFRoZSBidWlsZCBwcm9jZXNzIGFkZHMgYSBVTUQgd3JhcHBlciBhcm91bmQgdGhpcyBmaWxlLCB3aGljaCBtYWtlcyB0aGVcbiAgLy8gYG1vZHVsZWAgdmFyaWFibGUgYXZhaWxhYmxlLlxuICBtb2R1bGUuZXhwb3J0cyA9IHdyYXBBUElzKGNocm9tZSk7XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbFRoaXMuYnJvd3Nlcjtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9lcnJvclwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9lbnZcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZm9ybWF0XCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3JvdXRpbmdcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vdHlwZXNcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vdmFsaWRhdG9yc1wiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLG51bGwsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG0sIGspO1xyXG4gICAgaWYgKCFkZXNjIHx8IChcImdldFwiIGluIGRlc2MgPyAhbS5fX2VzTW9kdWxlIDogZGVzYy53cml0YWJsZSB8fCBkZXNjLmNvbmZpZ3VyYWJsZSkpIHtcclxuICAgICAgICBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9O1xyXG4gICAgfVxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCBkZXNjKTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXhwb3J0U3RhcihtLCBvKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSBfX2NyZWF0ZUJpbmRpbmcobywgbSwgcCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3ZhbHVlcyhvKSB7XHJcbiAgICB2YXIgcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBTeW1ib2wuaXRlcmF0b3IsIG0gPSBzICYmIG9bc10sIGkgPSAwO1xyXG4gICAgaWYgKG0pIHJldHVybiBtLmNhbGwobyk7XHJcbiAgICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWQoKSB7XHJcbiAgICBmb3IgKHZhciBhciA9IFtdLCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKylcclxuICAgICAgICBhciA9IGFyLmNvbmNhdChfX3JlYWQoYXJndW1lbnRzW2ldKSk7XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheXMoKSB7XHJcbiAgICBmb3IgKHZhciBzID0gMCwgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHMgKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuICAgIGZvciAodmFyIHIgPSBBcnJheShzKSwgayA9IDAsIGkgPSAwOyBpIDwgaWw7IGkrKylcclxuICAgICAgICBmb3IgKHZhciBhID0gYXJndW1lbnRzW2ldLCBqID0gMCwgamwgPSBhLmxlbmd0aDsgaiA8IGpsOyBqKyssIGsrKylcclxuICAgICAgICAgICAgcltrXSA9IGFbal07XHJcbiAgICByZXR1cm4gcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXkodG8sIGZyb20sIHBhY2spIHtcclxuICAgIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGFyIHx8ICEoaSBpbiBmcm9tKSkge1xyXG4gICAgICAgICAgICBpZiAoIWFyKSBhciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20sIDAsIGkpO1xyXG4gICAgICAgICAgICBhcltpXSA9IGZyb21baV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0KHYpIHtcclxuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgX19hd2FpdCA/ICh0aGlzLnYgPSB2LCB0aGlzKSA6IG5ldyBfX2F3YWl0KHYpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0dlbmVyYXRvcih0aGlzQXJnLCBfYXJndW1lbnRzLCBnZW5lcmF0b3IpIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgZyA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSwgaSwgcSA9IFtdO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlmIChnW25dKSBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChhLCBiKSB7IHEucHVzaChbbiwgdiwgYSwgYl0pID4gMSB8fCByZXN1bWUobiwgdik7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiByZXN1bWUobiwgdikgeyB0cnkgeyBzdGVwKGdbbl0odikpOyB9IGNhdGNoIChlKSB7IHNldHRsZShxWzBdWzNdLCBlKTsgfSB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogbiA9PT0gXCJyZXR1cm5cIiB9IDogZiA/IGYodikgOiB2OyB9IDogZjsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY1ZhbHVlcyhvKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIG0gPSBvW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSwgaTtcclxuICAgIHJldHVybiBtID8gbS5jYWxsKG8pIDogKG8gPSB0eXBlb2YgX192YWx1ZXMgPT09IFwiZnVuY3Rpb25cIiA/IF9fdmFsdWVzKG8pIDogb1tTeW1ib2wuaXRlcmF0b3JdKCksIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpKTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpW25dID0gb1tuXSAmJiBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2ID0gb1tuXSh2KSwgc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgdi5kb25lLCB2LnZhbHVlKTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShyZXNvbHZlLCByZWplY3QsIGQsIHYpIHsgUHJvbWlzZS5yZXNvbHZlKHYpLnRoZW4oZnVuY3Rpb24odikgeyByZXNvbHZlKHsgdmFsdWU6IHYsIGRvbmU6IGQgfSk7IH0sIHJlamVjdCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWFrZVRlbXBsYXRlT2JqZWN0KGNvb2tlZCwgcmF3KSB7XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb29rZWQsIFwicmF3XCIsIHsgdmFsdWU6IHJhdyB9KTsgfSBlbHNlIHsgY29va2VkLnJhdyA9IHJhdzsgfVxyXG4gICAgcmV0dXJuIGNvb2tlZDtcclxufTtcclxuXHJcbnZhciBfX3NldE1vZHVsZURlZmF1bHQgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBcImRlZmF1bHRcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdiB9KTtcclxufSkgOiBmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBvW1wiZGVmYXVsdFwiXSA9IHY7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnRTdGFyKG1vZCkge1xyXG4gICAgaWYgKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgcmV0dXJuIG1vZDtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGlmIChtb2QgIT0gbnVsbCkgZm9yICh2YXIgayBpbiBtb2QpIGlmIChrICE9PSBcImRlZmF1bHRcIiAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgX19jcmVhdGVCaW5kaW5nKHJlc3VsdCwgbW9kLCBrKTtcclxuICAgIF9fc2V0TW9kdWxlRGVmYXVsdChyZXN1bHQsIG1vZCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRHZXQocmVjZWl2ZXIsIHN0YXRlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBnZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCByZWFkIHByaXZhdGUgbWVtYmVyIGZyb20gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcclxuICAgIHJldHVybiBraW5kID09PSBcIm1cIiA/IGYgOiBraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlcikgOiBmID8gZi52YWx1ZSA6IHN0YXRlLmdldChyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHJlY2VpdmVyLCBzdGF0ZSwgdmFsdWUsIGtpbmQsIGYpIHtcclxuICAgIGlmIChraW5kID09PSBcIm1cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgbWV0aG9kIGlzIG5vdCB3cml0YWJsZVwiKTtcclxuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIHNldHRlclwiKTtcclxuICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHdyaXRlIHByaXZhdGUgbWVtYmVyIHRvIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4gKGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyLCB2YWx1ZSkgOiBmID8gZi52YWx1ZSA9IHZhbHVlIDogc3RhdGUuc2V0KHJlY2VpdmVyLCB2YWx1ZSkpLCB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRJbihzdGF0ZSwgcmVjZWl2ZXIpIHtcclxuICAgIGlmIChyZWNlaXZlciA9PT0gbnVsbCB8fCAodHlwZW9mIHJlY2VpdmVyICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiByZWNlaXZlciAhPT0gXCJmdW5jdGlvblwiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB1c2UgJ2luJyBvcGVyYXRvciBvbiBub24tb2JqZWN0XCIpO1xyXG4gICAgcmV0dXJuIHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgPT09IHN0YXRlIDogc3RhdGUuaGFzKHJlY2VpdmVyKTtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU1RBTkRBUkRfRVJST1JfTUFQID0gZXhwb3J0cy5TRVJWRVJfRVJST1JfQ09ERV9SQU5HRSA9IGV4cG9ydHMuUkVTRVJWRURfRVJST1JfQ09ERVMgPSBleHBvcnRzLlNFUlZFUl9FUlJPUiA9IGV4cG9ydHMuSU5URVJOQUxfRVJST1IgPSBleHBvcnRzLklOVkFMSURfUEFSQU1TID0gZXhwb3J0cy5NRVRIT0RfTk9UX0ZPVU5EID0gZXhwb3J0cy5JTlZBTElEX1JFUVVFU1QgPSBleHBvcnRzLlBBUlNFX0VSUk9SID0gdm9pZCAwO1xuZXhwb3J0cy5QQVJTRV9FUlJPUiA9IFwiUEFSU0VfRVJST1JcIjtcbmV4cG9ydHMuSU5WQUxJRF9SRVFVRVNUID0gXCJJTlZBTElEX1JFUVVFU1RcIjtcbmV4cG9ydHMuTUVUSE9EX05PVF9GT1VORCA9IFwiTUVUSE9EX05PVF9GT1VORFwiO1xuZXhwb3J0cy5JTlZBTElEX1BBUkFNUyA9IFwiSU5WQUxJRF9QQVJBTVNcIjtcbmV4cG9ydHMuSU5URVJOQUxfRVJST1IgPSBcIklOVEVSTkFMX0VSUk9SXCI7XG5leHBvcnRzLlNFUlZFUl9FUlJPUiA9IFwiU0VSVkVSX0VSUk9SXCI7XG5leHBvcnRzLlJFU0VSVkVEX0VSUk9SX0NPREVTID0gWy0zMjcwMCwgLTMyNjAwLCAtMzI2MDEsIC0zMjYwMiwgLTMyNjAzXTtcbmV4cG9ydHMuU0VSVkVSX0VSUk9SX0NPREVfUkFOR0UgPSBbLTMyMDAwLCAtMzIwOTldO1xuZXhwb3J0cy5TVEFOREFSRF9FUlJPUl9NQVAgPSB7XG4gICAgW2V4cG9ydHMuUEFSU0VfRVJST1JdOiB7IGNvZGU6IC0zMjcwMCwgbWVzc2FnZTogXCJQYXJzZSBlcnJvclwiIH0sXG4gICAgW2V4cG9ydHMuSU5WQUxJRF9SRVFVRVNUXTogeyBjb2RlOiAtMzI2MDAsIG1lc3NhZ2U6IFwiSW52YWxpZCBSZXF1ZXN0XCIgfSxcbiAgICBbZXhwb3J0cy5NRVRIT0RfTk9UX0ZPVU5EXTogeyBjb2RlOiAtMzI2MDEsIG1lc3NhZ2U6IFwiTWV0aG9kIG5vdCBmb3VuZFwiIH0sXG4gICAgW2V4cG9ydHMuSU5WQUxJRF9QQVJBTVNdOiB7IGNvZGU6IC0zMjYwMiwgbWVzc2FnZTogXCJJbnZhbGlkIHBhcmFtc1wiIH0sXG4gICAgW2V4cG9ydHMuSU5URVJOQUxfRVJST1JdOiB7IGNvZGU6IC0zMjYwMywgbWVzc2FnZTogXCJJbnRlcm5hbCBlcnJvclwiIH0sXG4gICAgW2V4cG9ydHMuU0VSVkVSX0VSUk9SXTogeyBjb2RlOiAtMzIwMDAsIG1lc3NhZ2U6IFwiU2VydmVyIGVycm9yXCIgfSxcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb25zdGFudHMuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMudmFsaWRhdGVKc29uUnBjRXJyb3IgPSBleHBvcnRzLmdldEVycm9yQnlDb2RlID0gZXhwb3J0cy5nZXRFcnJvciA9IGV4cG9ydHMuaXNWYWxpZEVycm9yQ29kZSA9IGV4cG9ydHMuaXNSZXNlcnZlZEVycm9yQ29kZSA9IGV4cG9ydHMuaXNTZXJ2ZXJFcnJvckNvZGUgPSB2b2lkIDA7XG5jb25zdCBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbmZ1bmN0aW9uIGlzU2VydmVyRXJyb3JDb2RlKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZSA8PSBjb25zdGFudHNfMS5TRVJWRVJfRVJST1JfQ09ERV9SQU5HRVswXSAmJiBjb2RlID49IGNvbnN0YW50c18xLlNFUlZFUl9FUlJPUl9DT0RFX1JBTkdFWzFdO1xufVxuZXhwb3J0cy5pc1NlcnZlckVycm9yQ29kZSA9IGlzU2VydmVyRXJyb3JDb2RlO1xuZnVuY3Rpb24gaXNSZXNlcnZlZEVycm9yQ29kZShjb2RlKSB7XG4gICAgcmV0dXJuIGNvbnN0YW50c18xLlJFU0VSVkVEX0VSUk9SX0NPREVTLmluY2x1ZGVzKGNvZGUpO1xufVxuZXhwb3J0cy5pc1Jlc2VydmVkRXJyb3JDb2RlID0gaXNSZXNlcnZlZEVycm9yQ29kZTtcbmZ1bmN0aW9uIGlzVmFsaWRFcnJvckNvZGUoY29kZSkge1xuICAgIHJldHVybiB0eXBlb2YgY29kZSA9PT0gXCJudW1iZXJcIjtcbn1cbmV4cG9ydHMuaXNWYWxpZEVycm9yQ29kZSA9IGlzVmFsaWRFcnJvckNvZGU7XG5mdW5jdGlvbiBnZXRFcnJvcih0eXBlKSB7XG4gICAgaWYgKCFPYmplY3Qua2V5cyhjb25zdGFudHNfMS5TVEFOREFSRF9FUlJPUl9NQVApLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgIHJldHVybiBjb25zdGFudHNfMS5TVEFOREFSRF9FUlJPUl9NQVBbY29uc3RhbnRzXzEuSU5URVJOQUxfRVJST1JdO1xuICAgIH1cbiAgICByZXR1cm4gY29uc3RhbnRzXzEuU1RBTkRBUkRfRVJST1JfTUFQW3R5cGVdO1xufVxuZXhwb3J0cy5nZXRFcnJvciA9IGdldEVycm9yO1xuZnVuY3Rpb24gZ2V0RXJyb3JCeUNvZGUoY29kZSkge1xuICAgIGNvbnN0IG1hdGNoID0gT2JqZWN0LnZhbHVlcyhjb25zdGFudHNfMS5TVEFOREFSRF9FUlJPUl9NQVApLmZpbmQoZSA9PiBlLmNvZGUgPT09IGNvZGUpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGNvbnN0YW50c18xLlNUQU5EQVJEX0VSUk9SX01BUFtjb25zdGFudHNfMS5JTlRFUk5BTF9FUlJPUl07XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbn1cbmV4cG9ydHMuZ2V0RXJyb3JCeUNvZGUgPSBnZXRFcnJvckJ5Q29kZTtcbmZ1bmN0aW9uIHZhbGlkYXRlSnNvblJwY0Vycm9yKHJlc3BvbnNlKSB7XG4gICAgaWYgKHR5cGVvZiByZXNwb25zZS5lcnJvci5jb2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSwgZXJyb3I6IFwiTWlzc2luZyBjb2RlIGZvciBKU09OLVJQQyBlcnJvclwiIH07XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcmVzcG9uc2UuZXJyb3IubWVzc2FnZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIGVycm9yOiBcIk1pc3NpbmcgbWVzc2FnZSBmb3IgSlNPTi1SUEMgZXJyb3JcIiB9O1xuICAgIH1cbiAgICBpZiAoIWlzVmFsaWRFcnJvckNvZGUocmVzcG9uc2UuZXJyb3IuY29kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbGlkOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBgSW52YWxpZCBlcnJvciBjb2RlIHR5cGUgZm9yIEpTT04tUlBDOiAke3Jlc3BvbnNlLmVycm9yLmNvZGV9YCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGlzUmVzZXJ2ZWRFcnJvckNvZGUocmVzcG9uc2UuZXJyb3IuY29kZSkpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBnZXRFcnJvckJ5Q29kZShyZXNwb25zZS5lcnJvci5jb2RlKTtcbiAgICAgICAgaWYgKGVycm9yLm1lc3NhZ2UgIT09IGNvbnN0YW50c18xLlNUQU5EQVJEX0VSUk9SX01BUFtjb25zdGFudHNfMS5JTlRFUk5BTF9FUlJPUl0ubWVzc2FnZSAmJlxuICAgICAgICAgICAgcmVzcG9uc2UuZXJyb3IubWVzc2FnZSA9PT0gZXJyb3IubWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2YWxpZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGBJbnZhbGlkIGVycm9yIGNvZGUgbWVzc2FnZSBmb3IgSlNPTi1SUEM6ICR7cmVzcG9uc2UuZXJyb3IuY29kZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSB9O1xufVxuZXhwb3J0cy52YWxpZGF0ZUpzb25ScGNFcnJvciA9IHZhbGlkYXRlSnNvblJwY0Vycm9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZXJyb3IuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuaXNOb2RlSnMgPSB2b2lkIDA7XG5jb25zdCB0c2xpYl8xID0gcmVxdWlyZShcInRzbGliXCIpO1xuY29uc3QgZW52aXJvbm1lbnRfMSA9IHJlcXVpcmUoXCJAcGVkcm91aWQvZW52aXJvbm1lbnRcIik7XG5leHBvcnRzLmlzTm9kZUpzID0gZW52aXJvbm1lbnRfMS5pc05vZGU7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiQHBlZHJvdWlkL2Vudmlyb25tZW50XCIpLCBleHBvcnRzKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVudi5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xuICAgIG9bazJdID0gbVtrXTtcbn0pKTtcbnZhciBfX2V4cG9ydFN0YXIgPSAodGhpcyAmJiB0aGlzLl9fZXhwb3J0U3RhcikgfHwgZnVuY3Rpb24obSwgZXhwb3J0cykge1xuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBfX2NyZWF0ZUJpbmRpbmcoZXhwb3J0cywgbSwgcCk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2NyeXB0b1wiKSwgZXhwb3J0cyk7XG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZW52XCIpLCBleHBvcnRzKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzQnJvd3NlckNyeXB0b0F2YWlsYWJsZSA9IGV4cG9ydHMuZ2V0U3VidGxlQ3J5cHRvID0gZXhwb3J0cy5nZXRCcm93ZXJDcnlwdG8gPSB2b2lkIDA7XG5mdW5jdGlvbiBnZXRCcm93ZXJDcnlwdG8oKSB7XG4gICAgcmV0dXJuIChnbG9iYWwgPT09IG51bGwgfHwgZ2xvYmFsID09PSB2b2lkIDAgPyB2b2lkIDAgOiBnbG9iYWwuY3J5cHRvKSB8fCAoZ2xvYmFsID09PSBudWxsIHx8IGdsb2JhbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogZ2xvYmFsLm1zQ3J5cHRvKSB8fCB7fTtcbn1cbmV4cG9ydHMuZ2V0QnJvd2VyQ3J5cHRvID0gZ2V0QnJvd2VyQ3J5cHRvO1xuZnVuY3Rpb24gZ2V0U3VidGxlQ3J5cHRvKCkge1xuICAgIGNvbnN0IGJyb3dzZXJDcnlwdG8gPSBnZXRCcm93ZXJDcnlwdG8oKTtcbiAgICByZXR1cm4gYnJvd3NlckNyeXB0by5zdWJ0bGUgfHwgYnJvd3NlckNyeXB0by53ZWJraXRTdWJ0bGU7XG59XG5leHBvcnRzLmdldFN1YnRsZUNyeXB0byA9IGdldFN1YnRsZUNyeXB0bztcbmZ1bmN0aW9uIGlzQnJvd3NlckNyeXB0b0F2YWlsYWJsZSgpIHtcbiAgICByZXR1cm4gISFnZXRCcm93ZXJDcnlwdG8oKSAmJiAhIWdldFN1YnRsZUNyeXB0bygpO1xufVxuZXhwb3J0cy5pc0Jyb3dzZXJDcnlwdG9BdmFpbGFibGUgPSBpc0Jyb3dzZXJDcnlwdG9BdmFpbGFibGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jcnlwdG8uanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuaXNCcm93c2VyID0gZXhwb3J0cy5pc05vZGUgPSBleHBvcnRzLmlzUmVhY3ROYXRpdmUgPSB2b2lkIDA7XG5mdW5jdGlvbiBpc1JlYWN0TmF0aXZlKCkge1xuICAgIHJldHVybiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICBuYXZpZ2F0b3IucHJvZHVjdCA9PT0gJ1JlYWN0TmF0aXZlJyk7XG59XG5leHBvcnRzLmlzUmVhY3ROYXRpdmUgPSBpc1JlYWN0TmF0aXZlO1xuZnVuY3Rpb24gaXNOb2RlKCkge1xuICAgIHJldHVybiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHR5cGVvZiBwcm9jZXNzLnZlcnNpb25zICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICB0eXBlb2YgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlICE9PSAndW5kZWZpbmVkJyk7XG59XG5leHBvcnRzLmlzTm9kZSA9IGlzTm9kZTtcbmZ1bmN0aW9uIGlzQnJvd3NlcigpIHtcbiAgICByZXR1cm4gIWlzUmVhY3ROYXRpdmUoKSAmJiAhaXNOb2RlKCk7XG59XG5leHBvcnRzLmlzQnJvd3NlciA9IGlzQnJvd3Nlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVudi5qcy5tYXAiLG51bGwsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZm9ybWF0RXJyb3JNZXNzYWdlID0gZXhwb3J0cy5mb3JtYXRKc29uUnBjRXJyb3IgPSBleHBvcnRzLmZvcm1hdEpzb25ScGNSZXN1bHQgPSBleHBvcnRzLmZvcm1hdEpzb25ScGNSZXF1ZXN0ID0gZXhwb3J0cy5wYXlsb2FkSWQgPSB2b2lkIDA7XG5jb25zdCBlcnJvcl8xID0gcmVxdWlyZShcIi4vZXJyb3JcIik7XG5jb25zdCBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbmZ1bmN0aW9uIHBheWxvYWRJZCgpIHtcbiAgICBjb25zdCBkYXRlID0gRGF0ZS5ub3coKSAqIE1hdGgucG93KDEwLCAzKTtcbiAgICBjb25zdCBleHRyYSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDEwLCAzKSk7XG4gICAgcmV0dXJuIGRhdGUgKyBleHRyYTtcbn1cbmV4cG9ydHMucGF5bG9hZElkID0gcGF5bG9hZElkO1xuZnVuY3Rpb24gZm9ybWF0SnNvblJwY1JlcXVlc3QobWV0aG9kLCBwYXJhbXMsIGlkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGlkIHx8IHBheWxvYWRJZCgpLFxuICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxuICAgICAgICBtZXRob2QsXG4gICAgICAgIHBhcmFtcyxcbiAgICB9O1xufVxuZXhwb3J0cy5mb3JtYXRKc29uUnBjUmVxdWVzdCA9IGZvcm1hdEpzb25ScGNSZXF1ZXN0O1xuZnVuY3Rpb24gZm9ybWF0SnNvblJwY1Jlc3VsdChpZCwgcmVzdWx0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQsXG4gICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICAgIHJlc3VsdCxcbiAgICB9O1xufVxuZXhwb3J0cy5mb3JtYXRKc29uUnBjUmVzdWx0ID0gZm9ybWF0SnNvblJwY1Jlc3VsdDtcbmZ1bmN0aW9uIGZvcm1hdEpzb25ScGNFcnJvcihpZCwgZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBpZCxcbiAgICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgICAgZXJyb3I6IGZvcm1hdEVycm9yTWVzc2FnZShlcnJvciksXG4gICAgfTtcbn1cbmV4cG9ydHMuZm9ybWF0SnNvblJwY0Vycm9yID0gZm9ybWF0SnNvblJwY0Vycm9yO1xuZnVuY3Rpb24gZm9ybWF0RXJyb3JNZXNzYWdlKGVycm9yKSB7XG4gICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4gZXJyb3JfMS5nZXRFcnJvcihjb25zdGFudHNfMS5JTlRFUk5BTF9FUlJPUik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZXJyb3IgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZXJyb3IgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGVycm9yXzEuZ2V0RXJyb3IoY29uc3RhbnRzXzEuU0VSVkVSX0VSUk9SKSksIHsgbWVzc2FnZTogZXJyb3IgfSk7XG4gICAgfVxuICAgIGlmIChlcnJvcl8xLmlzUmVzZXJ2ZWRFcnJvckNvZGUoZXJyb3IuY29kZSkpIHtcbiAgICAgICAgZXJyb3IgPSBlcnJvcl8xLmdldEVycm9yQnlDb2RlKGVycm9yLmNvZGUpO1xuICAgIH1cbiAgICBpZiAoIWVycm9yXzEuaXNTZXJ2ZXJFcnJvckNvZGUoZXJyb3IuY29kZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgY29kZSBpcyBub3QgaW4gc2VydmVyIGNvZGUgcmFuZ2VcIik7XG4gICAgfVxuICAgIHJldHVybiBlcnJvcjtcbn1cbmV4cG9ydHMuZm9ybWF0RXJyb3JNZXNzYWdlID0gZm9ybWF0RXJyb3JNZXNzYWdlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Zm9ybWF0LmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzVmFsaWRUcmFpbGluZ1dpbGRjYXJkUm91dGUgPSBleHBvcnRzLmlzVmFsaWRMZWFkaW5nV2lsZGNhcmRSb3V0ZSA9IGV4cG9ydHMuaXNWYWxpZFdpbGRjYXJkUm91dGUgPSBleHBvcnRzLmlzVmFsaWREZWZhdWx0Um91dGUgPSBleHBvcnRzLmlzVmFsaWRSb3V0ZSA9IHZvaWQgMDtcbmZ1bmN0aW9uIGlzVmFsaWRSb3V0ZShyb3V0ZSkge1xuICAgIGlmIChyb3V0ZS5pbmNsdWRlcyhcIipcIikpIHtcbiAgICAgICAgcmV0dXJuIGlzVmFsaWRXaWxkY2FyZFJvdXRlKHJvdXRlKTtcbiAgICB9XG4gICAgaWYgKC9cXFcvZy50ZXN0KHJvdXRlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0cy5pc1ZhbGlkUm91dGUgPSBpc1ZhbGlkUm91dGU7XG5mdW5jdGlvbiBpc1ZhbGlkRGVmYXVsdFJvdXRlKHJvdXRlKSB7XG4gICAgcmV0dXJuIHJvdXRlID09PSBcIipcIjtcbn1cbmV4cG9ydHMuaXNWYWxpZERlZmF1bHRSb3V0ZSA9IGlzVmFsaWREZWZhdWx0Um91dGU7XG5mdW5jdGlvbiBpc1ZhbGlkV2lsZGNhcmRSb3V0ZShyb3V0ZSkge1xuICAgIGlmIChpc1ZhbGlkRGVmYXVsdFJvdXRlKHJvdXRlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCFyb3V0ZS5pbmNsdWRlcyhcIipcIikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAocm91dGUuc3BsaXQoXCIqXCIpLmxlbmd0aCAhPT0gMikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChyb3V0ZS5zcGxpdChcIipcIikuZmlsdGVyKHggPT4geC50cmltKCkgPT09IFwiXCIpLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0cy5pc1ZhbGlkV2lsZGNhcmRSb3V0ZSA9IGlzVmFsaWRXaWxkY2FyZFJvdXRlO1xuZnVuY3Rpb24gaXNWYWxpZExlYWRpbmdXaWxkY2FyZFJvdXRlKHJvdXRlKSB7XG4gICAgcmV0dXJuICFpc1ZhbGlkRGVmYXVsdFJvdXRlKHJvdXRlKSAmJiBpc1ZhbGlkV2lsZGNhcmRSb3V0ZShyb3V0ZSkgJiYgIXJvdXRlLnNwbGl0KFwiKlwiKVswXS50cmltKCk7XG59XG5leHBvcnRzLmlzVmFsaWRMZWFkaW5nV2lsZGNhcmRSb3V0ZSA9IGlzVmFsaWRMZWFkaW5nV2lsZGNhcmRSb3V0ZTtcbmZ1bmN0aW9uIGlzVmFsaWRUcmFpbGluZ1dpbGRjYXJkUm91dGUocm91dGUpIHtcbiAgICByZXR1cm4gIWlzVmFsaWREZWZhdWx0Um91dGUocm91dGUpICYmIGlzVmFsaWRXaWxkY2FyZFJvdXRlKHJvdXRlKSAmJiAhcm91dGUuc3BsaXQoXCIqXCIpWzFdLnRyaW0oKTtcbn1cbmV4cG9ydHMuaXNWYWxpZFRyYWlsaW5nV2lsZGNhcmRSb3V0ZSA9IGlzVmFsaWRUcmFpbGluZ1dpbGRjYXJkUm91dGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yb3V0aW5nLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCB0c2xpYl8xID0gcmVxdWlyZShcInRzbGliXCIpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIkBqc29uLXJwYy10b29scy90eXBlc1wiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10eXBlcy5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2Jsb2NrY2hhaW5cIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vanNvbnJwY1wiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9taXNjXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL211bHRpXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3Byb3ZpZGVyXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3JvdXRlclwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9zY2hlbWFcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vdmFsaWRhdG9yXCIpLCBleHBvcnRzKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklCbG9ja2NoYWluUHJvdmlkZXIgPSBleHBvcnRzLklCbG9ja2NoYWluQXV0aGVudGljYXRvciA9IGV4cG9ydHMuSVBlbmRpbmdSZXF1ZXN0cyA9IHZvaWQgMDtcbmNvbnN0IG1pc2NfMSA9IHJlcXVpcmUoXCIuL21pc2NcIik7XG5jb25zdCBwcm92aWRlcl8xID0gcmVxdWlyZShcIi4vcHJvdmlkZXJcIik7XG5jbGFzcyBJUGVuZGluZ1JlcXVlc3RzIHtcbiAgICBjb25zdHJ1Y3RvcihzdG9yYWdlKSB7XG4gICAgICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gICAgfVxufVxuZXhwb3J0cy5JUGVuZGluZ1JlcXVlc3RzID0gSVBlbmRpbmdSZXF1ZXN0cztcbmNsYXNzIElCbG9ja2NoYWluQXV0aGVudGljYXRvciBleHRlbmRzIG1pc2NfMS5JRXZlbnRzIHtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgfVxufVxuZXhwb3J0cy5JQmxvY2tjaGFpbkF1dGhlbnRpY2F0b3IgPSBJQmxvY2tjaGFpbkF1dGhlbnRpY2F0b3I7XG5jbGFzcyBJQmxvY2tjaGFpblByb3ZpZGVyIGV4dGVuZHMgcHJvdmlkZXJfMS5JSnNvblJwY1Byb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uLCBjb25maWcpIHtcbiAgICAgICAgc3VwZXIoY29ubmVjdGlvbik7XG4gICAgfVxufVxuZXhwb3J0cy5JQmxvY2tjaGFpblByb3ZpZGVyID0gSUJsb2NrY2hhaW5Qcm92aWRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJsb2NrY2hhaW4uanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSUV2ZW50cyA9IHZvaWQgMDtcbmNsYXNzIElFdmVudHMge1xufVxuZXhwb3J0cy5JRXZlbnRzID0gSUV2ZW50cztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1pc2MuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSUpzb25ScGNQcm92aWRlciA9IGV4cG9ydHMuSUJhc2VKc29uUnBjUHJvdmlkZXIgPSBleHBvcnRzLklKc29uUnBjQ29ubmVjdGlvbiA9IHZvaWQgMDtcbmNvbnN0IG1pc2NfMSA9IHJlcXVpcmUoXCIuL21pc2NcIik7XG5jbGFzcyBJSnNvblJwY0Nvbm5lY3Rpb24gZXh0ZW5kcyBtaXNjXzEuSUV2ZW50cyB7XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuSUpzb25ScGNDb25uZWN0aW9uID0gSUpzb25ScGNDb25uZWN0aW9uO1xuY2xhc3MgSUJhc2VKc29uUnBjUHJvdmlkZXIgZXh0ZW5kcyBtaXNjXzEuSUV2ZW50cyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuZXhwb3J0cy5JQmFzZUpzb25ScGNQcm92aWRlciA9IElCYXNlSnNvblJwY1Byb3ZpZGVyO1xuY2xhc3MgSUpzb25ScGNQcm92aWRlciBleHRlbmRzIElCYXNlSnNvblJwY1Byb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxufVxuZXhwb3J0cy5JSnNvblJwY1Byb3ZpZGVyID0gSUpzb25ScGNQcm92aWRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb3ZpZGVyLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1qc29ucnBjLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklNdWx0aVNlcnZpY2VQcm92aWRlciA9IHZvaWQgMDtcbmNvbnN0IHByb3ZpZGVyXzEgPSByZXF1aXJlKFwiLi9wcm92aWRlclwiKTtcbmNsYXNzIElNdWx0aVNlcnZpY2VQcm92aWRlciBleHRlbmRzIHByb3ZpZGVyXzEuSUJhc2VKc29uUnBjUHJvdmlkZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB9XG59XG5leHBvcnRzLklNdWx0aVNlcnZpY2VQcm92aWRlciA9IElNdWx0aVNlcnZpY2VQcm92aWRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW11bHRpLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklKc29uUnBjUm91dGVyID0gdm9pZCAwO1xuY2xhc3MgSUpzb25ScGNSb3V0ZXIge1xuICAgIGNvbnN0cnVjdG9yKHJvdXRlcykge1xuICAgICAgICB0aGlzLnJvdXRlcyA9IHJvdXRlcztcbiAgICB9XG59XG5leHBvcnRzLklKc29uUnBjUm91dGVyID0gSUpzb25ScGNSb3V0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yb3V0ZXIuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNjaGVtYS5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JSnNvblJwY1ZhbGlkYXRvciA9IHZvaWQgMDtcbmNsYXNzIElKc29uUnBjVmFsaWRhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihzY2hlbWFzKSB7XG4gICAgICAgIHRoaXMuc2NoZW1hcyA9IHNjaGVtYXM7XG4gICAgfVxufVxuZXhwb3J0cy5JSnNvblJwY1ZhbGlkYXRvciA9IElKc29uUnBjVmFsaWRhdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dmFsaWRhdG9yLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzSnNvblJwY1ZhbGlkYXRpb25JbnZhbGlkID0gZXhwb3J0cy5pc0pzb25ScGNFcnJvciA9IGV4cG9ydHMuaXNKc29uUnBjUmVzdWx0ID0gZXhwb3J0cy5pc0pzb25ScGNSZXNwb25zZSA9IGV4cG9ydHMuaXNKc29uUnBjUmVxdWVzdCA9IGV4cG9ydHMuaXNKc29uUnBjUGF5bG9hZCA9IHZvaWQgMDtcbmZ1bmN0aW9uIGlzSnNvblJwY1BheWxvYWQocGF5bG9hZCkge1xuICAgIHJldHVybiBcImlkXCIgaW4gcGF5bG9hZCAmJiBcImpzb25ycGNcIiBpbiBwYXlsb2FkICYmIHBheWxvYWQuanNvbnJwYyA9PT0gXCIyLjBcIjtcbn1cbmV4cG9ydHMuaXNKc29uUnBjUGF5bG9hZCA9IGlzSnNvblJwY1BheWxvYWQ7XG5mdW5jdGlvbiBpc0pzb25ScGNSZXF1ZXN0KHBheWxvYWQpIHtcbiAgICByZXR1cm4gaXNKc29uUnBjUGF5bG9hZChwYXlsb2FkKSAmJiBcIm1ldGhvZFwiIGluIHBheWxvYWQ7XG59XG5leHBvcnRzLmlzSnNvblJwY1JlcXVlc3QgPSBpc0pzb25ScGNSZXF1ZXN0O1xuZnVuY3Rpb24gaXNKc29uUnBjUmVzcG9uc2UocGF5bG9hZCkge1xuICAgIHJldHVybiBpc0pzb25ScGNQYXlsb2FkKHBheWxvYWQpICYmIChpc0pzb25ScGNSZXN1bHQocGF5bG9hZCkgfHwgaXNKc29uUnBjRXJyb3IocGF5bG9hZCkpO1xufVxuZXhwb3J0cy5pc0pzb25ScGNSZXNwb25zZSA9IGlzSnNvblJwY1Jlc3BvbnNlO1xuZnVuY3Rpb24gaXNKc29uUnBjUmVzdWx0KHBheWxvYWQpIHtcbiAgICByZXR1cm4gXCJyZXN1bHRcIiBpbiBwYXlsb2FkO1xufVxuZXhwb3J0cy5pc0pzb25ScGNSZXN1bHQgPSBpc0pzb25ScGNSZXN1bHQ7XG5mdW5jdGlvbiBpc0pzb25ScGNFcnJvcihwYXlsb2FkKSB7XG4gICAgcmV0dXJuIFwiZXJyb3JcIiBpbiBwYXlsb2FkO1xufVxuZXhwb3J0cy5pc0pzb25ScGNFcnJvciA9IGlzSnNvblJwY0Vycm9yO1xuZnVuY3Rpb24gaXNKc29uUnBjVmFsaWRhdGlvbkludmFsaWQodmFsaWRhdGlvbikge1xuICAgIHJldHVybiBcImVycm9yXCIgaW4gdmFsaWRhdGlvbiAmJiB2YWxpZGF0aW9uLnZhbGlkID09PSBmYWxzZTtcbn1cbmV4cG9ydHMuaXNKc29uUnBjVmFsaWRhdGlvbkludmFsaWQgPSBpc0pzb25ScGNWYWxpZGF0aW9uSW52YWxpZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZhbGlkYXRvcnMuanMubWFwIixudWxsLCJtb2R1bGUuZXhwb3J0cyA9IFwiODhmODE5Y2QwYWNkNmEwMlwiOyJdLCJuYW1lcyI6WyJnbG9iYWxUaGlzIiwiY2hyb21lIiwicnVudGltZSIsImlkIiwiRXJyb3IiLCJicm93c2VyIiwiT2JqZWN0IiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJDSFJPTUVfU0VORF9NRVNTQUdFX0NBTExCQUNLX05PX1JFU1BPTlNFX01FU1NBR0UiLCJ3cmFwQVBJcyIsImV4dGVuc2lvbkFQSXMiLCJhcGlNZXRhZGF0YSIsImtleXMiLCJsZW5ndGgiLCJEZWZhdWx0V2Vha01hcCIsIldlYWtNYXAiLCJjb25zdHJ1Y3RvciIsImNyZWF0ZUl0ZW0iLCJpdGVtcyIsInVuZGVmaW5lZCIsImdldCIsImtleSIsImhhcyIsInNldCIsImlzVGhlbmFibGUiLCJ2YWx1ZSIsInRoZW4iLCJtYWtlQ2FsbGJhY2siLCJwcm9taXNlIiwibWV0YWRhdGEiLCJjYWxsYmFja0FyZ3MiLCJsYXN0RXJyb3IiLCJyZWplY3QiLCJtZXNzYWdlIiwic2luZ2xlQ2FsbGJhY2tBcmciLCJyZXNvbHZlIiwicGx1cmFsaXplQXJndW1lbnRzIiwibnVtQXJncyIsIndyYXBBc3luY0Z1bmN0aW9uIiwibmFtZSIsImFzeW5jRnVuY3Rpb25XcmFwcGVyIiwidGFyZ2V0IiwiYXJncyIsIm1pbkFyZ3MiLCJtYXhBcmdzIiwiUHJvbWlzZSIsImZhbGxiYWNrVG9Ob0NhbGxiYWNrIiwiY2JFcnJvciIsImNvbnNvbGUiLCJ3YXJuIiwibm9DYWxsYmFjayIsIndyYXBNZXRob2QiLCJtZXRob2QiLCJ3cmFwcGVyIiwiUHJveHkiLCJhcHBseSIsInRhcmdldE1ldGhvZCIsInRoaXNPYmoiLCJjYWxsIiwiaGFzT3duUHJvcGVydHkiLCJGdW5jdGlvbiIsImJpbmQiLCJ3cmFwT2JqZWN0Iiwid3JhcHBlcnMiLCJjYWNoZSIsImNyZWF0ZSIsImhhbmRsZXJzIiwicHJveHlUYXJnZXQiLCJwcm9wIiwicmVjZWl2ZXIiLCJkZWZpbmVQcm9wZXJ0eSIsImNvbmZpZ3VyYWJsZSIsImVudW1lcmFibGUiLCJkZXNjIiwiUmVmbGVjdCIsImRlbGV0ZVByb3BlcnR5Iiwid3JhcEV2ZW50Iiwid3JhcHBlck1hcCIsImFkZExpc3RlbmVyIiwibGlzdGVuZXIiLCJoYXNMaXN0ZW5lciIsInJlbW92ZUxpc3RlbmVyIiwib25SZXF1ZXN0RmluaXNoZWRXcmFwcGVycyIsIm9uUmVxdWVzdEZpbmlzaGVkIiwicmVxIiwid3JhcHBlZFJlcSIsImdldENvbnRlbnQiLCJvbk1lc3NhZ2VXcmFwcGVycyIsIm9uTWVzc2FnZSIsInNlbmRlciIsInNlbmRSZXNwb25zZSIsImRpZENhbGxTZW5kUmVzcG9uc2UiLCJ3cmFwcGVkU2VuZFJlc3BvbnNlIiwic2VuZFJlc3BvbnNlUHJvbWlzZSIsInJlc3BvbnNlIiwicmVzdWx0IiwiZXJyIiwiaXNSZXN1bHRUaGVuYWJsZSIsInNlbmRQcm9taXNlZFJlc3VsdCIsIm1zZyIsImVycm9yIiwiX19tb3pXZWJFeHRlbnNpb25Qb2x5ZmlsbFJlamVjdF9fIiwiY2F0Y2giLCJ3cmFwcGVkU2VuZE1lc3NhZ2VDYWxsYmFjayIsInJlcGx5Iiwid3JhcHBlZFNlbmRNZXNzYWdlIiwiYXBpTmFtZXNwYWNlT2JqIiwid3JhcHBlZENiIiwicHVzaCIsInNlbmRNZXNzYWdlIiwic3RhdGljV3JhcHBlcnMiLCJkZXZ0b29scyIsIm5ldHdvcmsiLCJvbk1lc3NhZ2VFeHRlcm5hbCIsInRhYnMiLCJzZXR0aW5nTWV0YWRhdGEiLCJjbGVhciIsInByaXZhY3kiLCJzZXJ2aWNlcyIsIndlYnNpdGVzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC1zY3JpcHQuMjdiZDI5ZTguanMubWFwIn0=
