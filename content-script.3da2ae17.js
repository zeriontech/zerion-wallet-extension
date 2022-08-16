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

},{"nanoid":"E2pqo","@json-rpc-tools/utils":"h6aFv","bundle-text:./in-page":"9scsm","@parcel/transformer-js/src/esmodule-helpers.js":"boKlo","webextension-polyfill":"irfe7"}],"E2pqo":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "nanoid", ()=>nanoid);
parcelHelpers.export(exports, "customAlphabet", ()=>customAlphabet);
parcelHelpers.export(exports, "customRandom", ()=>customRandom);
parcelHelpers.export(exports, "urlAlphabet", ()=>(0, _indexJs.urlAlphabet));
parcelHelpers.export(exports, "random", ()=>random);
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

},{"./url-alphabet/index.js":"9Rrhr","@parcel/transformer-js/src/esmodule-helpers.js":"boKlo"}],"9Rrhr":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "urlAlphabet", ()=>urlAlphabet);
let urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

},{"@parcel/transformer-js/src/esmodule-helpers.js":"boKlo"}],"boKlo":[function(require,module,exports) {
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
module.exports = "// modules are defined as an array\n// [ module function, map of requires ]\n//\n// map of requires is short require name -> numeric require\n//\n// anything defined in a previous bundle is accessed via the\n// orig method which is the require for previous bundles\n\n(function (modules, entry, mainEntry, parcelRequireName, globalName) {\n  /* eslint-disable no-undef */\n  var globalObject =\n    typeof globalThis !== 'undefined'\n      ? globalThis\n      : typeof self !== 'undefined'\n      ? self\n      : typeof window !== 'undefined'\n      ? window\n      : typeof global !== 'undefined'\n      ? global\n      : {};\n  /* eslint-enable no-undef */\n\n  // Save the require from previous bundle to this closure if any\n  var previousRequire =\n    typeof globalObject[parcelRequireName] === 'function' &&\n    globalObject[parcelRequireName];\n\n  var cache = previousRequire.cache || {};\n  // Do not use `require` to prevent Webpack from trying to bundle this call\n  var nodeRequire =\n    typeof module !== 'undefined' &&\n    typeof module.require === 'function' &&\n    module.require.bind(module);\n\n  function newRequire(name, jumped) {\n    if (!cache[name]) {\n      if (!modules[name]) {\n        // if we cannot find the module within our internal map or\n        // cache jump to the current global require ie. the last bundle\n        // that was added to the page.\n        var currentRequire =\n          typeof globalObject[parcelRequireName] === 'function' &&\n          globalObject[parcelRequireName];\n        if (!jumped && currentRequire) {\n          return currentRequire(name, true);\n        }\n\n        // If there are other bundles on this page the require from the\n        // previous one is saved to 'previousRequire'. Repeat this as\n        // many times as there are bundles until the module is found or\n        // we exhaust the require chain.\n        if (previousRequire) {\n          return previousRequire(name, true);\n        }\n\n        // Try the node require function if it exists.\n        if (nodeRequire && typeof name === 'string') {\n          return nodeRequire(name);\n        }\n\n        var err = new Error(\"Cannot find module '\" + name + \"'\");\n        err.code = 'MODULE_NOT_FOUND';\n        throw err;\n      }\n\n      localRequire.resolve = resolve;\n      localRequire.cache = {};\n\n      var module = (cache[name] = new newRequire.Module(name));\n\n      modules[name][0].call(\n        module.exports,\n        localRequire,\n        module,\n        module.exports,\n        this\n      );\n    }\n\n    return cache[name].exports;\n\n    function localRequire(x) {\n      var res = localRequire.resolve(x);\n      return res === false ? {} : newRequire(res);\n    }\n\n    function resolve(x) {\n      var id = modules[name][1][x];\n      return id != null ? id : x;\n    }\n  }\n\n  function Module(moduleName) {\n    this.id = moduleName;\n    this.bundle = newRequire;\n    this.exports = {};\n  }\n\n  newRequire.isParcelRequire = true;\n  newRequire.Module = Module;\n  newRequire.modules = modules;\n  newRequire.cache = cache;\n  newRequire.parent = previousRequire;\n  newRequire.register = function (id, exports) {\n    modules[id] = [\n      function (require, module) {\n        module.exports = exports;\n      },\n      {},\n    ];\n  };\n\n  Object.defineProperty(newRequire, 'root', {\n    get: function () {\n      return globalObject[parcelRequireName];\n    },\n  });\n\n  globalObject[parcelRequireName] = newRequire;\n\n  for (var i = 0; i < entry.length; i++) {\n    newRequire(entry[i]);\n  }\n\n  if (mainEntry) {\n    // Expose entry point to Node, AMD or browser globals\n    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js\n    var mainExports = newRequire(mainEntry);\n\n    // CommonJS\n    if (typeof exports === 'object' && typeof module !== 'undefined') {\n      module.exports = mainExports;\n\n      // RequireJS\n    } else if (typeof define === 'function' && define.amd) {\n      define(function () {\n        return mainExports;\n      });\n\n      // <script>\n    } else if (globalName) {\n      this[globalName] = mainExports;\n    }\n  }\n})({\"qFYh4\":[function(require,module,exports) {\nvar _provider = require(\"src/modules/ethereum/provider\");\nvar _connection = require(\"src/modules/ethereum/connection\");\nconst broadcastChannel = new BroadcastChannel(window.myWalletChannelId);\nconst connection = new (0, _connection.Connection)(broadcastChannel);\nconst provider = new (0, _provider.EthereumProvider)(connection);\nprovider.connect();\nwindow.ethereum = provider;\nwindow.zerionWallet = provider;\n\n},{\"src/modules/ethereum/provider\":\"jS2ol\",\"src/modules/ethereum/connection\":\"deOoS\"}],\"jS2ol\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"EthereumProvider\", ()=>EthereumProvider);\nvar _provider = require(\"@json-rpc-tools/provider\");\nvar _utils = require(\"@json-rpc-tools/utils\");\nfunction accountsEquals(arr1, arr2) {\n    // it's okay to perform search like this because `accounts`\n    // always has at most one element\n    return arr1.length === arr2.length && arr1.every((item)=>arr2.includes(item));\n}\nasync function fetchInitialState(connection) {\n    return Promise.all([\n        connection.send((0, _utils.formatJsonRpcRequest)(\"getChainId\", [])),\n        connection.send((0, _utils.formatJsonRpcRequest)(\"eth_accounts\", [])), \n    ]).then(([chainId, accounts])=>({\n            chainId,\n            accounts\n        }));\n}\nfunction updateChainId(self, chainId) {\n    self.chainId = chainId;\n    self.networkVersion = String(parseInt(chainId, 16));\n}\nclass EthereumProvider extends (0, _provider.JsonRpcProvider) {\n    isZerionWallet = true;\n    _openPromise = null;\n    constructor(connection){\n        super(connection);\n        this.connection = connection;\n        this.shimLegacy();\n        this.chainId = \"0x1\";\n        this.networkVersion = \"1\";\n        this.accounts = [];\n        connection.on(\"ethereumEvent\", ({ event , value  })=>{\n            if (event === \"chainChanged\" && typeof value === \"string\") {\n                if (value === this.chainId) return;\n                updateChainId(this, value);\n            }\n            if (event === \"accountsChanged\" && Array.isArray(value)) {\n                // it's okay to perform search like this because `this.accounts`\n                // always has at most one element\n                if (accountsEquals(value, this.accounts)) // Do not emit accountChanged because value hasn't changed\n                return;\n                else this.accounts = value;\n            }\n            this.events.emit(event, value);\n        });\n        this.open();\n    }\n    on(event, listener) {\n        super.on(event, listener);\n        return this;\n    }\n    async _prepareState() {\n        return fetchInitialState(this.connection).then(({ chainId , accounts  })=>{\n            updateChainId(this, chainId);\n            this.accounts = accounts;\n        });\n    }\n    async request(request, context) {\n        if (request.method === \"eth_chainId\") return Promise.resolve(this.chainId);\n        if (request.method === \"eth_accounts\") return Promise.resolve(this.accounts);\n        return this._getRequestPromise((0, _utils.formatJsonRpcRequest)(request.method, request.params || []), context);\n    }\n    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    async _getRequestPromise(request, _context // eslint-disable-line @typescript-eslint/no-explicit-any\n    ) {\n        if (!this.connection.connected) await this.open();\n        return new Promise((resolve, reject)=>{\n            this.events.once(`${request.id}`, (response)=>{\n                if ((0, _utils.isJsonRpcError)(response)) reject(response.error);\n                else resolve(response.result);\n            });\n            this.connection.send(request);\n        });\n    }\n    // Taken from Rabby\n    // shim to matamask legacy api\n    sendAsync = (payload, callback)=>{\n        if (Array.isArray(payload)) return Promise.all(payload.map((item)=>new Promise((resolve)=>{\n                this.sendAsync(item, (_err, res)=>{\n                    // ignore error\n                    resolve(res);\n                });\n            }))).then((result)=>callback(null, result));\n        const { method , params , ...rest } = payload;\n        this.request({\n            method,\n            params\n        }).then((result)=>callback(null, {\n                ...rest,\n                method,\n                result\n            })).catch((error)=>callback(error, {\n                ...rest,\n                method,\n                error\n            }));\n    };\n    shimLegacy() {\n        const legacyMethods = [\n            [\n                \"enable\",\n                \"eth_requestAccounts\"\n            ],\n            [\n                \"net_version\",\n                \"net_version\"\n            ], \n        ];\n        for (const [_method, method] of legacyMethods)// @ts-ignore\n        this[_method] = ()=>this.request({\n                method\n            });\n    }\n    isConnected() {\n        return this.connection.connected;\n    }\n    async _internalOpen(connection) {\n        if (this.connection === connection && this.connection.connected) return;\n        if (this.connection.connected) this.close();\n        this.connection = connection; // this.setConnection();\n        await Promise.all([\n            this.connection.open(),\n            this._prepareState()\n        ]);\n        this.connection.on(\"payload\", (payload)=>this.onPayload(payload));\n        this.connection.on(\"close\", ()=>{\n            this.events.emit(\"disconnect\");\n        });\n        this.events.emit(\"connect\", {\n            chainId: this.chainId\n        });\n    }\n    open(connection = this.connection) {\n        if (!this._openPromise) this._openPromise = this._internalOpen(connection);\n        return this._openPromise;\n    }\n}\n\n},{\"@json-rpc-tools/provider\":\"edpZ9\",\"@json-rpc-tools/utils\":\"h6aFv\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}],\"edpZ9\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\nconst provider_1 = tslib_1.__importDefault(require(\"./provider\"));\ntslib_1.__exportStar(require(\"./http\"), exports);\ntslib_1.__exportStar(require(\"./ws\"), exports);\ntslib_1.__exportStar(require(\"./provider\"), exports);\nexports.default = provider_1.default;\n\n},{\"tslib\":\"hdsRu\",\"./provider\":\"gHzlU\",\"./http\":\"7LjTp\",\"./ws\":\"aknY6\"}],\"hdsRu\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"__extends\", ()=>__extends);\nparcelHelpers.export(exports, \"__assign\", ()=>__assign);\nparcelHelpers.export(exports, \"__rest\", ()=>__rest);\nparcelHelpers.export(exports, \"__decorate\", ()=>__decorate);\nparcelHelpers.export(exports, \"__param\", ()=>__param);\nparcelHelpers.export(exports, \"__metadata\", ()=>__metadata);\nparcelHelpers.export(exports, \"__awaiter\", ()=>__awaiter);\nparcelHelpers.export(exports, \"__generator\", ()=>__generator);\nparcelHelpers.export(exports, \"__createBinding\", ()=>__createBinding);\nparcelHelpers.export(exports, \"__exportStar\", ()=>__exportStar);\nparcelHelpers.export(exports, \"__values\", ()=>__values);\nparcelHelpers.export(exports, \"__read\", ()=>__read);\n/** @deprecated */ parcelHelpers.export(exports, \"__spread\", ()=>__spread);\n/** @deprecated */ parcelHelpers.export(exports, \"__spreadArrays\", ()=>__spreadArrays);\nparcelHelpers.export(exports, \"__spreadArray\", ()=>__spreadArray);\nparcelHelpers.export(exports, \"__await\", ()=>__await);\nparcelHelpers.export(exports, \"__asyncGenerator\", ()=>__asyncGenerator);\nparcelHelpers.export(exports, \"__asyncDelegator\", ()=>__asyncDelegator);\nparcelHelpers.export(exports, \"__asyncValues\", ()=>__asyncValues);\nparcelHelpers.export(exports, \"__makeTemplateObject\", ()=>__makeTemplateObject);\nparcelHelpers.export(exports, \"__importStar\", ()=>__importStar);\nparcelHelpers.export(exports, \"__importDefault\", ()=>__importDefault);\nparcelHelpers.export(exports, \"__classPrivateFieldGet\", ()=>__classPrivateFieldGet);\nparcelHelpers.export(exports, \"__classPrivateFieldSet\", ()=>__classPrivateFieldSet);\nparcelHelpers.export(exports, \"__classPrivateFieldIn\", ()=>__classPrivateFieldIn);\n/******************************************************************************\r\nCopyright (c) Microsoft Corporation.\r\n\r\nPermission to use, copy, modify, and/or distribute this software for any\r\npurpose with or without fee is hereby granted.\r\n\r\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\r\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\r\nAND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\r\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM\r\nLOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR\r\nOTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR\r\nPERFORMANCE OF THIS SOFTWARE.\r\n***************************************************************************** */ /* global Reflect, Promise */ var extendStatics = function(d1, b1) {\n    extendStatics = Object.setPrototypeOf || ({\n        __proto__: []\n    }) instanceof Array && function(d, b) {\n        d.__proto__ = b;\n    } || function(d, b) {\n        for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];\n    };\n    return extendStatics(d1, b1);\n};\nfunction __extends(d, b) {\n    if (typeof b !== \"function\" && b !== null) throw new TypeError(\"Class extends value \" + String(b) + \" is not a constructor or null\");\n    extendStatics(d, b);\n    function __() {\n        this.constructor = d;\n    }\n    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());\n}\nvar __assign = function() {\n    __assign = Object.assign || function __assign(t) {\n        for(var s, i = 1, n = arguments.length; i < n; i++){\n            s = arguments[i];\n            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];\n        }\n        return t;\n    };\n    return __assign.apply(this, arguments);\n};\nfunction __rest(s, e) {\n    var t = {};\n    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];\n    if (s != null && typeof Object.getOwnPropertySymbols === \"function\") {\n        for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];\n    }\n    return t;\n}\nfunction __decorate(decorators, target, key, desc) {\n    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;\n    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);\n    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;\n    return c > 3 && r && Object.defineProperty(target, key, r), r;\n}\nfunction __param(paramIndex, decorator) {\n    return function(target, key) {\n        decorator(target, key, paramIndex);\n    };\n}\nfunction __metadata(metadataKey, metadataValue) {\n    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(metadataKey, metadataValue);\n}\nfunction __awaiter(thisArg, _arguments, P, generator) {\n    function adopt(value) {\n        return value instanceof P ? value : new P(function(resolve) {\n            resolve(value);\n        });\n    }\n    return new (P || (P = Promise))(function(resolve, reject) {\n        function fulfilled(value) {\n            try {\n                step(generator.next(value));\n            } catch (e) {\n                reject(e);\n            }\n        }\n        function rejected(value) {\n            try {\n                step(generator[\"throw\"](value));\n            } catch (e) {\n                reject(e);\n            }\n        }\n        function step(result) {\n            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);\n        }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n}\nfunction __generator(thisArg, body) {\n    var _ = {\n        label: 0,\n        sent: function() {\n            if (t[0] & 1) throw t[1];\n            return t[1];\n        },\n        trys: [],\n        ops: []\n    }, f, y, t, g;\n    return g = {\n        next: verb(0),\n        \"throw\": verb(1),\n        \"return\": verb(2)\n    }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() {\n        return this;\n    }), g;\n    function verb(n) {\n        return function(v) {\n            return step([\n                n,\n                v\n            ]);\n        };\n    }\n    function step(op) {\n        if (f) throw new TypeError(\"Generator is already executing.\");\n        while(_)try {\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\n            if (y = 0, t) op = [\n                op[0] & 2,\n                t.value\n            ];\n            switch(op[0]){\n                case 0:\n                case 1:\n                    t = op;\n                    break;\n                case 4:\n                    _.label++;\n                    return {\n                        value: op[1],\n                        done: false\n                    };\n                case 5:\n                    _.label++;\n                    y = op[1];\n                    op = [\n                        0\n                    ];\n                    continue;\n                case 7:\n                    op = _.ops.pop();\n                    _.trys.pop();\n                    continue;\n                default:\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {\n                        _ = 0;\n                        continue;\n                    }\n                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {\n                        _.label = op[1];\n                        break;\n                    }\n                    if (op[0] === 6 && _.label < t[1]) {\n                        _.label = t[1];\n                        t = op;\n                        break;\n                    }\n                    if (t && _.label < t[2]) {\n                        _.label = t[2];\n                        _.ops.push(op);\n                        break;\n                    }\n                    if (t[2]) _.ops.pop();\n                    _.trys.pop();\n                    continue;\n            }\n            op = body.call(thisArg, _);\n        } catch (e) {\n            op = [\n                6,\n                e\n            ];\n            y = 0;\n        } finally{\n            f = t = 0;\n        }\n        if (op[0] & 5) throw op[1];\n        return {\n            value: op[0] ? op[1] : void 0,\n            done: true\n        };\n    }\n}\nvar __createBinding = Object.create ? function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {\n        enumerable: true,\n        get: function() {\n            return m[k];\n        }\n    };\n    Object.defineProperty(o, k2, desc);\n} : function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n};\nfunction __exportStar(m, o) {\n    for(var p in m)if (p !== \"default\" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);\n}\nfunction __values(o) {\n    var s = typeof Symbol === \"function\" && Symbol.iterator, m = s && o[s], i = 0;\n    if (m) return m.call(o);\n    if (o && typeof o.length === \"number\") return {\n        next: function() {\n            if (o && i >= o.length) o = void 0;\n            return {\n                value: o && o[i++],\n                done: !o\n            };\n        }\n    };\n    throw new TypeError(s ? \"Object is not iterable.\" : \"Symbol.iterator is not defined.\");\n}\nfunction __read(o, n) {\n    var m = typeof Symbol === \"function\" && o[Symbol.iterator];\n    if (!m) return o;\n    var i = m.call(o), r, ar = [], e;\n    try {\n        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);\n    } catch (error) {\n        e = {\n            error: error\n        };\n    } finally{\n        try {\n            if (r && !r.done && (m = i[\"return\"])) m.call(i);\n        } finally{\n            if (e) throw e.error;\n        }\n    }\n    return ar;\n}\nfunction __spread() {\n    for(var ar = [], i = 0; i < arguments.length; i++)ar = ar.concat(__read(arguments[i]));\n    return ar;\n}\nfunction __spreadArrays() {\n    for(var s = 0, i = 0, il = arguments.length; i < il; i++)s += arguments[i].length;\n    for(var r = Array(s), k = 0, i = 0; i < il; i++)for(var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)r[k] = a[j];\n    return r;\n}\nfunction __spreadArray(to, from, pack) {\n    if (pack || arguments.length === 2) {\n        for(var i = 0, l = from.length, ar; i < l; i++)if (ar || !(i in from)) {\n            if (!ar) ar = Array.prototype.slice.call(from, 0, i);\n            ar[i] = from[i];\n        }\n    }\n    return to.concat(ar || Array.prototype.slice.call(from));\n}\nfunction __await(v) {\n    return this instanceof __await ? (this.v = v, this) : new __await(v);\n}\nfunction __asyncGenerator(thisArg, _arguments, generator) {\n    if (!Symbol.asyncIterator) throw new TypeError(\"Symbol.asyncIterator is not defined.\");\n    var g = generator.apply(thisArg, _arguments || []), i, q = [];\n    return i = {}, verb(\"next\"), verb(\"throw\"), verb(\"return\"), i[Symbol.asyncIterator] = function() {\n        return this;\n    }, i;\n    function verb(n) {\n        if (g[n]) i[n] = function(v) {\n            return new Promise(function(a, b) {\n                q.push([\n                    n,\n                    v,\n                    a,\n                    b\n                ]) > 1 || resume(n, v);\n            });\n        };\n    }\n    function resume(n, v) {\n        try {\n            step(g[n](v));\n        } catch (e) {\n            settle(q[0][3], e);\n        }\n    }\n    function step(r) {\n        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);\n    }\n    function fulfill(value) {\n        resume(\"next\", value);\n    }\n    function reject(value) {\n        resume(\"throw\", value);\n    }\n    function settle(f, v) {\n        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);\n    }\n}\nfunction __asyncDelegator(o) {\n    var i, p;\n    return i = {}, verb(\"next\"), verb(\"throw\", function(e) {\n        throw e;\n    }), verb(\"return\"), i[Symbol.iterator] = function() {\n        return this;\n    }, i;\n    function verb(n, f) {\n        i[n] = o[n] ? function(v) {\n            return (p = !p) ? {\n                value: __await(o[n](v)),\n                done: n === \"return\"\n            } : f ? f(v) : v;\n        } : f;\n    }\n}\nfunction __asyncValues(o) {\n    if (!Symbol.asyncIterator) throw new TypeError(\"Symbol.asyncIterator is not defined.\");\n    var m = o[Symbol.asyncIterator], i;\n    return m ? m.call(o) : (o = typeof __values === \"function\" ? __values(o) : o[Symbol.iterator](), i = {}, verb(\"next\"), verb(\"throw\"), verb(\"return\"), i[Symbol.asyncIterator] = function() {\n        return this;\n    }, i);\n    function verb(n) {\n        i[n] = o[n] && function(v) {\n            return new Promise(function(resolve, reject) {\n                v = o[n](v), settle(resolve, reject, v.done, v.value);\n            });\n        };\n    }\n    function settle(resolve, reject, d, v1) {\n        Promise.resolve(v1).then(function(v) {\n            resolve({\n                value: v,\n                done: d\n            });\n        }, reject);\n    }\n}\nfunction __makeTemplateObject(cooked, raw) {\n    if (Object.defineProperty) Object.defineProperty(cooked, \"raw\", {\n        value: raw\n    });\n    else cooked.raw = raw;\n    return cooked;\n}\nvar __setModuleDefault = Object.create ? function(o, v) {\n    Object.defineProperty(o, \"default\", {\n        enumerable: true,\n        value: v\n    });\n} : function(o, v) {\n    o[\"default\"] = v;\n};\nfunction __importStar(mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) {\n        for(var k in mod)if (k !== \"default\" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);\n    }\n    __setModuleDefault(result, mod);\n    return result;\n}\nfunction __importDefault(mod) {\n    return mod && mod.__esModule ? mod : {\n        default: mod\n    };\n}\nfunction __classPrivateFieldGet(receiver, state, kind, f) {\n    if (kind === \"a\" && !f) throw new TypeError(\"Private accessor was defined without a getter\");\n    if (typeof state === \"function\" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError(\"Cannot read private member from an object whose class did not declare it\");\n    return kind === \"m\" ? f : kind === \"a\" ? f.call(receiver) : f ? f.value : state.get(receiver);\n}\nfunction __classPrivateFieldSet(receiver, state, value, kind, f) {\n    if (kind === \"m\") throw new TypeError(\"Private method is not writable\");\n    if (kind === \"a\" && !f) throw new TypeError(\"Private accessor was defined without a setter\");\n    if (typeof state === \"function\" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError(\"Cannot write private member to an object whose class did not declare it\");\n    return kind === \"a\" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;\n}\nfunction __classPrivateFieldIn(state, receiver) {\n    if (receiver === null || typeof receiver !== \"object\" && typeof receiver !== \"function\") throw new TypeError(\"Cannot use 'in' operator on non-object\");\n    return typeof state === \"function\" ? receiver === state : state.has(receiver);\n}\n\n},{\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}],\"boKlo\":[function(require,module,exports) {\nexports.interopDefault = function(a) {\n    return a && a.__esModule ? a : {\n        default: a\n    };\n};\nexports.defineInteropFlag = function(a) {\n    Object.defineProperty(a, \"__esModule\", {\n        value: true\n    });\n};\nexports.exportAll = function(source, dest) {\n    Object.keys(source).forEach(function(key) {\n        if (key === \"default\" || key === \"__esModule\" || dest.hasOwnProperty(key)) return;\n        Object.defineProperty(dest, key, {\n            enumerable: true,\n            get: function() {\n                return source[key];\n            }\n        });\n    });\n    return dest;\n};\nexports.export = function(dest, destName, get) {\n    Object.defineProperty(dest, destName, {\n        enumerable: true,\n        get: get\n    });\n};\n\n},{}],\"gHzlU\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.JsonRpcProvider = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst http_1 = require(\"./http\");\nconst ws_1 = require(\"./ws\");\nconst url_1 = require(\"./url\");\nclass JsonRpcProvider extends utils_1.IJsonRpcProvider {\n    constructor(connection){\n        super(connection);\n        this.events = new events_1.EventEmitter();\n        this.connection = this.setConnection(connection);\n    }\n    connect(connection = this.connection) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.open(connection);\n        });\n    }\n    disconnect() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.close();\n        });\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    request(request, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            return this.requestStrict(utils_1.formatJsonRpcRequest(request.method, request.params || []), context);\n        });\n    }\n    requestStrict(request, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            return new Promise((resolve, reject)=>tslib_1.__awaiter(this, void 0, void 0, function*() {\n                    if (!this.connection.connected) try {\n                        yield this.open();\n                    } catch (e) {\n                        reject(e.message);\n                    }\n                    this.events.on(`${request.id}`, (response)=>{\n                        if (utils_1.isJsonRpcError(response)) reject(response.error.message);\n                        else resolve(response.result);\n                    });\n                    yield this.connection.send(request);\n                }));\n        });\n    }\n    setConnection(connection = this.connection) {\n        return typeof connection === \"string\" ? url_1.isHttpUrl(connection) ? new http_1.HttpConnection(connection) : new ws_1.WsConnection(connection) : connection;\n    }\n    onPayload(payload) {\n        this.events.emit(\"payload\", payload);\n        if (utils_1.isJsonRpcResponse(payload)) this.events.emit(`${payload.id}`, payload);\n        else this.events.emit(\"message\", {\n            type: payload.method,\n            data: payload.params\n        });\n    }\n    open(connection = this.connection) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (this.connection === connection && this.connection.connected) return;\n            if (this.connection.connected) this.close();\n            this.connection = this.setConnection();\n            yield this.connection.open();\n            this.connection.on(\"payload\", (payload)=>this.onPayload(payload));\n            this.connection.on(\"close\", ()=>this.events.emit(\"disconnect\"));\n            this.connection.on(\"error\", ()=>this.events.emit(\"error\"));\n            this.events.emit(\"connect\");\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            yield this.connection.close();\n            this.events.emit(\"disconnect\");\n        });\n    }\n}\nexports.JsonRpcProvider = JsonRpcProvider;\nexports.default = JsonRpcProvider;\n\n},{\"tslib\":\"hdsRu\",\"events\":\"eDevp\",\"@json-rpc-tools/utils\":\"h6aFv\",\"./http\":\"7LjTp\",\"./ws\":\"aknY6\",\"./url\":\"9Then\"}],\"eDevp\":[function(require,module,exports) {\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\"use strict\";\nvar R = typeof Reflect === \"object\" ? Reflect : null;\nvar ReflectApply = R && typeof R.apply === \"function\" ? R.apply : function ReflectApply(target, receiver, args) {\n    return Function.prototype.apply.call(target, receiver, args);\n};\nvar ReflectOwnKeys;\nif (R && typeof R.ownKeys === \"function\") ReflectOwnKeys = R.ownKeys;\nelse if (Object.getOwnPropertySymbols) ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));\n};\nelse ReflectOwnKeys = function ReflectOwnKeys(target) {\n    return Object.getOwnPropertyNames(target);\n};\nfunction ProcessEmitWarning(warning) {\n    if (console && console.warn) console.warn(warning);\n}\nvar NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {\n    return value !== value;\n};\nfunction EventEmitter() {\n    EventEmitter.init.call(this);\n}\nmodule.exports = EventEmitter;\nmodule.exports.once = once;\n// Backwards-compat with node 0.10.x\nEventEmitter.EventEmitter = EventEmitter;\nEventEmitter.prototype._events = undefined;\nEventEmitter.prototype._eventsCount = 0;\nEventEmitter.prototype._maxListeners = undefined;\n// By default EventEmitters will print a warning if more than 10 listeners are\n// added to it. This is a useful default which helps finding memory leaks.\nvar defaultMaxListeners = 10;\nfunction checkListener(listener) {\n    if (typeof listener !== \"function\") throw new TypeError('The \"listener\" argument must be of type Function. Received type ' + typeof listener);\n}\nObject.defineProperty(EventEmitter, \"defaultMaxListeners\", {\n    enumerable: true,\n    get: function() {\n        return defaultMaxListeners;\n    },\n    set: function(arg) {\n        if (typeof arg !== \"number\" || arg < 0 || NumberIsNaN(arg)) throw new RangeError('The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received ' + arg + \".\");\n        defaultMaxListeners = arg;\n    }\n});\nEventEmitter.init = function() {\n    if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {\n        this._events = Object.create(null);\n        this._eventsCount = 0;\n    }\n    this._maxListeners = this._maxListeners || undefined;\n};\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nEventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {\n    if (typeof n !== \"number\" || n < 0 || NumberIsNaN(n)) throw new RangeError('The value of \"n\" is out of range. It must be a non-negative number. Received ' + n + \".\");\n    this._maxListeners = n;\n    return this;\n};\nfunction _getMaxListeners(that) {\n    if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;\n    return that._maxListeners;\n}\nEventEmitter.prototype.getMaxListeners = function getMaxListeners() {\n    return _getMaxListeners(this);\n};\nEventEmitter.prototype.emit = function emit(type) {\n    var args = [];\n    for(var i = 1; i < arguments.length; i++)args.push(arguments[i]);\n    var doError = type === \"error\";\n    var events = this._events;\n    if (events !== undefined) doError = doError && events.error === undefined;\n    else if (!doError) return false;\n    // If there is no 'error' event listener then throw.\n    if (doError) {\n        var er;\n        if (args.length > 0) er = args[0];\n        if (er instanceof Error) // Note: The comments on the `throw` lines are intentional, they show\n        // up in Node's output if this results in an unhandled exception.\n        throw er; // Unhandled 'error' event\n        // At least give some kind of context to the user\n        var err = new Error(\"Unhandled error.\" + (er ? \" (\" + er.message + \")\" : \"\"));\n        err.context = er;\n        throw err; // Unhandled 'error' event\n    }\n    var handler = events[type];\n    if (handler === undefined) return false;\n    if (typeof handler === \"function\") ReflectApply(handler, this, args);\n    else {\n        var len = handler.length;\n        var listeners = arrayClone(handler, len);\n        for(var i = 0; i < len; ++i)ReflectApply(listeners[i], this, args);\n    }\n    return true;\n};\nfunction _addListener(target, type, listener, prepend) {\n    var m;\n    var events;\n    var existing;\n    checkListener(listener);\n    events = target._events;\n    if (events === undefined) {\n        events = target._events = Object.create(null);\n        target._eventsCount = 0;\n    } else {\n        // To avoid recursion in the case that type === \"newListener\"! Before\n        // adding it to the listeners, first emit \"newListener\".\n        if (events.newListener !== undefined) {\n            target.emit(\"newListener\", type, listener.listener ? listener.listener : listener);\n            // Re-assign `events` because a newListener handler could have caused the\n            // this._events to be assigned to a new object\n            events = target._events;\n        }\n        existing = events[type];\n    }\n    if (existing === undefined) {\n        // Optimize the case of one listener. Don't need the extra array object.\n        existing = events[type] = listener;\n        ++target._eventsCount;\n    } else {\n        if (typeof existing === \"function\") // Adding the second element, need to change to array.\n        existing = events[type] = prepend ? [\n            listener,\n            existing\n        ] : [\n            existing,\n            listener\n        ];\n        else if (prepend) existing.unshift(listener);\n        else existing.push(listener);\n        // Check for listener leak\n        m = _getMaxListeners(target);\n        if (m > 0 && existing.length > m && !existing.warned) {\n            existing.warned = true;\n            // No error code for this since it is a Warning\n            // eslint-disable-next-line no-restricted-syntax\n            var w = new Error(\"Possible EventEmitter memory leak detected. \" + existing.length + \" \" + String(type) + \" listeners \" + \"added. Use emitter.setMaxListeners() to \" + \"increase limit\");\n            w.name = \"MaxListenersExceededWarning\";\n            w.emitter = target;\n            w.type = type;\n            w.count = existing.length;\n            ProcessEmitWarning(w);\n        }\n    }\n    return target;\n}\nEventEmitter.prototype.addListener = function addListener(type, listener) {\n    return _addListener(this, type, listener, false);\n};\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\nEventEmitter.prototype.prependListener = function prependListener(type, listener) {\n    return _addListener(this, type, listener, true);\n};\nfunction onceWrapper() {\n    if (!this.fired) {\n        this.target.removeListener(this.type, this.wrapFn);\n        this.fired = true;\n        if (arguments.length === 0) return this.listener.call(this.target);\n        return this.listener.apply(this.target, arguments);\n    }\n}\nfunction _onceWrap(target, type, listener) {\n    var state = {\n        fired: false,\n        wrapFn: undefined,\n        target: target,\n        type: type,\n        listener: listener\n    };\n    var wrapped = onceWrapper.bind(state);\n    wrapped.listener = listener;\n    state.wrapFn = wrapped;\n    return wrapped;\n}\nEventEmitter.prototype.once = function once(type, listener) {\n    checkListener(listener);\n    this.on(type, _onceWrap(this, type, listener));\n    return this;\n};\nEventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {\n    checkListener(listener);\n    this.prependListener(type, _onceWrap(this, type, listener));\n    return this;\n};\n// Emits a 'removeListener' event if and only if the listener was removed.\nEventEmitter.prototype.removeListener = function removeListener(type, listener) {\n    var list, events, position, i, originalListener;\n    checkListener(listener);\n    events = this._events;\n    if (events === undefined) return this;\n    list = events[type];\n    if (list === undefined) return this;\n    if (list === listener || list.listener === listener) {\n        if (--this._eventsCount === 0) this._events = Object.create(null);\n        else {\n            delete events[type];\n            if (events.removeListener) this.emit(\"removeListener\", type, list.listener || listener);\n        }\n    } else if (typeof list !== \"function\") {\n        position = -1;\n        for(i = list.length - 1; i >= 0; i--)if (list[i] === listener || list[i].listener === listener) {\n            originalListener = list[i].listener;\n            position = i;\n            break;\n        }\n        if (position < 0) return this;\n        if (position === 0) list.shift();\n        else spliceOne(list, position);\n        if (list.length === 1) events[type] = list[0];\n        if (events.removeListener !== undefined) this.emit(\"removeListener\", type, originalListener || listener);\n    }\n    return this;\n};\nEventEmitter.prototype.off = EventEmitter.prototype.removeListener;\nEventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {\n    var listeners, events, i;\n    events = this._events;\n    if (events === undefined) return this;\n    // not listening for removeListener, no need to emit\n    if (events.removeListener === undefined) {\n        if (arguments.length === 0) {\n            this._events = Object.create(null);\n            this._eventsCount = 0;\n        } else if (events[type] !== undefined) {\n            if (--this._eventsCount === 0) this._events = Object.create(null);\n            else delete events[type];\n        }\n        return this;\n    }\n    // emit removeListener for all listeners on all events\n    if (arguments.length === 0) {\n        var keys = Object.keys(events);\n        var key;\n        for(i = 0; i < keys.length; ++i){\n            key = keys[i];\n            if (key === \"removeListener\") continue;\n            this.removeAllListeners(key);\n        }\n        this.removeAllListeners(\"removeListener\");\n        this._events = Object.create(null);\n        this._eventsCount = 0;\n        return this;\n    }\n    listeners = events[type];\n    if (typeof listeners === \"function\") this.removeListener(type, listeners);\n    else if (listeners !== undefined) // LIFO order\n    for(i = listeners.length - 1; i >= 0; i--)this.removeListener(type, listeners[i]);\n    return this;\n};\nfunction _listeners(target, type, unwrap) {\n    var events = target._events;\n    if (events === undefined) return [];\n    var evlistener = events[type];\n    if (evlistener === undefined) return [];\n    if (typeof evlistener === \"function\") return unwrap ? [\n        evlistener.listener || evlistener\n    ] : [\n        evlistener\n    ];\n    return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);\n}\nEventEmitter.prototype.listeners = function listeners(type) {\n    return _listeners(this, type, true);\n};\nEventEmitter.prototype.rawListeners = function rawListeners(type) {\n    return _listeners(this, type, false);\n};\nEventEmitter.listenerCount = function(emitter, type) {\n    if (typeof emitter.listenerCount === \"function\") return emitter.listenerCount(type);\n    else return listenerCount.call(emitter, type);\n};\nEventEmitter.prototype.listenerCount = listenerCount;\nfunction listenerCount(type) {\n    var events = this._events;\n    if (events !== undefined) {\n        var evlistener = events[type];\n        if (typeof evlistener === \"function\") return 1;\n        else if (evlistener !== undefined) return evlistener.length;\n    }\n    return 0;\n}\nEventEmitter.prototype.eventNames = function eventNames() {\n    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];\n};\nfunction arrayClone(arr, n) {\n    var copy = new Array(n);\n    for(var i = 0; i < n; ++i)copy[i] = arr[i];\n    return copy;\n}\nfunction spliceOne(list, index) {\n    for(; index + 1 < list.length; index++)list[index] = list[index + 1];\n    list.pop();\n}\nfunction unwrapListeners(arr) {\n    var ret = new Array(arr.length);\n    for(var i = 0; i < ret.length; ++i)ret[i] = arr[i].listener || arr[i];\n    return ret;\n}\nfunction once(emitter, name) {\n    return new Promise(function(resolve, reject) {\n        function errorListener(err) {\n            emitter.removeListener(name, resolver);\n            reject(err);\n        }\n        function resolver() {\n            if (typeof emitter.removeListener === \"function\") emitter.removeListener(\"error\", errorListener);\n            resolve([].slice.call(arguments));\n        }\n        eventTargetAgnosticAddListener(emitter, name, resolver, {\n            once: true\n        });\n        if (name !== \"error\") addErrorHandlerIfEventEmitter(emitter, errorListener, {\n            once: true\n        });\n    });\n}\nfunction addErrorHandlerIfEventEmitter(emitter, handler, flags) {\n    if (typeof emitter.on === \"function\") eventTargetAgnosticAddListener(emitter, \"error\", handler, flags);\n}\nfunction eventTargetAgnosticAddListener(emitter, name, listener, flags) {\n    if (typeof emitter.on === \"function\") {\n        if (flags.once) emitter.once(name, listener);\n        else emitter.on(name, listener);\n    } else if (typeof emitter.addEventListener === \"function\") // EventTarget does not have `error` event semantics like Node\n    // EventEmitters, we do not listen for `error` events here.\n    emitter.addEventListener(name, function wrapListener(arg) {\n        // IE does not have builtin `{ once: true }` support so we\n        // have to do it manually.\n        if (flags.once) emitter.removeEventListener(name, wrapListener);\n        listener(arg);\n    });\n    else throw new TypeError('The \"emitter\" argument must be of type EventEmitter. Received type ' + typeof emitter);\n}\n\n},{}],\"h6aFv\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"./constants\"), exports);\ntslib_1.__exportStar(require(\"./error\"), exports);\ntslib_1.__exportStar(require(\"./env\"), exports);\ntslib_1.__exportStar(require(\"./format\"), exports);\ntslib_1.__exportStar(require(\"./routing\"), exports);\ntslib_1.__exportStar(require(\"./types\"), exports);\ntslib_1.__exportStar(require(\"./validators\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"./constants\":\"jTADb\",\"./error\":\"kvTPR\",\"./env\":\"hTySz\",\"./format\":\"8Olxe\",\"./routing\":\"5NgkK\",\"./types\":\"gyxNo\",\"./validators\":\"5Lvro\"}],\"jTADb\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.STANDARD_ERROR_MAP = exports.SERVER_ERROR_CODE_RANGE = exports.RESERVED_ERROR_CODES = exports.SERVER_ERROR = exports.INTERNAL_ERROR = exports.INVALID_PARAMS = exports.METHOD_NOT_FOUND = exports.INVALID_REQUEST = exports.PARSE_ERROR = void 0;\nexports.PARSE_ERROR = \"PARSE_ERROR\";\nexports.INVALID_REQUEST = \"INVALID_REQUEST\";\nexports.METHOD_NOT_FOUND = \"METHOD_NOT_FOUND\";\nexports.INVALID_PARAMS = \"INVALID_PARAMS\";\nexports.INTERNAL_ERROR = \"INTERNAL_ERROR\";\nexports.SERVER_ERROR = \"SERVER_ERROR\";\nexports.RESERVED_ERROR_CODES = [\n    -32700,\n    -32600,\n    -32601,\n    -32602,\n    -32603\n];\nexports.SERVER_ERROR_CODE_RANGE = [\n    -32000,\n    -32099\n];\nexports.STANDARD_ERROR_MAP = {\n    [exports.PARSE_ERROR]: {\n        code: -32700,\n        message: \"Parse error\"\n    },\n    [exports.INVALID_REQUEST]: {\n        code: -32600,\n        message: \"Invalid Request\"\n    },\n    [exports.METHOD_NOT_FOUND]: {\n        code: -32601,\n        message: \"Method not found\"\n    },\n    [exports.INVALID_PARAMS]: {\n        code: -32602,\n        message: \"Invalid params\"\n    },\n    [exports.INTERNAL_ERROR]: {\n        code: -32603,\n        message: \"Internal error\"\n    },\n    [exports.SERVER_ERROR]: {\n        code: -32000,\n        message: \"Server error\"\n    }\n};\n\n},{}],\"kvTPR\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.validateJsonRpcError = exports.getErrorByCode = exports.getError = exports.isValidErrorCode = exports.isReservedErrorCode = exports.isServerErrorCode = void 0;\nconst constants_1 = require(\"./constants\");\nfunction isServerErrorCode(code) {\n    return code <= constants_1.SERVER_ERROR_CODE_RANGE[0] && code >= constants_1.SERVER_ERROR_CODE_RANGE[1];\n}\nexports.isServerErrorCode = isServerErrorCode;\nfunction isReservedErrorCode(code) {\n    return constants_1.RESERVED_ERROR_CODES.includes(code);\n}\nexports.isReservedErrorCode = isReservedErrorCode;\nfunction isValidErrorCode(code) {\n    return typeof code === \"number\";\n}\nexports.isValidErrorCode = isValidErrorCode;\nfunction getError(type) {\n    if (!Object.keys(constants_1.STANDARD_ERROR_MAP).includes(type)) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];\n    return constants_1.STANDARD_ERROR_MAP[type];\n}\nexports.getError = getError;\nfunction getErrorByCode(code) {\n    const match = Object.values(constants_1.STANDARD_ERROR_MAP).find((e)=>e.code === code);\n    if (!match) return constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR];\n    return match;\n}\nexports.getErrorByCode = getErrorByCode;\nfunction validateJsonRpcError(response) {\n    if (typeof response.error.code === \"undefined\") return {\n        valid: false,\n        error: \"Missing code for JSON-RPC error\"\n    };\n    if (typeof response.error.message === \"undefined\") return {\n        valid: false,\n        error: \"Missing message for JSON-RPC error\"\n    };\n    if (!isValidErrorCode(response.error.code)) return {\n        valid: false,\n        error: `Invalid error code type for JSON-RPC: ${response.error.code}`\n    };\n    if (isReservedErrorCode(response.error.code)) {\n        const error = getErrorByCode(response.error.code);\n        if (error.message !== constants_1.STANDARD_ERROR_MAP[constants_1.INTERNAL_ERROR].message && response.error.message === error.message) return {\n            valid: false,\n            error: `Invalid error code message for JSON-RPC: ${response.error.code}`\n        };\n    }\n    return {\n        valid: true\n    };\n}\nexports.validateJsonRpcError = validateJsonRpcError;\n\n},{\"./constants\":\"jTADb\"}],\"hTySz\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isNodeJs = void 0;\nconst tslib_1 = require(\"tslib\");\nconst environment_1 = require(\"@pedrouid/environment\");\nexports.isNodeJs = environment_1.isNode;\ntslib_1.__exportStar(require(\"@pedrouid/environment\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"@pedrouid/environment\":\"b372L\"}],\"b372L\":[function(require,module,exports) {\n\"use strict\";\nvar __createBinding = this && this.__createBinding || (Object.create ? function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    Object.defineProperty(o, k2, {\n        enumerable: true,\n        get: function() {\n            return m[k];\n        }\n    });\n} : function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n});\nvar __exportStar = this && this.__exportStar || function(m, exports) {\n    for(var p in m)if (p !== \"default\" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);\n};\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n__exportStar(require(\"./crypto\"), exports);\n__exportStar(require(\"./env\"), exports);\n\n},{\"./crypto\":\"dg5EK\",\"./env\":\"5c1UZ\"}],\"dg5EK\":[function(require,module,exports) {\n\"use strict\";\nvar global = arguments[3];\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isBrowserCryptoAvailable = exports.getSubtleCrypto = exports.getBrowerCrypto = void 0;\nfunction getBrowerCrypto() {\n    return (global === null || global === void 0 ? void 0 : global.crypto) || (global === null || global === void 0 ? void 0 : global.msCrypto) || {};\n}\nexports.getBrowerCrypto = getBrowerCrypto;\nfunction getSubtleCrypto() {\n    const browserCrypto = getBrowerCrypto();\n    return browserCrypto.subtle || browserCrypto.webkitSubtle;\n}\nexports.getSubtleCrypto = getSubtleCrypto;\nfunction isBrowserCryptoAvailable() {\n    return !!getBrowerCrypto() && !!getSubtleCrypto();\n}\nexports.isBrowserCryptoAvailable = isBrowserCryptoAvailable;\n\n},{}],\"5c1UZ\":[function(require,module,exports) {\n\"use strict\";\nvar process = require(\"process\");\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isBrowser = exports.isNode = exports.isReactNative = void 0;\nfunction isReactNative() {\n    return typeof document === \"undefined\" && typeof navigator !== \"undefined\" && navigator.product === \"ReactNative\";\n}\nexports.isReactNative = isReactNative;\nfunction isNode() {\n    return typeof process !== \"undefined\" && typeof process.versions !== \"undefined\" && typeof process.versions.node !== \"undefined\";\n}\nexports.isNode = isNode;\nfunction isBrowser() {\n    return !isReactNative() && !isNode();\n}\nexports.isBrowser = isBrowser;\n\n},{\"process\":\"1iSuU\"}],\"1iSuU\":[function(require,module,exports) {\n// shim for using process in browser\nvar process = module.exports = {};\n// cached from whatever global is present so that test runners that stub it\n// don't break things.  But we need to wrap it in a try catch in case it is\n// wrapped in strict mode code which doesn't define any globals.  It's inside a\n// function because try/catches deoptimize in certain engines.\nvar cachedSetTimeout;\nvar cachedClearTimeout;\nfunction defaultSetTimout() {\n    throw new Error(\"setTimeout has not been defined\");\n}\nfunction defaultClearTimeout() {\n    throw new Error(\"clearTimeout has not been defined\");\n}\n(function() {\n    try {\n        if (typeof setTimeout === \"function\") cachedSetTimeout = setTimeout;\n        else cachedSetTimeout = defaultSetTimout;\n    } catch (e) {\n        cachedSetTimeout = defaultSetTimout;\n    }\n    try {\n        if (typeof clearTimeout === \"function\") cachedClearTimeout = clearTimeout;\n        else cachedClearTimeout = defaultClearTimeout;\n    } catch (e1) {\n        cachedClearTimeout = defaultClearTimeout;\n    }\n})();\nfunction runTimeout(fun) {\n    if (cachedSetTimeout === setTimeout) //normal enviroments in sane situations\n    return setTimeout(fun, 0);\n    // if setTimeout wasn't available but was latter defined\n    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {\n        cachedSetTimeout = setTimeout;\n        return setTimeout(fun, 0);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedSetTimeout(fun, 0);\n    } catch (e) {\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally\n            return cachedSetTimeout.call(null, fun, 0);\n        } catch (e) {\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error\n            return cachedSetTimeout.call(this, fun, 0);\n        }\n    }\n}\nfunction runClearTimeout(marker) {\n    if (cachedClearTimeout === clearTimeout) //normal enviroments in sane situations\n    return clearTimeout(marker);\n    // if clearTimeout wasn't available but was latter defined\n    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {\n        cachedClearTimeout = clearTimeout;\n        return clearTimeout(marker);\n    }\n    try {\n        // when when somebody has screwed with setTimeout but no I.E. maddness\n        return cachedClearTimeout(marker);\n    } catch (e) {\n        try {\n            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally\n            return cachedClearTimeout.call(null, marker);\n        } catch (e) {\n            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.\n            // Some versions of I.E. have different rules for clearTimeout vs setTimeout\n            return cachedClearTimeout.call(this, marker);\n        }\n    }\n}\nvar queue = [];\nvar draining = false;\nvar currentQueue;\nvar queueIndex = -1;\nfunction cleanUpNextTick() {\n    if (!draining || !currentQueue) return;\n    draining = false;\n    if (currentQueue.length) queue = currentQueue.concat(queue);\n    else queueIndex = -1;\n    if (queue.length) drainQueue();\n}\nfunction drainQueue() {\n    if (draining) return;\n    var timeout = runTimeout(cleanUpNextTick);\n    draining = true;\n    var len = queue.length;\n    while(len){\n        currentQueue = queue;\n        queue = [];\n        while(++queueIndex < len)if (currentQueue) currentQueue[queueIndex].run();\n        queueIndex = -1;\n        len = queue.length;\n    }\n    currentQueue = null;\n    draining = false;\n    runClearTimeout(timeout);\n}\nprocess.nextTick = function(fun) {\n    var args = new Array(arguments.length - 1);\n    if (arguments.length > 1) for(var i = 1; i < arguments.length; i++)args[i - 1] = arguments[i];\n    queue.push(new Item(fun, args));\n    if (queue.length === 1 && !draining) runTimeout(drainQueue);\n};\n// v8 likes predictible objects\nfunction Item(fun, array) {\n    this.fun = fun;\n    this.array = array;\n}\nItem.prototype.run = function() {\n    this.fun.apply(null, this.array);\n};\nprocess.title = \"browser\";\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\nprocess.version = \"\"; // empty string to avoid regexp issues\nprocess.versions = {};\nfunction noop() {}\nprocess.on = noop;\nprocess.addListener = noop;\nprocess.once = noop;\nprocess.off = noop;\nprocess.removeListener = noop;\nprocess.removeAllListeners = noop;\nprocess.emit = noop;\nprocess.prependListener = noop;\nprocess.prependOnceListener = noop;\nprocess.listeners = function(name) {\n    return [];\n};\nprocess.binding = function(name) {\n    throw new Error(\"process.binding is not supported\");\n};\nprocess.cwd = function() {\n    return \"/\";\n};\nprocess.chdir = function(dir) {\n    throw new Error(\"process.chdir is not supported\");\n};\nprocess.umask = function() {\n    return 0;\n};\n\n},{}],\"8Olxe\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.formatErrorMessage = exports.formatJsonRpcError = exports.formatJsonRpcResult = exports.formatJsonRpcRequest = exports.payloadId = void 0;\nconst error_1 = require(\"./error\");\nconst constants_1 = require(\"./constants\");\nfunction payloadId() {\n    const date = Date.now() * Math.pow(10, 3);\n    const extra = Math.floor(Math.random() * Math.pow(10, 3));\n    return date + extra;\n}\nexports.payloadId = payloadId;\nfunction formatJsonRpcRequest(method, params, id) {\n    return {\n        id: id || payloadId(),\n        jsonrpc: \"2.0\",\n        method,\n        params\n    };\n}\nexports.formatJsonRpcRequest = formatJsonRpcRequest;\nfunction formatJsonRpcResult(id, result) {\n    return {\n        id,\n        jsonrpc: \"2.0\",\n        result\n    };\n}\nexports.formatJsonRpcResult = formatJsonRpcResult;\nfunction formatJsonRpcError(id, error) {\n    return {\n        id,\n        jsonrpc: \"2.0\",\n        error: formatErrorMessage(error)\n    };\n}\nexports.formatJsonRpcError = formatJsonRpcError;\nfunction formatErrorMessage(error) {\n    if (typeof error === \"undefined\") return error_1.getError(constants_1.INTERNAL_ERROR);\n    if (typeof error === \"string\") error = Object.assign(Object.assign({}, error_1.getError(constants_1.SERVER_ERROR)), {\n        message: error\n    });\n    if (error_1.isReservedErrorCode(error.code)) error = error_1.getErrorByCode(error.code);\n    if (!error_1.isServerErrorCode(error.code)) throw new Error(\"Error code is not in server code range\");\n    return error;\n}\nexports.formatErrorMessage = formatErrorMessage;\n\n},{\"./error\":\"kvTPR\",\"./constants\":\"jTADb\"}],\"5NgkK\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isValidTrailingWildcardRoute = exports.isValidLeadingWildcardRoute = exports.isValidWildcardRoute = exports.isValidDefaultRoute = exports.isValidRoute = void 0;\nfunction isValidRoute(route) {\n    if (route.includes(\"*\")) return isValidWildcardRoute(route);\n    if (/\\W/g.test(route)) return false;\n    return true;\n}\nexports.isValidRoute = isValidRoute;\nfunction isValidDefaultRoute(route) {\n    return route === \"*\";\n}\nexports.isValidDefaultRoute = isValidDefaultRoute;\nfunction isValidWildcardRoute(route) {\n    if (isValidDefaultRoute(route)) return true;\n    if (!route.includes(\"*\")) return false;\n    if (route.split(\"*\").length !== 2) return false;\n    if (route.split(\"*\").filter((x)=>x.trim() === \"\").length !== 1) return false;\n    return true;\n}\nexports.isValidWildcardRoute = isValidWildcardRoute;\nfunction isValidLeadingWildcardRoute(route) {\n    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split(\"*\")[0].trim();\n}\nexports.isValidLeadingWildcardRoute = isValidLeadingWildcardRoute;\nfunction isValidTrailingWildcardRoute(route) {\n    return !isValidDefaultRoute(route) && isValidWildcardRoute(route) && !route.split(\"*\")[1].trim();\n}\nexports.isValidTrailingWildcardRoute = isValidTrailingWildcardRoute;\n\n},{}],\"gyxNo\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"@json-rpc-tools/types\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"@json-rpc-tools/types\":\"6TTqw\"}],\"6TTqw\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nconst tslib_1 = require(\"tslib\");\ntslib_1.__exportStar(require(\"./blockchain\"), exports);\ntslib_1.__exportStar(require(\"./jsonrpc\"), exports);\ntslib_1.__exportStar(require(\"./misc\"), exports);\ntslib_1.__exportStar(require(\"./multi\"), exports);\ntslib_1.__exportStar(require(\"./provider\"), exports);\ntslib_1.__exportStar(require(\"./router\"), exports);\ntslib_1.__exportStar(require(\"./schema\"), exports);\ntslib_1.__exportStar(require(\"./validator\"), exports);\n\n},{\"tslib\":\"hdsRu\",\"./blockchain\":\"5PMmI\",\"./jsonrpc\":\"azpg2\",\"./misc\":\"16ntc\",\"./multi\":\"hkR47\",\"./provider\":\"k2Sp0\",\"./router\":\"f8QmQ\",\"./schema\":\"kSI89\",\"./validator\":\"1gDtV\"}],\"5PMmI\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IBlockchainProvider = exports.IBlockchainAuthenticator = exports.IPendingRequests = void 0;\nconst misc_1 = require(\"./misc\");\nconst provider_1 = require(\"./provider\");\nclass IPendingRequests {\n    constructor(storage){\n        this.storage = storage;\n    }\n}\nexports.IPendingRequests = IPendingRequests;\nclass IBlockchainAuthenticator extends misc_1.IEvents {\n    constructor(config){\n        super();\n        this.config = config;\n    }\n}\nexports.IBlockchainAuthenticator = IBlockchainAuthenticator;\nclass IBlockchainProvider extends provider_1.IJsonRpcProvider {\n    constructor(connection, config){\n        super(connection);\n    }\n}\nexports.IBlockchainProvider = IBlockchainProvider;\n\n},{\"./misc\":\"16ntc\",\"./provider\":\"k2Sp0\"}],\"16ntc\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IEvents = void 0;\nclass IEvents {\n}\nexports.IEvents = IEvents;\n\n},{}],\"k2Sp0\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcProvider = exports.IBaseJsonRpcProvider = exports.IJsonRpcConnection = void 0;\nconst misc_1 = require(\"./misc\");\nclass IJsonRpcConnection extends misc_1.IEvents {\n    constructor(opts){\n        super();\n    }\n}\nexports.IJsonRpcConnection = IJsonRpcConnection;\nclass IBaseJsonRpcProvider extends misc_1.IEvents {\n    constructor(){\n        super();\n    }\n}\nexports.IBaseJsonRpcProvider = IBaseJsonRpcProvider;\nclass IJsonRpcProvider extends IBaseJsonRpcProvider {\n    constructor(connection){\n        super();\n    }\n}\nexports.IJsonRpcProvider = IJsonRpcProvider;\n\n},{\"./misc\":\"16ntc\"}],\"azpg2\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n\n},{}],\"hkR47\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IMultiServiceProvider = void 0;\nconst provider_1 = require(\"./provider\");\nclass IMultiServiceProvider extends provider_1.IBaseJsonRpcProvider {\n    constructor(config){\n        super();\n        this.config = config;\n    }\n}\nexports.IMultiServiceProvider = IMultiServiceProvider;\n\n},{\"./provider\":\"k2Sp0\"}],\"f8QmQ\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcRouter = void 0;\nclass IJsonRpcRouter {\n    constructor(routes){\n        this.routes = routes;\n    }\n}\nexports.IJsonRpcRouter = IJsonRpcRouter;\n\n},{}],\"kSI89\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\n\n},{}],\"1gDtV\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.IJsonRpcValidator = void 0;\nclass IJsonRpcValidator {\n    constructor(schemas){\n        this.schemas = schemas;\n    }\n}\nexports.IJsonRpcValidator = IJsonRpcValidator;\n\n},{}],\"5Lvro\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isJsonRpcValidationInvalid = exports.isJsonRpcError = exports.isJsonRpcResult = exports.isJsonRpcResponse = exports.isJsonRpcRequest = exports.isJsonRpcPayload = void 0;\nfunction isJsonRpcPayload(payload) {\n    return \"id\" in payload && \"jsonrpc\" in payload && payload.jsonrpc === \"2.0\";\n}\nexports.isJsonRpcPayload = isJsonRpcPayload;\nfunction isJsonRpcRequest(payload) {\n    return isJsonRpcPayload(payload) && \"method\" in payload;\n}\nexports.isJsonRpcRequest = isJsonRpcRequest;\nfunction isJsonRpcResponse(payload) {\n    return isJsonRpcPayload(payload) && (isJsonRpcResult(payload) || isJsonRpcError(payload));\n}\nexports.isJsonRpcResponse = isJsonRpcResponse;\nfunction isJsonRpcResult(payload) {\n    return \"result\" in payload;\n}\nexports.isJsonRpcResult = isJsonRpcResult;\nfunction isJsonRpcError(payload) {\n    return \"error\" in payload;\n}\nexports.isJsonRpcError = isJsonRpcError;\nfunction isJsonRpcValidationInvalid(validation) {\n    return \"error\" in validation && validation.valid === false;\n}\nexports.isJsonRpcValidationInvalid = isJsonRpcValidationInvalid;\n\n},{}],\"7LjTp\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.HttpConnection = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst axios_1 = tslib_1.__importDefault(require(\"axios\"));\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst safe_json_utils_1 = require(\"safe-json-utils\");\nconst url_1 = require(\"./url\");\nclass HttpConnection {\n    constructor(url){\n        this.url = url;\n        this.events = new events_1.EventEmitter();\n        this.registering = false;\n        if (!url_1.isHttpUrl(url)) throw new Error(`Provided URL is not compatible with HTTP connection: ${url}`);\n        this.url = url;\n    }\n    get connected() {\n        return typeof this.api !== \"undefined\";\n    }\n    get connecting() {\n        return this.registering;\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    open(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.api = yield this.register(url);\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.onClose();\n        });\n    }\n    send(payload, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.api === \"undefined\") this.api = yield this.register();\n            this.api.post(\"/\", payload).then((res)=>this.onPayload(res)).catch((err)=>this.onError(payload.id, err));\n        });\n    }\n    register(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (!url_1.isHttpUrl(url)) throw new Error(`Provided URL is not compatible with HTTP connection: ${url}`);\n            if (this.registering) return new Promise((resolve, reject)=>{\n                this.events.once(\"open\", ()=>{\n                    if (typeof this.api === \"undefined\") return reject(new Error(\"HTTP connection is missing or invalid\"));\n                    resolve(this.api);\n                });\n            });\n            this.url = url;\n            this.registering = true;\n            const api = axios_1.default.create({\n                baseURL: url,\n                timeout: 30000,\n                headers: {\n                    Accept: \"application/json\",\n                    \"Content-Type\": \"application/json\"\n                }\n            });\n            try {\n                yield api.post(\"/\", {\n                    id: 1,\n                    jsonrpc: \"2.0\",\n                    method: \"test\",\n                    params: []\n                });\n                this.onOpen(api);\n            } catch (e) {\n                this.onClose();\n                throw new Error(`Unavailable HTTP RPC url at ${url}`);\n            }\n            return api;\n        });\n    }\n    onOpen(api) {\n        this.api = api;\n        this.registering = false;\n        this.events.emit(\"open\");\n    }\n    onClose() {\n        this.api = undefined;\n        this.events.emit(\"close\");\n    }\n    onPayload(e) {\n        if (typeof e.data === \"undefined\") return;\n        const payload = typeof e.data === \"string\" ? safe_json_utils_1.safeJsonParse(e.data) : e.data;\n        this.events.emit(\"payload\", payload);\n    }\n    onError(id, e) {\n        const message = e.message || e.toString();\n        const payload = utils_1.formatJsonRpcError(id, message);\n        this.events.emit(\"payload\", payload);\n    }\n}\nexports.HttpConnection = HttpConnection;\n\n},{\"tslib\":\"hdsRu\",\"events\":\"eDevp\",\"axios\":\"jWD94\",\"@json-rpc-tools/utils\":\"h6aFv\",\"safe-json-utils\":\"joKwd\",\"./url\":\"9Then\"}],\"jWD94\":[function(require,module,exports) {\nmodule.exports = require(\"./lib/axios\");\n\n},{\"./lib/axios\":\"16AZH\"}],\"16AZH\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./utils\");\nvar bind = require(\"./helpers/bind\");\nvar Axios = require(\"./core/Axios\");\nvar mergeConfig = require(\"./core/mergeConfig\");\nvar defaults = require(\"./defaults\");\n/**\n * Create an instance of Axios\n *\n * @param {Object} defaultConfig The default config for the instance\n * @return {Axios} A new instance of Axios\n */ function createInstance(defaultConfig) {\n    var context = new Axios(defaultConfig);\n    var instance = bind(Axios.prototype.request, context);\n    // Copy axios.prototype to instance\n    utils.extend(instance, Axios.prototype, context);\n    // Copy context to instance\n    utils.extend(instance, context);\n    return instance;\n}\n// Create the default instance to be exported\nvar axios = createInstance(defaults);\n// Expose Axios class to allow class inheritance\naxios.Axios = Axios;\n// Factory for creating new instances\naxios.create = function create(instanceConfig) {\n    return createInstance(mergeConfig(axios.defaults, instanceConfig));\n};\n// Expose Cancel & CancelToken\naxios.Cancel = require(\"./cancel/Cancel\");\naxios.CancelToken = require(\"./cancel/CancelToken\");\naxios.isCancel = require(\"./cancel/isCancel\");\n// Expose all/spread\naxios.all = function all(promises) {\n    return Promise.all(promises);\n};\naxios.spread = require(\"./helpers/spread\");\n// Expose isAxiosError\naxios.isAxiosError = require(\"./helpers/isAxiosError\");\nmodule.exports = axios;\n// Allow use of default import syntax in TypeScript\nmodule.exports.default = axios;\n\n},{\"./utils\":\"hnkFL\",\"./helpers/bind\":\"53L3D\",\"./core/Axios\":\"lUPyV\",\"./core/mergeConfig\":\"cpLHT\",\"./defaults\":\"avlKI\",\"./cancel/Cancel\":\"gnU4h\",\"./cancel/CancelToken\":\"eIXu8\",\"./cancel/isCancel\":\"a2h6U\",\"./helpers/spread\":\"1nXwb\",\"./helpers/isAxiosError\":\"iFKJj\"}],\"hnkFL\":[function(require,module,exports) {\n\"use strict\";\nvar bind = require(\"./helpers/bind\");\n// utils is a library of generic helper functions non-specific to axios\nvar toString = Object.prototype.toString;\n/**\n * Determine if a value is an Array\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an Array, otherwise false\n */ function isArray(val) {\n    return toString.call(val) === \"[object Array]\";\n}\n/**\n * Determine if a value is undefined\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if the value is undefined, otherwise false\n */ function isUndefined(val) {\n    return typeof val === \"undefined\";\n}\n/**\n * Determine if a value is a Buffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Buffer, otherwise false\n */ function isBuffer(val) {\n    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && typeof val.constructor.isBuffer === \"function\" && val.constructor.isBuffer(val);\n}\n/**\n * Determine if a value is an ArrayBuffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an ArrayBuffer, otherwise false\n */ function isArrayBuffer(val) {\n    return toString.call(val) === \"[object ArrayBuffer]\";\n}\n/**\n * Determine if a value is a FormData\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an FormData, otherwise false\n */ function isFormData(val) {\n    return typeof FormData !== \"undefined\" && val instanceof FormData;\n}\n/**\n * Determine if a value is a view on an ArrayBuffer\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false\n */ function isArrayBufferView(val) {\n    var result;\n    if (typeof ArrayBuffer !== \"undefined\" && ArrayBuffer.isView) result = ArrayBuffer.isView(val);\n    else result = val && val.buffer && val.buffer instanceof ArrayBuffer;\n    return result;\n}\n/**\n * Determine if a value is a String\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a String, otherwise false\n */ function isString(val) {\n    return typeof val === \"string\";\n}\n/**\n * Determine if a value is a Number\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Number, otherwise false\n */ function isNumber(val) {\n    return typeof val === \"number\";\n}\n/**\n * Determine if a value is an Object\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is an Object, otherwise false\n */ function isObject(val) {\n    return val !== null && typeof val === \"object\";\n}\n/**\n * Determine if a value is a plain Object\n *\n * @param {Object} val The value to test\n * @return {boolean} True if value is a plain Object, otherwise false\n */ function isPlainObject(val) {\n    if (toString.call(val) !== \"[object Object]\") return false;\n    var prototype = Object.getPrototypeOf(val);\n    return prototype === null || prototype === Object.prototype;\n}\n/**\n * Determine if a value is a Date\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Date, otherwise false\n */ function isDate(val) {\n    return toString.call(val) === \"[object Date]\";\n}\n/**\n * Determine if a value is a File\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a File, otherwise false\n */ function isFile(val) {\n    return toString.call(val) === \"[object File]\";\n}\n/**\n * Determine if a value is a Blob\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Blob, otherwise false\n */ function isBlob(val) {\n    return toString.call(val) === \"[object Blob]\";\n}\n/**\n * Determine if a value is a Function\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Function, otherwise false\n */ function isFunction(val) {\n    return toString.call(val) === \"[object Function]\";\n}\n/**\n * Determine if a value is a Stream\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a Stream, otherwise false\n */ function isStream(val) {\n    return isObject(val) && isFunction(val.pipe);\n}\n/**\n * Determine if a value is a URLSearchParams object\n *\n * @param {Object} val The value to test\n * @returns {boolean} True if value is a URLSearchParams object, otherwise false\n */ function isURLSearchParams(val) {\n    return typeof URLSearchParams !== \"undefined\" && val instanceof URLSearchParams;\n}\n/**\n * Trim excess whitespace off the beginning and end of a string\n *\n * @param {String} str The String to trim\n * @returns {String} The String freed of excess whitespace\n */ function trim(str) {\n    return str.trim ? str.trim() : str.replace(/^\\s+|\\s+$/g, \"\");\n}\n/**\n * Determine if we're running in a standard browser environment\n *\n * This allows axios to run in a web worker, and react-native.\n * Both environments support XMLHttpRequest, but not fully standard globals.\n *\n * web workers:\n *  typeof window -> undefined\n *  typeof document -> undefined\n *\n * react-native:\n *  navigator.product -> 'ReactNative'\n * nativescript\n *  navigator.product -> 'NativeScript' or 'NS'\n */ function isStandardBrowserEnv() {\n    if (typeof navigator !== \"undefined\" && (navigator.product === \"ReactNative\" || navigator.product === \"NativeScript\" || navigator.product === \"NS\")) return false;\n    return typeof window !== \"undefined\" && typeof document !== \"undefined\";\n}\n/**\n * Iterate over an Array or an Object invoking a function for each item.\n *\n * If `obj` is an Array callback will be called passing\n * the value, index, and complete array for each item.\n *\n * If 'obj' is an Object callback will be called passing\n * the value, key, and complete object for each property.\n *\n * @param {Object|Array} obj The object to iterate\n * @param {Function} fn The callback to invoke for each item\n */ function forEach(obj, fn) {\n    // Don't bother if no value provided\n    if (obj === null || typeof obj === \"undefined\") return;\n    // Force an array if not already something iterable\n    if (typeof obj !== \"object\") /*eslint no-param-reassign:0*/ obj = [\n        obj\n    ];\n    if (isArray(obj)) // Iterate over array values\n    for(var i = 0, l = obj.length; i < l; i++)fn.call(null, obj[i], i, obj);\n    else {\n        // Iterate over object keys\n        for(var key in obj)if (Object.prototype.hasOwnProperty.call(obj, key)) fn.call(null, obj[key], key, obj);\n    }\n}\n/**\n * Accepts varargs expecting each argument to be an object, then\n * immutably merges the properties of each object and returns result.\n *\n * When multiple objects contain the same key the later object in\n * the arguments list will take precedence.\n *\n * Example:\n *\n * ```js\n * var result = merge({foo: 123}, {foo: 456});\n * console.log(result.foo); // outputs 456\n * ```\n *\n * @param {Object} obj1 Object to merge\n * @returns {Object} Result of all merge properties\n */ function merge() {\n    var result = {};\n    function assignValue(val, key) {\n        if (isPlainObject(result[key]) && isPlainObject(val)) result[key] = merge(result[key], val);\n        else if (isPlainObject(val)) result[key] = merge({}, val);\n        else if (isArray(val)) result[key] = val.slice();\n        else result[key] = val;\n    }\n    for(var i = 0, l = arguments.length; i < l; i++)forEach(arguments[i], assignValue);\n    return result;\n}\n/**\n * Extends object a by mutably adding to it the properties of object b.\n *\n * @param {Object} a The object to be extended\n * @param {Object} b The object to copy properties from\n * @param {Object} thisArg The object to bind function to\n * @return {Object} The resulting value of object a\n */ function extend(a, b, thisArg) {\n    forEach(b, function assignValue(val, key) {\n        if (thisArg && typeof val === \"function\") a[key] = bind(val, thisArg);\n        else a[key] = val;\n    });\n    return a;\n}\n/**\n * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)\n *\n * @param {string} content with BOM\n * @return {string} content value without BOM\n */ function stripBOM(content) {\n    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);\n    return content;\n}\nmodule.exports = {\n    isArray: isArray,\n    isArrayBuffer: isArrayBuffer,\n    isBuffer: isBuffer,\n    isFormData: isFormData,\n    isArrayBufferView: isArrayBufferView,\n    isString: isString,\n    isNumber: isNumber,\n    isObject: isObject,\n    isPlainObject: isPlainObject,\n    isUndefined: isUndefined,\n    isDate: isDate,\n    isFile: isFile,\n    isBlob: isBlob,\n    isFunction: isFunction,\n    isStream: isStream,\n    isURLSearchParams: isURLSearchParams,\n    isStandardBrowserEnv: isStandardBrowserEnv,\n    forEach: forEach,\n    merge: merge,\n    extend: extend,\n    trim: trim,\n    stripBOM: stripBOM\n};\n\n},{\"./helpers/bind\":\"53L3D\"}],\"53L3D\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function bind(fn, thisArg) {\n    return function wrap() {\n        var args = new Array(arguments.length);\n        for(var i = 0; i < args.length; i++)args[i] = arguments[i];\n        return fn.apply(thisArg, args);\n    };\n};\n\n},{}],\"lUPyV\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar buildURL = require(\"../helpers/buildURL\");\nvar InterceptorManager = require(\"./InterceptorManager\");\nvar dispatchRequest = require(\"./dispatchRequest\");\nvar mergeConfig = require(\"./mergeConfig\");\nvar validator = require(\"../helpers/validator\");\nvar validators = validator.validators;\n/**\n * Create a new instance of Axios\n *\n * @param {Object} instanceConfig The default config for the instance\n */ function Axios(instanceConfig) {\n    this.defaults = instanceConfig;\n    this.interceptors = {\n        request: new InterceptorManager(),\n        response: new InterceptorManager()\n    };\n}\n/**\n * Dispatch a request\n *\n * @param {Object} config The config specific for this request (merged with this.defaults)\n */ Axios.prototype.request = function request(config) {\n    /*eslint no-param-reassign:0*/ // Allow for axios('example/url'[, config]) a la fetch API\n    if (typeof config === \"string\") {\n        config = arguments[1] || {};\n        config.url = arguments[0];\n    } else config = config || {};\n    config = mergeConfig(this.defaults, config);\n    // Set config.method\n    if (config.method) config.method = config.method.toLowerCase();\n    else if (this.defaults.method) config.method = this.defaults.method.toLowerCase();\n    else config.method = \"get\";\n    var transitional = config.transitional;\n    if (transitional !== undefined) validator.assertOptions(transitional, {\n        silentJSONParsing: validators.transitional(validators.boolean, \"1.0.0\"),\n        forcedJSONParsing: validators.transitional(validators.boolean, \"1.0.0\"),\n        clarifyTimeoutError: validators.transitional(validators.boolean, \"1.0.0\")\n    }, false);\n    // filter out skipped interceptors\n    var requestInterceptorChain = [];\n    var synchronousRequestInterceptors = true;\n    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {\n        if (typeof interceptor.runWhen === \"function\" && interceptor.runWhen(config) === false) return;\n        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;\n        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);\n    });\n    var responseInterceptorChain = [];\n    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {\n        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);\n    });\n    var promise;\n    if (!synchronousRequestInterceptors) {\n        var chain = [\n            dispatchRequest,\n            undefined\n        ];\n        Array.prototype.unshift.apply(chain, requestInterceptorChain);\n        chain = chain.concat(responseInterceptorChain);\n        promise = Promise.resolve(config);\n        while(chain.length)promise = promise.then(chain.shift(), chain.shift());\n        return promise;\n    }\n    var newConfig = config;\n    while(requestInterceptorChain.length){\n        var onFulfilled = requestInterceptorChain.shift();\n        var onRejected = requestInterceptorChain.shift();\n        try {\n            newConfig = onFulfilled(newConfig);\n        } catch (error) {\n            onRejected(error);\n            break;\n        }\n    }\n    try {\n        promise = dispatchRequest(newConfig);\n    } catch (error) {\n        return Promise.reject(error);\n    }\n    while(responseInterceptorChain.length)promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());\n    return promise;\n};\nAxios.prototype.getUri = function getUri(config) {\n    config = mergeConfig(this.defaults, config);\n    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\\?/, \"\");\n};\n// Provide aliases for supported request methods\nutils.forEach([\n    \"delete\",\n    \"get\",\n    \"head\",\n    \"options\"\n], function forEachMethodNoData(method) {\n    /*eslint func-names:0*/ Axios.prototype[method] = function(url, config) {\n        return this.request(mergeConfig(config || {}, {\n            method: method,\n            url: url,\n            data: (config || {}).data\n        }));\n    };\n});\nutils.forEach([\n    \"post\",\n    \"put\",\n    \"patch\"\n], function forEachMethodWithData(method) {\n    /*eslint func-names:0*/ Axios.prototype[method] = function(url, data, config) {\n        return this.request(mergeConfig(config || {}, {\n            method: method,\n            url: url,\n            data: data\n        }));\n    };\n});\nmodule.exports = Axios;\n\n},{\"./../utils\":\"hnkFL\",\"../helpers/buildURL\":\"fy0cx\",\"./InterceptorManager\":\"2ieoi\",\"./dispatchRequest\":\"eAF1d\",\"./mergeConfig\":\"cpLHT\",\"../helpers/validator\":\"2WhhG\"}],\"fy0cx\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nfunction encode(val) {\n    return encodeURIComponent(val).replace(/%3A/gi, \":\").replace(/%24/g, \"$\").replace(/%2C/gi, \",\").replace(/%20/g, \"+\").replace(/%5B/gi, \"[\").replace(/%5D/gi, \"]\");\n}\n/**\n * Build a URL by appending params to the end\n *\n * @param {string} url The base of the url (e.g., http://www.google.com)\n * @param {object} [params] The params to be appended\n * @returns {string} The formatted url\n */ module.exports = function buildURL(url, params, paramsSerializer) {\n    /*eslint no-param-reassign:0*/ if (!params) return url;\n    var serializedParams;\n    if (paramsSerializer) serializedParams = paramsSerializer(params);\n    else if (utils.isURLSearchParams(params)) serializedParams = params.toString();\n    else {\n        var parts = [];\n        utils.forEach(params, function serialize(val, key) {\n            if (val === null || typeof val === \"undefined\") return;\n            if (utils.isArray(val)) key = key + \"[]\";\n            else val = [\n                val\n            ];\n            utils.forEach(val, function parseValue(v) {\n                if (utils.isDate(v)) v = v.toISOString();\n                else if (utils.isObject(v)) v = JSON.stringify(v);\n                parts.push(encode(key) + \"=\" + encode(v));\n            });\n        });\n        serializedParams = parts.join(\"&\");\n    }\n    if (serializedParams) {\n        var hashmarkIndex = url.indexOf(\"#\");\n        if (hashmarkIndex !== -1) url = url.slice(0, hashmarkIndex);\n        url += (url.indexOf(\"?\") === -1 ? \"?\" : \"&\") + serializedParams;\n    }\n    return url;\n};\n\n},{\"./../utils\":\"hnkFL\"}],\"2ieoi\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nfunction InterceptorManager() {\n    this.handlers = [];\n}\n/**\n * Add a new interceptor to the stack\n *\n * @param {Function} fulfilled The function to handle `then` for a `Promise`\n * @param {Function} rejected The function to handle `reject` for a `Promise`\n *\n * @return {Number} An ID used to remove interceptor later\n */ InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {\n    this.handlers.push({\n        fulfilled: fulfilled,\n        rejected: rejected,\n        synchronous: options ? options.synchronous : false,\n        runWhen: options ? options.runWhen : null\n    });\n    return this.handlers.length - 1;\n};\n/**\n * Remove an interceptor from the stack\n *\n * @param {Number} id The ID that was returned by `use`\n */ InterceptorManager.prototype.eject = function eject(id) {\n    if (this.handlers[id]) this.handlers[id] = null;\n};\n/**\n * Iterate over all the registered interceptors\n *\n * This method is particularly useful for skipping over any\n * interceptors that may have become `null` calling `eject`.\n *\n * @param {Function} fn The function to call for each interceptor\n */ InterceptorManager.prototype.forEach = function forEach(fn) {\n    utils.forEach(this.handlers, function forEachHandler(h) {\n        if (h !== null) fn(h);\n    });\n};\nmodule.exports = InterceptorManager;\n\n},{\"./../utils\":\"hnkFL\"}],\"eAF1d\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar transformData = require(\"./transformData\");\nvar isCancel = require(\"../cancel/isCancel\");\nvar defaults = require(\"../defaults\");\n/**\n * Throws a `Cancel` if cancellation has been requested.\n */ function throwIfCancellationRequested(config) {\n    if (config.cancelToken) config.cancelToken.throwIfRequested();\n}\n/**\n * Dispatch a request to the server using the configured adapter.\n *\n * @param {object} config The config that is to be used for the request\n * @returns {Promise} The Promise to be fulfilled\n */ module.exports = function dispatchRequest(config) {\n    throwIfCancellationRequested(config);\n    // Ensure headers exist\n    config.headers = config.headers || {};\n    // Transform request data\n    config.data = transformData.call(config, config.data, config.headers, config.transformRequest);\n    // Flatten headers\n    config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers);\n    utils.forEach([\n        \"delete\",\n        \"get\",\n        \"head\",\n        \"post\",\n        \"put\",\n        \"patch\",\n        \"common\"\n    ], function cleanHeaderConfig(method) {\n        delete config.headers[method];\n    });\n    var adapter = config.adapter || defaults.adapter;\n    return adapter(config).then(function onAdapterResolution(response) {\n        throwIfCancellationRequested(config);\n        // Transform response data\n        response.data = transformData.call(config, response.data, response.headers, config.transformResponse);\n        return response;\n    }, function onAdapterRejection(reason) {\n        if (!isCancel(reason)) {\n            throwIfCancellationRequested(config);\n            // Transform response data\n            if (reason && reason.response) reason.response.data = transformData.call(config, reason.response.data, reason.response.headers, config.transformResponse);\n        }\n        return Promise.reject(reason);\n    });\n};\n\n},{\"./../utils\":\"hnkFL\",\"./transformData\":\"b1lA9\",\"../cancel/isCancel\":\"a2h6U\",\"../defaults\":\"avlKI\"}],\"b1lA9\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar defaults = require(\"./../defaults\");\n/**\n * Transform the data for a request or a response\n *\n * @param {Object|String} data The data to be transformed\n * @param {Array} headers The headers for the request or response\n * @param {Array|Function} fns A single function or Array of functions\n * @returns {*} The resulting transformed data\n */ module.exports = function transformData(data, headers, fns) {\n    var context = this || defaults;\n    /*eslint no-param-reassign:0*/ utils.forEach(fns, function transform(fn) {\n        data = fn.call(context, data, headers);\n    });\n    return data;\n};\n\n},{\"./../utils\":\"hnkFL\",\"./../defaults\":\"avlKI\"}],\"avlKI\":[function(require,module,exports) {\n\"use strict\";\nvar process = require(\"process\");\nvar utils = require(\"./utils\");\nvar normalizeHeaderName = require(\"./helpers/normalizeHeaderName\");\nvar enhanceError = require(\"./core/enhanceError\");\nvar DEFAULT_CONTENT_TYPE = {\n    \"Content-Type\": \"application/x-www-form-urlencoded\"\n};\nfunction setContentTypeIfUnset(headers, value) {\n    if (!utils.isUndefined(headers) && utils.isUndefined(headers[\"Content-Type\"])) headers[\"Content-Type\"] = value;\n}\nfunction getDefaultAdapter() {\n    var adapter;\n    if (typeof XMLHttpRequest !== \"undefined\") // For browsers use XHR adapter\n    adapter = require(\"./adapters/xhr\");\n    else if (typeof process !== \"undefined\" && Object.prototype.toString.call(process) === \"[object process]\") // For node use HTTP adapter\n    adapter = require(\"./adapters/http\");\n    return adapter;\n}\nfunction stringifySafely(rawValue, parser, encoder) {\n    if (utils.isString(rawValue)) try {\n        (parser || JSON.parse)(rawValue);\n        return utils.trim(rawValue);\n    } catch (e) {\n        if (e.name !== \"SyntaxError\") throw e;\n    }\n    return (encoder || JSON.stringify)(rawValue);\n}\nvar defaults = {\n    transitional: {\n        silentJSONParsing: true,\n        forcedJSONParsing: true,\n        clarifyTimeoutError: false\n    },\n    adapter: getDefaultAdapter(),\n    transformRequest: [\n        function transformRequest(data, headers) {\n            normalizeHeaderName(headers, \"Accept\");\n            normalizeHeaderName(headers, \"Content-Type\");\n            if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) return data;\n            if (utils.isArrayBufferView(data)) return data.buffer;\n            if (utils.isURLSearchParams(data)) {\n                setContentTypeIfUnset(headers, \"application/x-www-form-urlencoded;charset=utf-8\");\n                return data.toString();\n            }\n            if (utils.isObject(data) || headers && headers[\"Content-Type\"] === \"application/json\") {\n                setContentTypeIfUnset(headers, \"application/json\");\n                return stringifySafely(data);\n            }\n            return data;\n        }\n    ],\n    transformResponse: [\n        function transformResponse(data) {\n            var transitional = this.transitional;\n            var silentJSONParsing = transitional && transitional.silentJSONParsing;\n            var forcedJSONParsing = transitional && transitional.forcedJSONParsing;\n            var strictJSONParsing = !silentJSONParsing && this.responseType === \"json\";\n            if (strictJSONParsing || forcedJSONParsing && utils.isString(data) && data.length) try {\n                return JSON.parse(data);\n            } catch (e) {\n                if (strictJSONParsing) {\n                    if (e.name === \"SyntaxError\") throw enhanceError(e, this, \"E_JSON_PARSE\");\n                    throw e;\n                }\n            }\n            return data;\n        }\n    ],\n    /**\n   * A timeout in milliseconds to abort a request. If set to 0 (default) a\n   * timeout is not created.\n   */ timeout: 0,\n    xsrfCookieName: \"XSRF-TOKEN\",\n    xsrfHeaderName: \"X-XSRF-TOKEN\",\n    maxContentLength: -1,\n    maxBodyLength: -1,\n    validateStatus: function validateStatus(status) {\n        return status >= 200 && status < 300;\n    }\n};\ndefaults.headers = {\n    common: {\n        \"Accept\": \"application/json, text/plain, */*\"\n    }\n};\nutils.forEach([\n    \"delete\",\n    \"get\",\n    \"head\"\n], function forEachMethodNoData(method) {\n    defaults.headers[method] = {};\n});\nutils.forEach([\n    \"post\",\n    \"put\",\n    \"patch\"\n], function forEachMethodWithData(method) {\n    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);\n});\nmodule.exports = defaults;\n\n},{\"process\":\"1iSuU\",\"./utils\":\"hnkFL\",\"./helpers/normalizeHeaderName\":\"9vUXx\",\"./core/enhanceError\":\"cJwKH\",\"./adapters/xhr\":\"bSZyW\",\"./adapters/http\":\"bSZyW\"}],\"9vUXx\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"../utils\");\nmodule.exports = function normalizeHeaderName(headers, normalizedName) {\n    utils.forEach(headers, function processHeader(value, name) {\n        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {\n            headers[normalizedName] = value;\n            delete headers[name];\n        }\n    });\n};\n\n},{\"../utils\":\"hnkFL\"}],\"cJwKH\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Update an Error with the specified config, error code, and response.\n *\n * @param {Error} error The error to update.\n * @param {Object} config The config.\n * @param {string} [code] The error code (for example, 'ECONNABORTED').\n * @param {Object} [request] The request.\n * @param {Object} [response] The response.\n * @returns {Error} The error.\n */ module.exports = function enhanceError(error, config, code, request, response) {\n    error.config = config;\n    if (code) error.code = code;\n    error.request = request;\n    error.response = response;\n    error.isAxiosError = true;\n    error.toJSON = function toJSON() {\n        return {\n            // Standard\n            message: this.message,\n            name: this.name,\n            // Microsoft\n            description: this.description,\n            number: this.number,\n            // Mozilla\n            fileName: this.fileName,\n            lineNumber: this.lineNumber,\n            columnNumber: this.columnNumber,\n            stack: this.stack,\n            // Axios\n            config: this.config,\n            code: this.code\n        };\n    };\n    return error;\n};\n\n},{}],\"bSZyW\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nvar settle = require(\"./../core/settle\");\nvar cookies = require(\"./../helpers/cookies\");\nvar buildURL = require(\"./../helpers/buildURL\");\nvar buildFullPath = require(\"../core/buildFullPath\");\nvar parseHeaders = require(\"./../helpers/parseHeaders\");\nvar isURLSameOrigin = require(\"./../helpers/isURLSameOrigin\");\nvar createError = require(\"../core/createError\");\nmodule.exports = function xhrAdapter(config) {\n    return new Promise(function dispatchXhrRequest(resolve, reject) {\n        var requestData = config.data;\n        var requestHeaders = config.headers;\n        var responseType = config.responseType;\n        if (utils.isFormData(requestData)) delete requestHeaders[\"Content-Type\"]; // Let the browser set it\n        var request = new XMLHttpRequest();\n        // HTTP basic authentication\n        if (config.auth) {\n            var username = config.auth.username || \"\";\n            var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : \"\";\n            requestHeaders.Authorization = \"Basic \" + btoa(username + \":\" + password);\n        }\n        var fullPath = buildFullPath(config.baseURL, config.url);\n        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);\n        // Set the request timeout in MS\n        request.timeout = config.timeout;\n        function onloadend() {\n            if (!request) return;\n            // Prepare the response\n            var responseHeaders = \"getAllResponseHeaders\" in request ? parseHeaders(request.getAllResponseHeaders()) : null;\n            var responseData = !responseType || responseType === \"text\" || responseType === \"json\" ? request.responseText : request.response;\n            var response = {\n                data: responseData,\n                status: request.status,\n                statusText: request.statusText,\n                headers: responseHeaders,\n                config: config,\n                request: request\n            };\n            settle(resolve, reject, response);\n            // Clean up request\n            request = null;\n        }\n        if (\"onloadend\" in request) // Use onloadend if available\n        request.onloadend = onloadend;\n        else // Listen for ready state to emulate onloadend\n        request.onreadystatechange = function handleLoad() {\n            if (!request || request.readyState !== 4) return;\n            // The request errored out and we didn't get a response, this will be\n            // handled by onerror instead\n            // With one exception: request that using file: protocol, most browsers\n            // will return status as 0 even though it's a successful request\n            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf(\"file:\") === 0)) return;\n            // readystate handler is calling before onerror or ontimeout handlers,\n            // so we should call onloadend on the next 'tick'\n            setTimeout(onloadend);\n        };\n        // Handle browser request cancellation (as opposed to a manual cancellation)\n        request.onabort = function handleAbort() {\n            if (!request) return;\n            reject(createError(\"Request aborted\", config, \"ECONNABORTED\", request));\n            // Clean up request\n            request = null;\n        };\n        // Handle low level network errors\n        request.onerror = function handleError() {\n            // Real errors are hidden from us by the browser\n            // onerror should only fire if it's a network error\n            reject(createError(\"Network Error\", config, null, request));\n            // Clean up request\n            request = null;\n        };\n        // Handle timeout\n        request.ontimeout = function handleTimeout() {\n            var timeoutErrorMessage = \"timeout of \" + config.timeout + \"ms exceeded\";\n            if (config.timeoutErrorMessage) timeoutErrorMessage = config.timeoutErrorMessage;\n            reject(createError(timeoutErrorMessage, config, config.transitional && config.transitional.clarifyTimeoutError ? \"ETIMEDOUT\" : \"ECONNABORTED\", request));\n            // Clean up request\n            request = null;\n        };\n        // Add xsrf header\n        // This is only done if running in a standard browser environment.\n        // Specifically not if we're in a web worker, or react-native.\n        if (utils.isStandardBrowserEnv()) {\n            // Add xsrf header\n            var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : undefined;\n            if (xsrfValue) requestHeaders[config.xsrfHeaderName] = xsrfValue;\n        }\n        // Add headers to the request\n        if (\"setRequestHeader\" in request) utils.forEach(requestHeaders, function setRequestHeader(val, key) {\n            if (typeof requestData === \"undefined\" && key.toLowerCase() === \"content-type\") // Remove Content-Type if data is undefined\n            delete requestHeaders[key];\n            else // Otherwise add header to the request\n            request.setRequestHeader(key, val);\n        });\n        // Add withCredentials to request if needed\n        if (!utils.isUndefined(config.withCredentials)) request.withCredentials = !!config.withCredentials;\n        // Add responseType to request if needed\n        if (responseType && responseType !== \"json\") request.responseType = config.responseType;\n        // Handle progress if needed\n        if (typeof config.onDownloadProgress === \"function\") request.addEventListener(\"progress\", config.onDownloadProgress);\n        // Not all browsers support upload events\n        if (typeof config.onUploadProgress === \"function\" && request.upload) request.upload.addEventListener(\"progress\", config.onUploadProgress);\n        if (config.cancelToken) // Handle cancellation\n        config.cancelToken.promise.then(function onCanceled(cancel) {\n            if (!request) return;\n            request.abort();\n            reject(cancel);\n            // Clean up request\n            request = null;\n        });\n        if (!requestData) requestData = null;\n        // Send the request\n        request.send(requestData);\n    });\n};\n\n},{\"./../utils\":\"hnkFL\",\"./../core/settle\":\"41CT5\",\"./../helpers/cookies\":\"jeRHS\",\"./../helpers/buildURL\":\"fy0cx\",\"../core/buildFullPath\":\"8igPT\",\"./../helpers/parseHeaders\":\"gA7yq\",\"./../helpers/isURLSameOrigin\":\"9z18v\",\"../core/createError\":\"k3KqI\"}],\"41CT5\":[function(require,module,exports) {\n\"use strict\";\nvar createError = require(\"./createError\");\n/**\n * Resolve or reject a Promise based on response status.\n *\n * @param {Function} resolve A function that resolves the promise.\n * @param {Function} reject A function that rejects the promise.\n * @param {object} response The response.\n */ module.exports = function settle(resolve, reject, response) {\n    var validateStatus = response.config.validateStatus;\n    if (!response.status || !validateStatus || validateStatus(response.status)) resolve(response);\n    else reject(createError(\"Request failed with status code \" + response.status, response.config, null, response.request, response));\n};\n\n},{\"./createError\":\"k3KqI\"}],\"k3KqI\":[function(require,module,exports) {\n\"use strict\";\nvar enhanceError = require(\"./enhanceError\");\n/**\n * Create an Error with the specified message, config, error code, request and response.\n *\n * @param {string} message The error message.\n * @param {Object} config The config.\n * @param {string} [code] The error code (for example, 'ECONNABORTED').\n * @param {Object} [request] The request.\n * @param {Object} [response] The response.\n * @returns {Error} The created error.\n */ module.exports = function createError(message, config, code, request, response) {\n    var error = new Error(message);\n    return enhanceError(error, config, code, request, response);\n};\n\n},{\"./enhanceError\":\"cJwKH\"}],\"jeRHS\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nmodule.exports = utils.isStandardBrowserEnv() ? // Standard browser envs support document.cookie\nfunction standardBrowserEnv() {\n    return {\n        write: function write(name, value, expires, path, domain, secure) {\n            var cookie = [];\n            cookie.push(name + \"=\" + encodeURIComponent(value));\n            if (utils.isNumber(expires)) cookie.push(\"expires=\" + new Date(expires).toGMTString());\n            if (utils.isString(path)) cookie.push(\"path=\" + path);\n            if (utils.isString(domain)) cookie.push(\"domain=\" + domain);\n            if (secure === true) cookie.push(\"secure\");\n            document.cookie = cookie.join(\"; \");\n        },\n        read: function read(name) {\n            var match = document.cookie.match(new RegExp(\"(^|;\\\\s*)(\" + name + \")=([^;]*)\"));\n            return match ? decodeURIComponent(match[3]) : null;\n        },\n        remove: function remove(name) {\n            this.write(name, \"\", Date.now() - 86400000);\n        }\n    };\n}() : // Non standard browser env (web workers, react-native) lack needed support.\nfunction nonStandardBrowserEnv() {\n    return {\n        write: function write() {},\n        read: function read() {\n            return null;\n        },\n        remove: function remove() {}\n    };\n}();\n\n},{\"./../utils\":\"hnkFL\"}],\"8igPT\":[function(require,module,exports) {\n\"use strict\";\nvar isAbsoluteURL = require(\"../helpers/isAbsoluteURL\");\nvar combineURLs = require(\"../helpers/combineURLs\");\n/**\n * Creates a new URL by combining the baseURL with the requestedURL,\n * only when the requestedURL is not already an absolute URL.\n * If the requestURL is absolute, this function returns the requestedURL untouched.\n *\n * @param {string} baseURL The base URL\n * @param {string} requestedURL Absolute or relative URL to combine\n * @returns {string} The combined full path\n */ module.exports = function buildFullPath(baseURL, requestedURL) {\n    if (baseURL && !isAbsoluteURL(requestedURL)) return combineURLs(baseURL, requestedURL);\n    return requestedURL;\n};\n\n},{\"../helpers/isAbsoluteURL\":\"h9csh\",\"../helpers/combineURLs\":\"lUxsE\"}],\"h9csh\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Determines whether the specified URL is absolute\n *\n * @param {string} url The URL to test\n * @returns {boolean} True if the specified URL is absolute, otherwise false\n */ module.exports = function isAbsoluteURL(url) {\n    // A URL is considered absolute if it begins with \"<scheme>://\" or \"//\" (protocol-relative URL).\n    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed\n    // by any combination of letters, digits, plus, period, or hyphen.\n    return /^([a-z][a-z\\d\\+\\-\\.]*:)?\\/\\//i.test(url);\n};\n\n},{}],\"lUxsE\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Creates a new URL by combining the specified URLs\n *\n * @param {string} baseURL The base URL\n * @param {string} relativeURL The relative URL\n * @returns {string} The combined URL\n */ module.exports = function combineURLs(baseURL, relativeURL) {\n    return relativeURL ? baseURL.replace(/\\/+$/, \"\") + \"/\" + relativeURL.replace(/^\\/+/, \"\") : baseURL;\n};\n\n},{}],\"gA7yq\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\n// Headers whose duplicates are ignored by node\n// c.f. https://nodejs.org/api/http.html#http_message_headers\nvar ignoreDuplicateOf = [\n    \"age\",\n    \"authorization\",\n    \"content-length\",\n    \"content-type\",\n    \"etag\",\n    \"expires\",\n    \"from\",\n    \"host\",\n    \"if-modified-since\",\n    \"if-unmodified-since\",\n    \"last-modified\",\n    \"location\",\n    \"max-forwards\",\n    \"proxy-authorization\",\n    \"referer\",\n    \"retry-after\",\n    \"user-agent\"\n];\n/**\n * Parse headers into an object\n *\n * ```\n * Date: Wed, 27 Aug 2014 08:58:49 GMT\n * Content-Type: application/json\n * Connection: keep-alive\n * Transfer-Encoding: chunked\n * ```\n *\n * @param {String} headers Headers needing to be parsed\n * @returns {Object} Headers parsed into an object\n */ module.exports = function parseHeaders(headers) {\n    var parsed = {};\n    var key;\n    var val;\n    var i;\n    if (!headers) return parsed;\n    utils.forEach(headers.split(\"\\n\"), function parser(line) {\n        i = line.indexOf(\":\");\n        key = utils.trim(line.substr(0, i)).toLowerCase();\n        val = utils.trim(line.substr(i + 1));\n        if (key) {\n            if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) return;\n            if (key === \"set-cookie\") parsed[key] = (parsed[key] ? parsed[key] : []).concat([\n                val\n            ]);\n            else parsed[key] = parsed[key] ? parsed[key] + \", \" + val : val;\n        }\n    });\n    return parsed;\n};\n\n},{\"./../utils\":\"hnkFL\"}],\"9z18v\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"./../utils\");\nmodule.exports = utils.isStandardBrowserEnv() ? // Standard browser envs have full support of the APIs needed to test\n// whether the request URL is of the same origin as current location.\nfunction standardBrowserEnv() {\n    var msie = /(msie|trident)/i.test(navigator.userAgent);\n    var urlParsingNode = document.createElement(\"a\");\n    var originURL;\n    /**\n    * Parse a URL to discover it's components\n    *\n    * @param {String} url The URL to be parsed\n    * @returns {Object}\n    */ function resolveURL(url) {\n        var href = url;\n        if (msie) {\n            // IE needs attribute set twice to normalize properties\n            urlParsingNode.setAttribute(\"href\", href);\n            href = urlParsingNode.href;\n        }\n        urlParsingNode.setAttribute(\"href\", href);\n        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils\n        return {\n            href: urlParsingNode.href,\n            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, \"\") : \"\",\n            host: urlParsingNode.host,\n            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\\?/, \"\") : \"\",\n            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, \"\") : \"\",\n            hostname: urlParsingNode.hostname,\n            port: urlParsingNode.port,\n            pathname: urlParsingNode.pathname.charAt(0) === \"/\" ? urlParsingNode.pathname : \"/\" + urlParsingNode.pathname\n        };\n    }\n    originURL = resolveURL(window.location.href);\n    /**\n    * Determine if a URL shares the same origin as the current location\n    *\n    * @param {String} requestURL The URL to test\n    * @returns {boolean} True if URL shares the same origin, otherwise false\n    */ return function isURLSameOrigin(requestURL) {\n        var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;\n        return parsed.protocol === originURL.protocol && parsed.host === originURL.host;\n    };\n}() : // Non standard browser envs (web workers, react-native) lack needed support.\nfunction nonStandardBrowserEnv() {\n    return function isURLSameOrigin() {\n        return true;\n    };\n}();\n\n},{\"./../utils\":\"hnkFL\"}],\"a2h6U\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function isCancel(value) {\n    return !!(value && value.__CANCEL__);\n};\n\n},{}],\"cpLHT\":[function(require,module,exports) {\n\"use strict\";\nvar utils = require(\"../utils\");\n/**\n * Config-specific merge-function which creates a new config-object\n * by merging two configuration objects together.\n *\n * @param {Object} config1\n * @param {Object} config2\n * @returns {Object} New object resulting from merging config2 to config1\n */ module.exports = function mergeConfig(config1, config2) {\n    // eslint-disable-next-line no-param-reassign\n    config2 = config2 || {};\n    var config = {};\n    var valueFromConfig2Keys = [\n        \"url\",\n        \"method\",\n        \"data\"\n    ];\n    var mergeDeepPropertiesKeys = [\n        \"headers\",\n        \"auth\",\n        \"proxy\",\n        \"params\"\n    ];\n    var defaultToConfig2Keys = [\n        \"baseURL\",\n        \"transformRequest\",\n        \"transformResponse\",\n        \"paramsSerializer\",\n        \"timeout\",\n        \"timeoutMessage\",\n        \"withCredentials\",\n        \"adapter\",\n        \"responseType\",\n        \"xsrfCookieName\",\n        \"xsrfHeaderName\",\n        \"onUploadProgress\",\n        \"onDownloadProgress\",\n        \"decompress\",\n        \"maxContentLength\",\n        \"maxBodyLength\",\n        \"maxRedirects\",\n        \"transport\",\n        \"httpAgent\",\n        \"httpsAgent\",\n        \"cancelToken\",\n        \"socketPath\",\n        \"responseEncoding\"\n    ];\n    var directMergeKeys = [\n        \"validateStatus\"\n    ];\n    function getMergedValue(target, source) {\n        if (utils.isPlainObject(target) && utils.isPlainObject(source)) return utils.merge(target, source);\n        else if (utils.isPlainObject(source)) return utils.merge({}, source);\n        else if (utils.isArray(source)) return source.slice();\n        return source;\n    }\n    function mergeDeepProperties(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(config1[prop], config2[prop]);\n        else if (!utils.isUndefined(config1[prop])) config[prop] = getMergedValue(undefined, config1[prop]);\n    }\n    utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(undefined, config2[prop]);\n    });\n    utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);\n    utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {\n        if (!utils.isUndefined(config2[prop])) config[prop] = getMergedValue(undefined, config2[prop]);\n        else if (!utils.isUndefined(config1[prop])) config[prop] = getMergedValue(undefined, config1[prop]);\n    });\n    utils.forEach(directMergeKeys, function merge(prop) {\n        if (prop in config2) config[prop] = getMergedValue(config1[prop], config2[prop]);\n        else if (prop in config1) config[prop] = getMergedValue(undefined, config1[prop]);\n    });\n    var axiosKeys = valueFromConfig2Keys.concat(mergeDeepPropertiesKeys).concat(defaultToConfig2Keys).concat(directMergeKeys);\n    var otherKeys = Object.keys(config1).concat(Object.keys(config2)).filter(function filterAxiosKeys(key) {\n        return axiosKeys.indexOf(key) === -1;\n    });\n    utils.forEach(otherKeys, mergeDeepProperties);\n    return config;\n};\n\n},{\"../utils\":\"hnkFL\"}],\"2WhhG\":[function(require,module,exports) {\n\"use strict\";\nvar pkg = require(\"./../../package.json\");\nvar validators = {};\n// eslint-disable-next-line func-names\n[\n    \"object\",\n    \"boolean\",\n    \"number\",\n    \"function\",\n    \"string\",\n    \"symbol\"\n].forEach(function(type, i) {\n    validators[type] = function validator(thing) {\n        return typeof thing === type || \"a\" + (i < 1 ? \"n \" : \" \") + type;\n    };\n});\nvar deprecatedWarnings = {};\nvar currentVerArr = pkg.version.split(\".\");\n/**\n * Compare package versions\n * @param {string} version\n * @param {string?} thanVersion\n * @returns {boolean}\n */ function isOlderVersion(version, thanVersion) {\n    var pkgVersionArr = thanVersion ? thanVersion.split(\".\") : currentVerArr;\n    var destVer = version.split(\".\");\n    for(var i = 0; i < 3; i++){\n        if (pkgVersionArr[i] > destVer[i]) return true;\n        else if (pkgVersionArr[i] < destVer[i]) return false;\n    }\n    return false;\n}\n/**\n * Transitional option validator\n * @param {function|boolean?} validator\n * @param {string?} version\n * @param {string} message\n * @returns {function}\n */ validators.transitional = function transitional(validator, version, message) {\n    var isDeprecated = version && isOlderVersion(version);\n    function formatMessage(opt, desc) {\n        return \"[Axios v\" + pkg.version + \"] Transitional option '\" + opt + \"'\" + desc + (message ? \". \" + message : \"\");\n    }\n    // eslint-disable-next-line func-names\n    return function(value, opt, opts) {\n        if (validator === false) throw new Error(formatMessage(opt, \" has been removed in \" + version));\n        if (isDeprecated && !deprecatedWarnings[opt]) {\n            deprecatedWarnings[opt] = true;\n            // eslint-disable-next-line no-console\n            console.warn(formatMessage(opt, \" has been deprecated since v\" + version + \" and will be removed in the near future\"));\n        }\n        return validator ? validator(value, opt, opts) : true;\n    };\n};\n/**\n * Assert object's properties type\n * @param {object} options\n * @param {object} schema\n * @param {boolean?} allowUnknown\n */ function assertOptions(options, schema, allowUnknown) {\n    if (typeof options !== \"object\") throw new TypeError(\"options must be an object\");\n    var keys = Object.keys(options);\n    var i = keys.length;\n    while(i-- > 0){\n        var opt = keys[i];\n        var validator = schema[opt];\n        if (validator) {\n            var value = options[opt];\n            var result = value === undefined || validator(value, opt, options);\n            if (result !== true) throw new TypeError(\"option \" + opt + \" must be \" + result);\n            continue;\n        }\n        if (allowUnknown !== true) throw Error(\"Unknown option \" + opt);\n    }\n}\nmodule.exports = {\n    isOlderVersion: isOlderVersion,\n    assertOptions: assertOptions,\n    validators: validators\n};\n\n},{\"./../../package.json\":\"eeUxD\"}],\"eeUxD\":[function(require,module,exports) {\nmodule.exports = JSON.parse('{\"name\":\"axios\",\"version\":\"0.21.4\",\"description\":\"Promise based HTTP client for the browser and node.js\",\"main\":\"index.js\",\"scripts\":{\"test\":\"grunt test\",\"start\":\"node ./sandbox/server.js\",\"build\":\"NODE_ENV=production grunt build\",\"preversion\":\"npm test\",\"version\":\"npm run build && grunt version && git add -A dist && git add CHANGELOG.md bower.json package.json\",\"postversion\":\"git push && git push --tags\",\"examples\":\"node ./examples/server.js\",\"coveralls\":\"cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js\",\"fix\":\"eslint --fix lib/**/*.js\"},\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/axios/axios.git\"},\"keywords\":[\"xhr\",\"http\",\"ajax\",\"promise\",\"node\"],\"author\":\"Matt Zabriskie\",\"license\":\"MIT\",\"bugs\":{\"url\":\"https://github.com/axios/axios/issues\"},\"homepage\":\"https://axios-http.com\",\"devDependencies\":{\"coveralls\":\"^3.0.0\",\"es6-promise\":\"^4.2.4\",\"grunt\":\"^1.3.0\",\"grunt-banner\":\"^0.6.0\",\"grunt-cli\":\"^1.2.0\",\"grunt-contrib-clean\":\"^1.1.0\",\"grunt-contrib-watch\":\"^1.0.0\",\"grunt-eslint\":\"^23.0.0\",\"grunt-karma\":\"^4.0.0\",\"grunt-mocha-test\":\"^0.13.3\",\"grunt-ts\":\"^6.0.0-beta.19\",\"grunt-webpack\":\"^4.0.2\",\"istanbul-instrumenter-loader\":\"^1.0.0\",\"jasmine-core\":\"^2.4.1\",\"karma\":\"^6.3.2\",\"karma-chrome-launcher\":\"^3.1.0\",\"karma-firefox-launcher\":\"^2.1.0\",\"karma-jasmine\":\"^1.1.1\",\"karma-jasmine-ajax\":\"^0.1.13\",\"karma-safari-launcher\":\"^1.0.0\",\"karma-sauce-launcher\":\"^4.3.6\",\"karma-sinon\":\"^1.0.5\",\"karma-sourcemap-loader\":\"^0.3.8\",\"karma-webpack\":\"^4.0.2\",\"load-grunt-tasks\":\"^3.5.2\",\"minimist\":\"^1.2.0\",\"mocha\":\"^8.2.1\",\"sinon\":\"^4.5.0\",\"terser-webpack-plugin\":\"^4.2.3\",\"typescript\":\"^4.0.5\",\"url-search-params\":\"^0.10.0\",\"webpack\":\"^4.44.2\",\"webpack-dev-server\":\"^3.11.0\"},\"browser\":{\"./lib/adapters/http.js\":\"./lib/adapters/xhr.js\"},\"jsdelivr\":\"dist/axios.min.js\",\"unpkg\":\"dist/axios.min.js\",\"typings\":\"./index.d.ts\",\"dependencies\":{\"follow-redirects\":\"^1.14.0\"},\"bundlesize\":[{\"path\":\"./dist/axios.min.js\",\"threshold\":\"5kB\"}]}');\n\n},{}],\"gnU4h\":[function(require,module,exports) {\n\"use strict\";\n/**\n * A `Cancel` is an object that is thrown when an operation is canceled.\n *\n * @class\n * @param {string=} message The message.\n */ function Cancel(message) {\n    this.message = message;\n}\nCancel.prototype.toString = function toString() {\n    return \"Cancel\" + (this.message ? \": \" + this.message : \"\");\n};\nCancel.prototype.__CANCEL__ = true;\nmodule.exports = Cancel;\n\n},{}],\"eIXu8\":[function(require,module,exports) {\n\"use strict\";\nvar Cancel = require(\"./Cancel\");\n/**\n * A `CancelToken` is an object that can be used to request cancellation of an operation.\n *\n * @class\n * @param {Function} executor The executor function.\n */ function CancelToken(executor) {\n    if (typeof executor !== \"function\") throw new TypeError(\"executor must be a function.\");\n    var resolvePromise;\n    this.promise = new Promise(function promiseExecutor(resolve) {\n        resolvePromise = resolve;\n    });\n    var token = this;\n    executor(function cancel(message) {\n        if (token.reason) // Cancellation has already been requested\n        return;\n        token.reason = new Cancel(message);\n        resolvePromise(token.reason);\n    });\n}\n/**\n * Throws a `Cancel` if cancellation has been requested.\n */ CancelToken.prototype.throwIfRequested = function throwIfRequested() {\n    if (this.reason) throw this.reason;\n};\n/**\n * Returns an object that contains a new `CancelToken` and a function that, when called,\n * cancels the `CancelToken`.\n */ CancelToken.source = function source() {\n    var cancel;\n    var token = new CancelToken(function executor(c) {\n        cancel = c;\n    });\n    return {\n        token: token,\n        cancel: cancel\n    };\n};\nmodule.exports = CancelToken;\n\n},{\"./Cancel\":\"gnU4h\"}],\"1nXwb\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Syntactic sugar for invoking a function and expanding an array for arguments.\n *\n * Common use case would be to use `Function.prototype.apply`.\n *\n *  ```js\n *  function f(x, y, z) {}\n *  var args = [1, 2, 3];\n *  f.apply(null, args);\n *  ```\n *\n * With `spread` this example can be re-written.\n *\n *  ```js\n *  spread(function(x, y, z) {})([1, 2, 3]);\n *  ```\n *\n * @param {Function} callback\n * @returns {Function}\n */ module.exports = function spread(callback) {\n    return function wrap(arr) {\n        return callback.apply(null, arr);\n    };\n};\n\n},{}],\"iFKJj\":[function(require,module,exports) {\n\"use strict\";\n/**\n * Determines whether the payload is an error thrown by Axios\n *\n * @param {*} payload The value to test\n * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false\n */ module.exports = function isAxiosError(payload) {\n    return typeof payload === \"object\" && payload.isAxiosError === true;\n};\n\n},{}],\"joKwd\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nfunction safeJsonParse(value) {\n    if (typeof value !== \"string\") throw new Error(`Cannot safe json parse value of type ${typeof value}`);\n    try {\n        return JSON.parse(value);\n    } catch (_a) {\n        return value;\n    }\n}\nexports.safeJsonParse = safeJsonParse;\nfunction safeJsonStringify(value1) {\n    return typeof value1 === \"string\" ? value1 : JSON.stringify(value1, (key, value)=>typeof value === \"undefined\" ? null : value);\n}\nexports.safeJsonStringify = safeJsonStringify;\n\n},{}],\"9Then\":[function(require,module,exports) {\n\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.isLocalhostUrl = exports.isWsUrl = exports.isHttpUrl = void 0;\nconst HTTP_REGEX = \"^https?:\";\nconst WS_REGEX = \"^wss?:\";\nfunction getUrlProtocol(url) {\n    const matches = url.match(new RegExp(/^\\w+:/, \"gi\"));\n    if (!matches || !matches.length) return;\n    return matches[0];\n}\nfunction matchRegexProtocol(url, regex) {\n    const protocol = getUrlProtocol(url);\n    if (typeof protocol === \"undefined\") return false;\n    return new RegExp(regex).test(protocol);\n}\nfunction isHttpUrl(url) {\n    return matchRegexProtocol(url, HTTP_REGEX);\n}\nexports.isHttpUrl = isHttpUrl;\nfunction isWsUrl(url) {\n    return matchRegexProtocol(url, WS_REGEX);\n}\nexports.isWsUrl = isWsUrl;\nfunction isLocalhostUrl(url) {\n    return new RegExp(\"wss?://localhost(:d{2,5})?\").test(url);\n}\nexports.isLocalhostUrl = isLocalhostUrl;\n\n},{}],\"aknY6\":[function(require,module,exports) {\n\"use strict\";\nvar global = arguments[3];\nObject.defineProperty(exports, \"__esModule\", {\n    value: true\n});\nexports.WsConnection = void 0;\nconst tslib_1 = require(\"tslib\");\nconst events_1 = require(\"events\");\nconst safe_json_utils_1 = require(\"safe-json-utils\");\nconst utils_1 = require(\"@json-rpc-tools/utils\");\nconst url_1 = require(\"./url\");\nconst WS = typeof global.WebSocket !== \"undefined\" ? global.WebSocket : require(\"ws\");\nclass WsConnection {\n    constructor(url){\n        this.url = url;\n        this.events = new events_1.EventEmitter();\n        this.registering = false;\n        if (!url_1.isWsUrl(url)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${url}`);\n        this.url = url;\n    }\n    get connected() {\n        return typeof this.socket !== \"undefined\";\n    }\n    get connecting() {\n        return this.registering;\n    }\n    on(event, listener) {\n        this.events.on(event, listener);\n    }\n    once(event, listener) {\n        this.events.once(event, listener);\n    }\n    off(event, listener) {\n        this.events.off(event, listener);\n    }\n    removeListener(event, listener) {\n        this.events.removeListener(event, listener);\n    }\n    open(url = this.url) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            this.socket = yield this.register(url);\n        });\n    }\n    close() {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.socket === \"undefined\") throw new Error(\"Already disconnected\");\n            this.socket.close();\n            this.onClose();\n        });\n    }\n    send(payload, context) {\n        return tslib_1.__awaiter(this, void 0, void 0, function*() {\n            if (typeof this.socket === \"undefined\") this.socket = yield this.register();\n            this.socket.send(safe_json_utils_1.safeJsonStringify(payload));\n        });\n    }\n    register(url = this.url) {\n        if (!url_1.isWsUrl(url)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${url}`);\n        if (this.registering) return new Promise((resolve, reject)=>{\n            this.events.once(\"open\", ()=>{\n                if (typeof this.socket === \"undefined\") return reject(new Error(\"WebSocket connection is missing or invalid\"));\n                resolve(this.socket);\n            });\n        });\n        this.url = url;\n        this.registering = true;\n        return new Promise((resolve, reject)=>{\n            const opts = !utils_1.isReactNative() ? {\n                rejectUnauthorized: !url_1.isLocalhostUrl(url)\n            } : undefined;\n            const socket = new WS(url, [], opts);\n            socket.onopen = ()=>{\n                this.onOpen(socket);\n                resolve(socket);\n            };\n            socket.onerror = (event)=>{\n                this.events.emit(\"error\", event);\n                reject(event);\n            };\n        });\n    }\n    onOpen(socket) {\n        socket.onmessage = (event)=>this.onPayload(event);\n        socket.onclose = ()=>this.onClose();\n        this.socket = socket;\n        this.registering = false;\n        this.events.emit(\"open\");\n    }\n    onClose() {\n        this.socket = undefined;\n        this.events.emit(\"close\");\n    }\n    onPayload(e) {\n        if (typeof e.data === \"undefined\") return;\n        const payload = typeof e.data === \"string\" ? safe_json_utils_1.safeJsonParse(e.data) : e.data;\n        this.events.emit(\"payload\", payload);\n    }\n}\nexports.WsConnection = WsConnection;\n\n},{\"tslib\":\"hdsRu\",\"events\":\"eDevp\",\"safe-json-utils\":\"joKwd\",\"@json-rpc-tools/utils\":\"h6aFv\",\"./url\":\"9Then\",\"ws\":\"10vDB\"}],\"10vDB\":[function(require,module,exports) {\n\"use strict\";\nmodule.exports = function() {\n    throw new Error(\"ws does not work in the browser. Browser clients must use the native WebSocket object\");\n};\n\n},{}],\"deOoS\":[function(require,module,exports) {\nvar parcelHelpers = require(\"@parcel/transformer-js/src/esmodule-helpers.js\");\nparcelHelpers.defineInteropFlag(exports);\nparcelHelpers.export(exports, \"Connection\", ()=>Connection);\nvar _events = require(\"events\");\nvar _eventsDefault = parcelHelpers.interopDefault(_events);\nvar _utils = require(\"@json-rpc-tools/utils\");\nclass Connection extends (0, _eventsDefault.default) {\n    events = new (0, _eventsDefault.default)();\n    connected = false;\n    connecting = false;\n    constructor(broadcastChannel){\n        super();\n        this.broadcastChannel = broadcastChannel;\n        this.broadcastChannel.addEventListener(\"message\", (event)=>{\n            if (event.data?.type === \"ethereumEvent\") this.emit(\"ethereumEvent\", {\n                event: event.data.event,\n                value: event.data.value\n            });\n            else this.emit(\"payload\", event.data);\n        });\n    }\n    async open() {\n        return Promise.resolve().then(()=>{\n            this.connected = true;\n        });\n    }\n    async close() {\n        return Promise.resolve();\n    }\n    send(payload) {\n        this.broadcastChannel.postMessage(payload);\n        return this.getPromise(payload.id);\n    }\n    getPromise(id) {\n        return new Promise((resolve, reject)=>{\n            const handler = (event)=>{\n                const { data  } = event;\n                if (data.id === id && (0, _utils.isJsonRpcResponse)(data)) {\n                    if ((0, _utils.isJsonRpcError)(data)) reject(data.error);\n                    else resolve(data.result);\n                    this.broadcastChannel.removeEventListener(\"message\", handler);\n                }\n            };\n            this.broadcastChannel.addEventListener(\"message\", handler);\n        });\n    }\n}\n\n},{\"events\":\"eDevp\",\"@json-rpc-tools/utils\":\"h6aFv\",\"@parcel/transformer-js/src/esmodule-helpers.js\":\"boKlo\"}]},[\"qFYh4\"], \"qFYh4\", \"parcelRequire7f4b\")\n\n";

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
    /* webextension-polyfill - v0.9.0 - Fri Mar 25 2022 17:00:23 */ /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */ /* vim: set sts=2 sw=2 et tw=80: */ /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */ "use strict";
    if (typeof globalThis != "object" || typeof chrome != "object" || !chrome || !chrome.runtime || !chrome.runtime.id) throw new Error("This script should only be loaded in a browser extension.");
    if (typeof globalThis.browser === "undefined" || Object.getPrototypeOf(globalThis.browser) !== Object.prototype) {
        const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
        const SEND_RESPONSE_DEPRECATION_WARNING = "Returning a Promise is the preferred way to send a reply from an onMessage/onMessageExternal listener, as the sendResponse will be removed from the specs (See https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)"; // Wrapping the bulk of this polyfill in a one-time-use function is a minor
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
            }); // Keep track if the deprecation warning has been logged at least once.
            let loggedSendResponseDeprecationWarning = false;
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
                            if (!loggedSendResponseDeprecationWarning) {
                                console.warn(SEND_RESPONSE_DEPRECATION_WARNING, new Error().stack);
                                loggedSendResponseDeprecationWarning = true;
                            }
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

},{}]},["iRTcc"], "iRTcc", "parcelRequire7f4b")

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFBQyxTQUFTO2dCQUNqRDtvQkFDSSxJQUFJLENBQUUsQ0FBQSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUEsQUFBQyxJQUFLLENBQUEsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsRUFBRTt3QkFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUFDLFNBQVM7cUJBQUU7b0JBQzVHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSyxDQUFBLENBQUMsQ0FBQyxJQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFBQyxDQUFBLEFBQUMsRUFBRTt3QkFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFBQyxNQUFNO3FCQUFFO29CQUN0RixJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFBQyxNQUFNO3FCQUFFO29CQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFBQyxDQUFDLENBQUMsR0FBRyxDQUFD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QyxLQUFLLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBRXhDLE9BQU87WUFDTCxLQUFLLEVBQUUsS0FBSztZQUNaLEtBQUssRUFBRSxDQUFBLHlDQUFBLEVBQTRDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFBLENBQUU7U0FDekUsQ0FBQztLQUVMO0lBQ0QsT0FBTztRQUFFLEtBQUssRUFBRSxJQUFJO0tBQUUsQ0FBQztDQUN4QjtBQTFCRCxPQUFBLENBQUEsb0JBQUEsR0FBQSxvQkFBQSxDQTBCQzs7O0EsWSxDO0EsTSxDLGMsQyxPLEUsWSxFO0ksSyxFLEk7QyxDLEM7QSxPLEMsUSxHLEssQyxDO0EsTSxPLEcsTyxDLE8sQyxBO0FFOURELE1BQUEsYUFBQSxHQUFBLE9BQUEsQ0FBQSx1QkFBQSxDQUFBLEFBQStDO0FBR2xDLE9BQUEsQ0FBQSxRQUFRLEdBQUcsYUFBQSxDQUFBLE1BQU0sQ0FBQztBQUUvQixPQUFBLENBQUEsWUFBQSxDQUFBLE9BQUEsQ0FBQSx1QkFBQSxDQUFBLEVBQUEsT0FBQSxDQUFBLENBQXNDOzs7QSxZLEM7QSxJLGUsRyxBLEksSSxJLEMsZSxJLEMsTSxDLE0sRyxTLEMsRSxDLEUsQyxFLEUsRTtJLEksRSxLLFMsRSxFLEcsQyxDO0ksTSxDLGMsQyxDLEUsRSxFO1EsVSxFLEk7USxHLEUsVztZLE8sQyxDLEMsQyxDO1M7SyxDLEM7QyxHLFMsQyxFLEMsRSxDLEUsRSxFO0ksSSxFLEssUyxFLEUsRyxDLEM7SSxDLEMsRSxDLEcsQyxDLEMsQyxDO0MsQSxDLEEsQTtBLEksWSxHLEEsSSxJLEksQyxZLEksUyxDLEUsTyxFO0ksSSxJLEMsSSxDLEMsSSxDLEssUyxJLEMsTyxDLGMsQyxDLEMsRSxlLEMsTyxFLEMsRSxDLEMsQztDLEE7QSxNLEMsYyxDLE8sRSxZLEU7SSxLLEUsSTtDLEMsQztBRUx0QyxZQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsQ0FBQSxFQUFBLE9BQUEsQ0FBQSxDQUF5QjtBQUN6QixZQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxF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eUUsZUFBZSxHQUFHO2dCQUN0QkMsS0FBSyxFQUFFO29CQUFDM0UsT0FBTyxFQUFFLENBQVY7b0JBQWFDLE9BQU8sRUFBRSxDQUFUQTtpQkFERTtnQkFFdEJ4QixHQUFHLEVBQUU7b0JBQUN1QixPQUFPLEVBQUUsQ0FBVjtvQkFBYUMsT0FBTyxFQUFFLENBQVRBO2lCQUZJO2dCQUd0QnJCLEdBQUcsRUFBRTtvQkFBQ29CLE9BQU8sRUFBRSxDQUFWO29CQUFhQyxPQUFPLEVBQUUsQ0FBVEE7aUJBQWI7YUFIUCxBQUF3QjtZQUt4QmpDLFdBQVcsQ0FBQzRHLE9BQVosR0FBc0I7Z0JBQ3BCTCxPQUFPLEVBQUU7b0JBQUMsR0FBQSxFQUFLRyxlQUFMO2lCQURVO2dCQUVwQkcsUUFBUSxFQUFFO29CQUFDLEdBQUEsRUFBS0gsZUFBTDtpQkFGUztnQkFHcEJJLFFBQVEsRUFBRTtvQkFBQyxHQUFBLEVBQUtKLGVBQUw7aUJBQUQ7YUFIWixDQUFzQjtZQU10QixPQUFPdkQsVUFBVSxDQUFDcEQsYUFBRCxFQUFnQnNHLGNBQWhCLEVBQWdDckcsV0FBaEMsQ0FBakIsQ0FBQTtTQXpxQ0YsQUFUK0csRUFxckMvRyx5RUFGQztRQUdELCtCQUFBO1FBQ0ErRyxNQUFNLENBQUNDLE9BQVAsR0FBaUJsSCxRQUFRLENBQUNWLE1BQUQsQ0FBekIsQ0FBQTJIO0tBdnJDRixNQXlyQ0VBLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjdILFVBQVUsQ0FBQ0ssT0FBNUIsQ0FBQXVIO0MsQyxDIiwic291cmNlcyI6WyJzcmMvY29udGVudC1zY3JpcHQvaW5kZXgudHMiLCJub2RlX21vZHVsZXMvbmFub2lkL2luZGV4LmJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvbmFub2lkL3VybC1hbHBoYWJldC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcGFyY2VsL3RyYW5zZm9ybWVyLWpzL3NyYy9lc21vZHVsZS1oZWxwZXJzLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL2luZGV4LnRzIiwibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvY29uc3RhbnRzLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvY29uc3RhbnRzLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9lcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL2Vycm9yLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9lbnYuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL3NyYy9lbnYudHMiLCJub2RlX21vZHVsZXMvQHBlZHJvdWlkL2Vudmlyb25tZW50L2Rpc3QvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BwZWRyb3VpZC9lbnZpcm9ubWVudC9zcmMvaW5kZXgudHMiLCJub2RlX21vZHVsZXMvQHBlZHJvdWlkL2Vudmlyb25tZW50L2Rpc3QvY2pzL2NyeXB0by5qcyIsIm5vZGVfbW9kdWxlcy9AcGVkcm91aWQvZW52aXJvbm1lbnQvc3JjL2NyeXB0by50cyIsIm5vZGVfbW9kdWxlcy9AcGVkcm91aWQvZW52aXJvbm1lbnQvZGlzdC9janMvZW52LmpzIiwibm9kZV9tb2R1bGVzL0BwZWRyb3VpZC9lbnZpcm9ubWVudC9zcmMvZW52LnRzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvZm9ybWF0LmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvZm9ybWF0LnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9kaXN0L2Nqcy9yb3V0aW5nLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy91dGlscy9zcmMvcm91dGluZy50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3V0aWxzL3NyYy90eXBlcy50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9pbmRleC50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvYmxvY2tjaGFpbi5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL2Jsb2NrY2hhaW4udHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL2Rpc3QvY2pzL21pc2MuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9taXNjLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9wcm92aWRlci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL3Byb3ZpZGVyLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9qc29ucnBjLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9zcmMvanNvbnJwYy50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvbXVsdGkuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9tdWx0aS50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvZGlzdC9janMvcm91dGVyLmpzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9zcmMvcm91dGVyLnRzIiwibm9kZV9tb2R1bGVzL0Bqc29uLXJwYy10b29scy90eXBlcy9kaXN0L2Nqcy9zY2hlbWEuanMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL3NyYy9zY2hlbWEudHMiLCJub2RlX21vZHVsZXMvQGpzb24tcnBjLXRvb2xzL3R5cGVzL2Rpc3QvY2pzL3ZhbGlkYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdHlwZXMvc3JjL3ZhbGlkYXRvci50cyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvZGlzdC9janMvdmFsaWRhdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9AanNvbi1ycGMtdG9vbHMvdXRpbHMvc3JjL3ZhbGlkYXRvcnMudHMiLCJub2RlX21vZHVsZXMvQHBhcmNlbC9ydW50aW1lLWpzL2xpYi9idW5kbGVzL3J1bnRpbWUtNjc2YTE2NTc2YTIwNzdkMC5qcyIsIm5vZGVfbW9kdWxlcy93ZWJleHRlbnNpb24tcG9seWZpbGwvZGlzdC9icm93c2VyLXBvbHlmaWxsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG5hbm9pZCB9IGZyb20gJ25hbm9pZCc7XG5pbXBvcnQgYnJvd3NlciBmcm9tICd3ZWJleHRlbnNpb24tcG9seWZpbGwnO1xuaW1wb3J0IHsgaXNKc29uUnBjUmVxdWVzdCwgaXNKc29uUnBjUmVzcG9uc2UgfSBmcm9tICdAanNvbi1ycGMtdG9vbHMvdXRpbHMnO1xuLy8gQHRzLWlnbm9yZSBwYXJjZWwgc3ludGF4IGZvciBpbmxpbmluZzogaHR0cHM6Ly9wYXJjZWxqcy5vcmcvZmVhdHVyZXMvYnVuZGxlLWlubGluaW5nLyNpbmxpbmluZy1hLWJ1bmRsZS1hcy10ZXh0XG5pbXBvcnQgaW5QYWdlQ29udGVudCBmcm9tICdidW5kbGUtdGV4dDouL2luLXBhZ2UnO1xuXG5jb25zdCBpZCA9IG5hbm9pZCgpO1xuXG5jb25zdCBicm9hZGNhc3RDaGFubmVsID0gbmV3IEJyb2FkY2FzdENoYW5uZWwoaWQpO1xuXG5jb25zdCBwb3J0ID0gYnJvd3Nlci5ydW50aW1lLmNvbm5lY3Qoe1xuICBuYW1lOiBgJHticm93c2VyLnJ1bnRpbWUuaWR9L2V0aGVyZXVtYCxcbn0pO1xuXG5wb3J0Lm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobXNnKSA9PiB7XG4gIGlmIChpc0pzb25ScGNSZXNwb25zZShtc2cpKSB7XG4gICAgYnJvYWRjYXN0Q2hhbm5lbC5wb3N0TWVzc2FnZShtc2cpO1xuICB9IGVsc2UgaWYgKG1zZy50eXBlID09PSAnZXRoZXJldW1FdmVudCcpIHtcbiAgICBicm9hZGNhc3RDaGFubmVsLnBvc3RNZXNzYWdlKG1zZyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ2lnbm9yZWQgbWVzc2FnZScpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgfVxufSk7XG5cbmJyb2FkY2FzdENoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICBjb25zdCB7IGRhdGEgfSA9IGV2ZW50O1xuICBpZiAoaXNKc29uUnBjUmVxdWVzdChkYXRhKSkge1xuICAgIHBvcnQucG9zdE1lc3NhZ2UoZGF0YSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ25vdCBhIEpzb25ScGNSZXF1ZXN0Jyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICB9XG59KTtcblxuLy8gSW5zZXJ0IHNjcmlwdCB3aXRoIGV0aGVyZXVtIHByb3ZpZGVyIF9hZnRlcl8gY3JlYXRpbmcgYSBCcm9hZGNhc3RDaGFubmVsXG5sZXQgY29udGVudCA9IGB3aW5kb3cubXlXYWxsZXRDaGFubmVsSWQgPSBcIiR7aWR9XCI7O2A7XG5jb250ZW50ICs9IGluUGFnZUNvbnRlbnQ7XG5cbmNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuc2NyaXB0LnRleHRDb250ZW50ID0gY29udGVudDtcbnNjcmlwdC5kYXRhc2V0LndhbGxldEV4dGVuc2lvbiA9ICd0cnVlJztcblxuY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5jb250YWluZXIuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiIsImltcG9ydCB7IHVybEFscGhhYmV0IH0gZnJvbSAnLi91cmwtYWxwaGFiZXQvaW5kZXguanMnXG5sZXQgcmFuZG9tID0gYnl0ZXMgPT4gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShieXRlcykpXG5sZXQgY3VzdG9tUmFuZG9tID0gKGFscGhhYmV0LCBkZWZhdWx0U2l6ZSwgZ2V0UmFuZG9tKSA9PiB7XG4gIGxldCBtYXNrID0gKDIgPDwgKE1hdGgubG9nKGFscGhhYmV0Lmxlbmd0aCAtIDEpIC8gTWF0aC5MTjIpKSAtIDFcbiAgbGV0IHN0ZXAgPSAtfigoMS42ICogbWFzayAqIGRlZmF1bHRTaXplKSAvIGFscGhhYmV0Lmxlbmd0aClcbiAgcmV0dXJuIChzaXplID0gZGVmYXVsdFNpemUpID0+IHtcbiAgICBsZXQgaWQgPSAnJ1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBsZXQgYnl0ZXMgPSBnZXRSYW5kb20oc3RlcClcbiAgICAgIGxldCBqID0gc3RlcFxuICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICBpZCArPSBhbHBoYWJldFtieXRlc1tqXSAmIG1hc2tdIHx8ICcnXG4gICAgICAgIGlmIChpZC5sZW5ndGggPT09IHNpemUpIHJldHVybiBpZFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxubGV0IGN1c3RvbUFscGhhYmV0ID0gKGFscGhhYmV0LCBzaXplID0gMjEpID0+XG4gIGN1c3RvbVJhbmRvbShhbHBoYWJldCwgc2l6ZSwgcmFuZG9tKVxubGV0IG5hbm9pZCA9IChzaXplID0gMjEpID0+XG4gIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoc2l6ZSkpLnJlZHVjZSgoaWQsIGJ5dGUpID0+IHtcbiAgICBieXRlICY9IDYzXG4gICAgaWYgKGJ5dGUgPCAzNikge1xuICAgICAgaWQgKz0gYnl0ZS50b1N0cmluZygzNilcbiAgICB9IGVsc2UgaWYgKGJ5dGUgPCA2Mikge1xuICAgICAgaWQgKz0gKGJ5dGUgLSAyNikudG9TdHJpbmcoMzYpLnRvVXBwZXJDYXNlKClcbiAgICB9IGVsc2UgaWYgKGJ5dGUgPiA2Mikge1xuICAgICAgaWQgKz0gJy0nXG4gICAgfSBlbHNlIHtcbiAgICAgIGlkICs9ICdfJ1xuICAgIH1cbiAgICByZXR1cm4gaWRcbiAgfSwgJycpXG5leHBvcnQgeyBuYW5vaWQsIGN1c3RvbUFscGhhYmV0LCBjdXN0b21SYW5kb20sIHVybEFscGhhYmV0LCByYW5kb20gfVxuIiwibGV0IHVybEFscGhhYmV0ID1cbiAgJ3VzZWFuZG9tLTI2VDE5ODM0MFBYNzVweEpBQ0tWRVJZTUlOREJVU0hXT0xGX0dRWmJmZ2hqa2xxdnd5enJpY3QnXG5leHBvcnQgeyB1cmxBbHBoYWJldCB9XG4iLCJleHBvcnRzLmludGVyb3BEZWZhdWx0ID0gZnVuY3Rpb24gKGEpIHtcbiAgcmV0dXJuIGEgJiYgYS5fX2VzTW9kdWxlID8gYSA6IHtkZWZhdWx0OiBhfTtcbn07XG5cbmV4cG9ydHMuZGVmaW5lSW50ZXJvcEZsYWcgPSBmdW5jdGlvbiAoYSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYSwgJ19fZXNNb2R1bGUnLCB7dmFsdWU6IHRydWV9KTtcbn07XG5cbmV4cG9ydHMuZXhwb3J0QWxsID0gZnVuY3Rpb24gKHNvdXJjZSwgZGVzdCkge1xuICBPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIGlmIChrZXkgPT09ICdkZWZhdWx0JyB8fCBrZXkgPT09ICdfX2VzTW9kdWxlJyB8fCBkZXN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVzdCwga2V5LCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2Vba2V5XTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBkZXN0O1xufTtcblxuZXhwb3J0cy5leHBvcnQgPSBmdW5jdGlvbiAoZGVzdCwgZGVzdE5hbWUsIGdldCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVzdCwgZGVzdE5hbWUsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZ2V0LFxuICB9KTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9jb25zdGFudHNcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZXJyb3JcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZW52XCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2Zvcm1hdFwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9yb3V0aW5nXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3R5cGVzXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3ZhbGlkYXRvcnNcIiksIGV4cG9ydHMpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIixudWxsLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGlmICh0eXBlb2YgYiAhPT0gXCJmdW5jdGlvblwiICYmIGIgIT09IG51bGwpXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNsYXNzIGV4dGVuZHMgdmFsdWUgXCIgKyBTdHJpbmcoYikgKyBcIiBpcyBub3QgYSBjb25zdHJ1Y3RvciBvciBudWxsXCIpO1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgZGVzYyk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4oc3RhdGUsIHJlY2VpdmVyKSB7XHJcbiAgICBpZiAocmVjZWl2ZXIgPT09IG51bGwgfHwgKHR5cGVvZiByZWNlaXZlciAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcmVjZWl2ZXIgIT09IFwiZnVuY3Rpb25cIikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlICdpbicgb3BlcmF0b3Igb24gbm9uLW9iamVjdFwiKTtcclxuICAgIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNUQU5EQVJEX0VSUk9SX01BUCA9IGV4cG9ydHMuU0VSVkVSX0VSUk9SX0NPREVfUkFOR0UgPSBleHBvcnRzLlJFU0VSVkVEX0VSUk9SX0NPREVTID0gZXhwb3J0cy5TRVJWRVJfRVJST1IgPSBleHBvcnRzLklOVEVSTkFMX0VSUk9SID0gZXhwb3J0cy5JTlZBTElEX1BBUkFNUyA9IGV4cG9ydHMuTUVUSE9EX05PVF9GT1VORCA9IGV4cG9ydHMuSU5WQUxJRF9SRVFVRVNUID0gZXhwb3J0cy5QQVJTRV9FUlJPUiA9IHZvaWQgMDtcbmV4cG9ydHMuUEFSU0VfRVJST1IgPSBcIlBBUlNFX0VSUk9SXCI7XG5leHBvcnRzLklOVkFMSURfUkVRVUVTVCA9IFwiSU5WQUxJRF9SRVFVRVNUXCI7XG5leHBvcnRzLk1FVEhPRF9OT1RfRk9VTkQgPSBcIk1FVEhPRF9OT1RfRk9VTkRcIjtcbmV4cG9ydHMuSU5WQUxJRF9QQVJBTVMgPSBcIklOVkFMSURfUEFSQU1TXCI7XG5leHBvcnRzLklOVEVSTkFMX0VSUk9SID0gXCJJTlRFUk5BTF9FUlJPUlwiO1xuZXhwb3J0cy5TRVJWRVJfRVJST1IgPSBcIlNFUlZFUl9FUlJPUlwiO1xuZXhwb3J0cy5SRVNFUlZFRF9FUlJPUl9DT0RFUyA9IFstMzI3MDAsIC0zMjYwMCwgLTMyNjAxLCAtMzI2MDIsIC0zMjYwM107XG5leHBvcnRzLlNFUlZFUl9FUlJPUl9DT0RFX1JBTkdFID0gWy0zMjAwMCwgLTMyMDk5XTtcbmV4cG9ydHMuU1RBTkRBUkRfRVJST1JfTUFQID0ge1xuICAgIFtleHBvcnRzLlBBUlNFX0VSUk9SXTogeyBjb2RlOiAtMzI3MDAsIG1lc3NhZ2U6IFwiUGFyc2UgZXJyb3JcIiB9LFxuICAgIFtleHBvcnRzLklOVkFMSURfUkVRVUVTVF06IHsgY29kZTogLTMyNjAwLCBtZXNzYWdlOiBcIkludmFsaWQgUmVxdWVzdFwiIH0sXG4gICAgW2V4cG9ydHMuTUVUSE9EX05PVF9GT1VORF06IHsgY29kZTogLTMyNjAxLCBtZXNzYWdlOiBcIk1ldGhvZCBub3QgZm91bmRcIiB9LFxuICAgIFtleHBvcnRzLklOVkFMSURfUEFSQU1TXTogeyBjb2RlOiAtMzI2MDIsIG1lc3NhZ2U6IFwiSW52YWxpZCBwYXJhbXNcIiB9LFxuICAgIFtleHBvcnRzLklOVEVSTkFMX0VSUk9SXTogeyBjb2RlOiAtMzI2MDMsIG1lc3NhZ2U6IFwiSW50ZXJuYWwgZXJyb3JcIiB9LFxuICAgIFtleHBvcnRzLlNFUlZFUl9FUlJPUl06IHsgY29kZTogLTMyMDAwLCBtZXNzYWdlOiBcIlNlcnZlciBlcnJvclwiIH0sXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29uc3RhbnRzLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnZhbGlkYXRlSnNvblJwY0Vycm9yID0gZXhwb3J0cy5nZXRFcnJvckJ5Q29kZSA9IGV4cG9ydHMuZ2V0RXJyb3IgPSBleHBvcnRzLmlzVmFsaWRFcnJvckNvZGUgPSBleHBvcnRzLmlzUmVzZXJ2ZWRFcnJvckNvZGUgPSBleHBvcnRzLmlzU2VydmVyRXJyb3JDb2RlID0gdm9pZCAwO1xuY29uc3QgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5mdW5jdGlvbiBpc1NlcnZlckVycm9yQ29kZShjb2RlKSB7XG4gICAgcmV0dXJuIGNvZGUgPD0gY29uc3RhbnRzXzEuU0VSVkVSX0VSUk9SX0NPREVfUkFOR0VbMF0gJiYgY29kZSA+PSBjb25zdGFudHNfMS5TRVJWRVJfRVJST1JfQ09ERV9SQU5HRVsxXTtcbn1cbmV4cG9ydHMuaXNTZXJ2ZXJFcnJvckNvZGUgPSBpc1NlcnZlckVycm9yQ29kZTtcbmZ1bmN0aW9uIGlzUmVzZXJ2ZWRFcnJvckNvZGUoY29kZSkge1xuICAgIHJldHVybiBjb25zdGFudHNfMS5SRVNFUlZFRF9FUlJPUl9DT0RFUy5pbmNsdWRlcyhjb2RlKTtcbn1cbmV4cG9ydHMuaXNSZXNlcnZlZEVycm9yQ29kZSA9IGlzUmVzZXJ2ZWRFcnJvckNvZGU7XG5mdW5jdGlvbiBpc1ZhbGlkRXJyb3JDb2RlKGNvZGUpIHtcbiAgICByZXR1cm4gdHlwZW9mIGNvZGUgPT09IFwibnVtYmVyXCI7XG59XG5leHBvcnRzLmlzVmFsaWRFcnJvckNvZGUgPSBpc1ZhbGlkRXJyb3JDb2RlO1xuZnVuY3Rpb24gZ2V0RXJyb3IodHlwZSkge1xuICAgIGlmICghT2JqZWN0LmtleXMoY29uc3RhbnRzXzEuU1RBTkRBUkRfRVJST1JfTUFQKS5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICByZXR1cm4gY29uc3RhbnRzXzEuU1RBTkRBUkRfRVJST1JfTUFQW2NvbnN0YW50c18xLklOVEVSTkFMX0VSUk9SXTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnN0YW50c18xLlNUQU5EQVJEX0VSUk9SX01BUFt0eXBlXTtcbn1cbmV4cG9ydHMuZ2V0RXJyb3IgPSBnZXRFcnJvcjtcbmZ1bmN0aW9uIGdldEVycm9yQnlDb2RlKGNvZGUpIHtcbiAgICBjb25zdCBtYXRjaCA9IE9iamVjdC52YWx1ZXMoY29uc3RhbnRzXzEuU1RBTkRBUkRfRVJST1JfTUFQKS5maW5kKGUgPT4gZS5jb2RlID09PSBjb2RlKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJldHVybiBjb25zdGFudHNfMS5TVEFOREFSRF9FUlJPUl9NQVBbY29uc3RhbnRzXzEuSU5URVJOQUxfRVJST1JdO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG59XG5leHBvcnRzLmdldEVycm9yQnlDb2RlID0gZ2V0RXJyb3JCeUNvZGU7XG5mdW5jdGlvbiB2YWxpZGF0ZUpzb25ScGNFcnJvcihyZXNwb25zZSkge1xuICAgIGlmICh0eXBlb2YgcmVzcG9uc2UuZXJyb3IuY29kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIGVycm9yOiBcIk1pc3NpbmcgY29kZSBmb3IgSlNPTi1SUEMgZXJyb3JcIiB9O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHJlc3BvbnNlLmVycm9yLm1lc3NhZ2UgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogXCJNaXNzaW5nIG1lc3NhZ2UgZm9yIEpTT04tUlBDIGVycm9yXCIgfTtcbiAgICB9XG4gICAgaWYgKCFpc1ZhbGlkRXJyb3JDb2RlKHJlc3BvbnNlLmVycm9yLmNvZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWxpZDogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogYEludmFsaWQgZXJyb3IgY29kZSB0eXBlIGZvciBKU09OLVJQQzogJHtyZXNwb25zZS5lcnJvci5jb2RlfWAsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpc1Jlc2VydmVkRXJyb3JDb2RlKHJlc3BvbnNlLmVycm9yLmNvZGUpKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gZ2V0RXJyb3JCeUNvZGUocmVzcG9uc2UuZXJyb3IuY29kZSk7XG4gICAgICAgIGlmIChlcnJvci5tZXNzYWdlICE9PSBjb25zdGFudHNfMS5TVEFOREFSRF9FUlJPUl9NQVBbY29uc3RhbnRzXzEuSU5URVJOQUxfRVJST1JdLm1lc3NhZ2UgJiZcbiAgICAgICAgICAgIHJlc3BvbnNlLmVycm9yLm1lc3NhZ2UgPT09IGVycm9yLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBgSW52YWxpZCBlcnJvciBjb2RlIG1lc3NhZ2UgZm9yIEpTT04tUlBDOiAke3Jlc3BvbnNlLmVycm9yLmNvZGV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUgfTtcbn1cbmV4cG9ydHMudmFsaWRhdGVKc29uUnBjRXJyb3IgPSB2YWxpZGF0ZUpzb25ScGNFcnJvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVycm9yLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzTm9kZUpzID0gdm9pZCAwO1xuY29uc3QgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbmNvbnN0IGVudmlyb25tZW50XzEgPSByZXF1aXJlKFwiQHBlZHJvdWlkL2Vudmlyb25tZW50XCIpO1xuZXhwb3J0cy5pc05vZGVKcyA9IGVudmlyb25tZW50XzEuaXNOb2RlO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIkBwZWRyb3VpZC9lbnZpcm9ubWVudFwiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbnYuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2NyZWF0ZUJpbmRpbmcgPSAodGhpcyAmJiB0aGlzLl9fY3JlYXRlQmluZGluZykgfHwgKE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcbiAgICBvW2syXSA9IG1ba107XG59KSk7XG52YXIgX19leHBvcnRTdGFyID0gKHRoaXMgJiYgdGhpcy5fX2V4cG9ydFN0YXIpIHx8IGZ1bmN0aW9uKG0sIGV4cG9ydHMpIHtcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgX19jcmVhdGVCaW5kaW5nKGV4cG9ydHMsIG0sIHApO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9jcnlwdG9cIiksIGV4cG9ydHMpO1xuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2VudlwiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pc0Jyb3dzZXJDcnlwdG9BdmFpbGFibGUgPSBleHBvcnRzLmdldFN1YnRsZUNyeXB0byA9IGV4cG9ydHMuZ2V0QnJvd2VyQ3J5cHRvID0gdm9pZCAwO1xuZnVuY3Rpb24gZ2V0QnJvd2VyQ3J5cHRvKCkge1xuICAgIHJldHVybiAoZ2xvYmFsID09PSBudWxsIHx8IGdsb2JhbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogZ2xvYmFsLmNyeXB0bykgfHwgKGdsb2JhbCA9PT0gbnVsbCB8fCBnbG9iYWwgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGdsb2JhbC5tc0NyeXB0bykgfHwge307XG59XG5leHBvcnRzLmdldEJyb3dlckNyeXB0byA9IGdldEJyb3dlckNyeXB0bztcbmZ1bmN0aW9uIGdldFN1YnRsZUNyeXB0bygpIHtcbiAgICBjb25zdCBicm93c2VyQ3J5cHRvID0gZ2V0QnJvd2VyQ3J5cHRvKCk7XG4gICAgcmV0dXJuIGJyb3dzZXJDcnlwdG8uc3VidGxlIHx8IGJyb3dzZXJDcnlwdG8ud2Via2l0U3VidGxlO1xufVxuZXhwb3J0cy5nZXRTdWJ0bGVDcnlwdG8gPSBnZXRTdWJ0bGVDcnlwdG87XG5mdW5jdGlvbiBpc0Jyb3dzZXJDcnlwdG9BdmFpbGFibGUoKSB7XG4gICAgcmV0dXJuICEhZ2V0QnJvd2VyQ3J5cHRvKCkgJiYgISFnZXRTdWJ0bGVDcnlwdG8oKTtcbn1cbmV4cG9ydHMuaXNCcm93c2VyQ3J5cHRvQXZhaWxhYmxlID0gaXNCcm93c2VyQ3J5cHRvQXZhaWxhYmxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3J5cHRvLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzQnJvd3NlciA9IGV4cG9ydHMuaXNOb2RlID0gZXhwb3J0cy5pc1JlYWN0TmF0aXZlID0gdm9pZCAwO1xuZnVuY3Rpb24gaXNSZWFjdE5hdGl2ZSgpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgbmF2aWdhdG9yLnByb2R1Y3QgPT09ICdSZWFjdE5hdGl2ZScpO1xufVxuZXhwb3J0cy5pc1JlYWN0TmF0aXZlID0gaXNSZWFjdE5hdGl2ZTtcbmZ1bmN0aW9uIGlzTm9kZSgpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICB0eXBlb2YgcHJvY2Vzcy52ZXJzaW9ucyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdHlwZW9mIHByb2Nlc3MudmVyc2lvbnMubm9kZSAhPT0gJ3VuZGVmaW5lZCcpO1xufVxuZXhwb3J0cy5pc05vZGUgPSBpc05vZGU7XG5mdW5jdGlvbiBpc0Jyb3dzZXIoKSB7XG4gICAgcmV0dXJuICFpc1JlYWN0TmF0aXZlKCkgJiYgIWlzTm9kZSgpO1xufVxuZXhwb3J0cy5pc0Jyb3dzZXIgPSBpc0Jyb3dzZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbnYuanMubWFwIixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmZvcm1hdEVycm9yTWVzc2FnZSA9IGV4cG9ydHMuZm9ybWF0SnNvblJwY0Vycm9yID0gZXhwb3J0cy5mb3JtYXRKc29uUnBjUmVzdWx0ID0gZXhwb3J0cy5mb3JtYXRKc29uUnBjUmVxdWVzdCA9IGV4cG9ydHMucGF5bG9hZElkID0gdm9pZCAwO1xuY29uc3QgZXJyb3JfMSA9IHJlcXVpcmUoXCIuL2Vycm9yXCIpO1xuY29uc3QgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5mdW5jdGlvbiBwYXlsb2FkSWQoKSB7XG4gICAgY29uc3QgZGF0ZSA9IERhdGUubm93KCkgKiBNYXRoLnBvdygxMCwgMyk7XG4gICAgY29uc3QgZXh0cmEgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygxMCwgMykpO1xuICAgIHJldHVybiBkYXRlICsgZXh0cmE7XG59XG5leHBvcnRzLnBheWxvYWRJZCA9IHBheWxvYWRJZDtcbmZ1bmN0aW9uIGZvcm1hdEpzb25ScGNSZXF1ZXN0KG1ldGhvZCwgcGFyYW1zLCBpZCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBpZCB8fCBwYXlsb2FkSWQoKSxcbiAgICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICBwYXJhbXMsXG4gICAgfTtcbn1cbmV4cG9ydHMuZm9ybWF0SnNvblJwY1JlcXVlc3QgPSBmb3JtYXRKc29uUnBjUmVxdWVzdDtcbmZ1bmN0aW9uIGZvcm1hdEpzb25ScGNSZXN1bHQoaWQsIHJlc3VsdCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkLFxuICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxuICAgICAgICByZXN1bHQsXG4gICAgfTtcbn1cbmV4cG9ydHMuZm9ybWF0SnNvblJwY1Jlc3VsdCA9IGZvcm1hdEpzb25ScGNSZXN1bHQ7XG5mdW5jdGlvbiBmb3JtYXRKc29uUnBjRXJyb3IoaWQsIGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQsXG4gICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICAgIGVycm9yOiBmb3JtYXRFcnJvck1lc3NhZ2UoZXJyb3IpLFxuICAgIH07XG59XG5leHBvcnRzLmZvcm1hdEpzb25ScGNFcnJvciA9IGZvcm1hdEpzb25ScGNFcnJvcjtcbmZ1bmN0aW9uIGZvcm1hdEVycm9yTWVzc2FnZShlcnJvcikge1xuICAgIGlmICh0eXBlb2YgZXJyb3IgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIGVycm9yXzEuZ2V0RXJyb3IoY29uc3RhbnRzXzEuSU5URVJOQUxfRVJST1IpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVycm9yID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGVycm9yID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBlcnJvcl8xLmdldEVycm9yKGNvbnN0YW50c18xLlNFUlZFUl9FUlJPUikpLCB7IG1lc3NhZ2U6IGVycm9yIH0pO1xuICAgIH1cbiAgICBpZiAoZXJyb3JfMS5pc1Jlc2VydmVkRXJyb3JDb2RlKGVycm9yLmNvZGUpKSB7XG4gICAgICAgIGVycm9yID0gZXJyb3JfMS5nZXRFcnJvckJ5Q29kZShlcnJvci5jb2RlKTtcbiAgICB9XG4gICAgaWYgKCFlcnJvcl8xLmlzU2VydmVyRXJyb3JDb2RlKGVycm9yLmNvZGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIGNvZGUgaXMgbm90IGluIHNlcnZlciBjb2RlIHJhbmdlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gZXJyb3I7XG59XG5leHBvcnRzLmZvcm1hdEVycm9yTWVzc2FnZSA9IGZvcm1hdEVycm9yTWVzc2FnZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZvcm1hdC5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pc1ZhbGlkVHJhaWxpbmdXaWxkY2FyZFJvdXRlID0gZXhwb3J0cy5pc1ZhbGlkTGVhZGluZ1dpbGRjYXJkUm91dGUgPSBleHBvcnRzLmlzVmFsaWRXaWxkY2FyZFJvdXRlID0gZXhwb3J0cy5pc1ZhbGlkRGVmYXVsdFJvdXRlID0gZXhwb3J0cy5pc1ZhbGlkUm91dGUgPSB2b2lkIDA7XG5mdW5jdGlvbiBpc1ZhbGlkUm91dGUocm91dGUpIHtcbiAgICBpZiAocm91dGUuaW5jbHVkZXMoXCIqXCIpKSB7XG4gICAgICAgIHJldHVybiBpc1ZhbGlkV2lsZGNhcmRSb3V0ZShyb3V0ZSk7XG4gICAgfVxuICAgIGlmICgvXFxXL2cudGVzdChyb3V0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydHMuaXNWYWxpZFJvdXRlID0gaXNWYWxpZFJvdXRlO1xuZnVuY3Rpb24gaXNWYWxpZERlZmF1bHRSb3V0ZShyb3V0ZSkge1xuICAgIHJldHVybiByb3V0ZSA9PT0gXCIqXCI7XG59XG5leHBvcnRzLmlzVmFsaWREZWZhdWx0Um91dGUgPSBpc1ZhbGlkRGVmYXVsdFJvdXRlO1xuZnVuY3Rpb24gaXNWYWxpZFdpbGRjYXJkUm91dGUocm91dGUpIHtcbiAgICBpZiAoaXNWYWxpZERlZmF1bHRSb3V0ZShyb3V0ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICghcm91dGUuaW5jbHVkZXMoXCIqXCIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHJvdXRlLnNwbGl0KFwiKlwiKS5sZW5ndGggIT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAocm91dGUuc3BsaXQoXCIqXCIpLmZpbHRlcih4ID0+IHgudHJpbSgpID09PSBcIlwiKS5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydHMuaXNWYWxpZFdpbGRjYXJkUm91dGUgPSBpc1ZhbGlkV2lsZGNhcmRSb3V0ZTtcbmZ1bmN0aW9uIGlzVmFsaWRMZWFkaW5nV2lsZGNhcmRSb3V0ZShyb3V0ZSkge1xuICAgIHJldHVybiAhaXNWYWxpZERlZmF1bHRSb3V0ZShyb3V0ZSkgJiYgaXNWYWxpZFdpbGRjYXJkUm91dGUocm91dGUpICYmICFyb3V0ZS5zcGxpdChcIipcIilbMF0udHJpbSgpO1xufVxuZXhwb3J0cy5pc1ZhbGlkTGVhZGluZ1dpbGRjYXJkUm91dGUgPSBpc1ZhbGlkTGVhZGluZ1dpbGRjYXJkUm91dGU7XG5mdW5jdGlvbiBpc1ZhbGlkVHJhaWxpbmdXaWxkY2FyZFJvdXRlKHJvdXRlKSB7XG4gICAgcmV0dXJuICFpc1ZhbGlkRGVmYXVsdFJvdXRlKHJvdXRlKSAmJiBpc1ZhbGlkV2lsZGNhcmRSb3V0ZShyb3V0ZSkgJiYgIXJvdXRlLnNwbGl0KFwiKlwiKVsxXS50cmltKCk7XG59XG5leHBvcnRzLmlzVmFsaWRUcmFpbGluZ1dpbGRjYXJkUm91dGUgPSBpc1ZhbGlkVHJhaWxpbmdXaWxkY2FyZFJvdXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cm91dGluZy5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCJAanNvbi1ycGMtdG9vbHMvdHlwZXNcIiksIGV4cG9ydHMpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHlwZXMuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9ibG9ja2NoYWluXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2pzb25ycGNcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vbWlzY1wiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9tdWx0aVwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9wcm92aWRlclwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9yb3V0ZXJcIiksIGV4cG9ydHMpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vc2NoZW1hXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3ZhbGlkYXRvclwiKSwgZXhwb3J0cyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JQmxvY2tjaGFpblByb3ZpZGVyID0gZXhwb3J0cy5JQmxvY2tjaGFpbkF1dGhlbnRpY2F0b3IgPSBleHBvcnRzLklQZW5kaW5nUmVxdWVzdHMgPSB2b2lkIDA7XG5jb25zdCBtaXNjXzEgPSByZXF1aXJlKFwiLi9taXNjXCIpO1xuY29uc3QgcHJvdmlkZXJfMSA9IHJlcXVpcmUoXCIuL3Byb3ZpZGVyXCIpO1xuY2xhc3MgSVBlbmRpbmdSZXF1ZXN0cyB7XG4gICAgY29uc3RydWN0b3Ioc3RvcmFnZSkge1xuICAgICAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICAgIH1cbn1cbmV4cG9ydHMuSVBlbmRpbmdSZXF1ZXN0cyA9IElQZW5kaW5nUmVxdWVzdHM7XG5jbGFzcyBJQmxvY2tjaGFpbkF1dGhlbnRpY2F0b3IgZXh0ZW5kcyBtaXNjXzEuSUV2ZW50cyB7XG4gICAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIH1cbn1cbmV4cG9ydHMuSUJsb2NrY2hhaW5BdXRoZW50aWNhdG9yID0gSUJsb2NrY2hhaW5BdXRoZW50aWNhdG9yO1xuY2xhc3MgSUJsb2NrY2hhaW5Qcm92aWRlciBleHRlbmRzIHByb3ZpZGVyXzEuSUpzb25ScGNQcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbiwgY29uZmlnKSB7XG4gICAgICAgIHN1cGVyKGNvbm5lY3Rpb24pO1xuICAgIH1cbn1cbmV4cG9ydHMuSUJsb2NrY2hhaW5Qcm92aWRlciA9IElCbG9ja2NoYWluUHJvdmlkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1ibG9ja2NoYWluLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklFdmVudHMgPSB2b2lkIDA7XG5jbGFzcyBJRXZlbnRzIHtcbn1cbmV4cG9ydHMuSUV2ZW50cyA9IElFdmVudHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1taXNjLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklKc29uUnBjUHJvdmlkZXIgPSBleHBvcnRzLklCYXNlSnNvblJwY1Byb3ZpZGVyID0gZXhwb3J0cy5JSnNvblJwY0Nvbm5lY3Rpb24gPSB2b2lkIDA7XG5jb25zdCBtaXNjXzEgPSByZXF1aXJlKFwiLi9taXNjXCIpO1xuY2xhc3MgSUpzb25ScGNDb25uZWN0aW9uIGV4dGVuZHMgbWlzY18xLklFdmVudHMge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLklKc29uUnBjQ29ubmVjdGlvbiA9IElKc29uUnBjQ29ubmVjdGlvbjtcbmNsYXNzIElCYXNlSnNvblJwY1Byb3ZpZGVyIGV4dGVuZHMgbWlzY18xLklFdmVudHMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuSUJhc2VKc29uUnBjUHJvdmlkZXIgPSBJQmFzZUpzb25ScGNQcm92aWRlcjtcbmNsYXNzIElKc29uUnBjUHJvdmlkZXIgZXh0ZW5kcyBJQmFzZUpzb25ScGNQcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuSUpzb25ScGNQcm92aWRlciA9IElKc29uUnBjUHJvdmlkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm92aWRlci5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9anNvbnJwYy5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JTXVsdGlTZXJ2aWNlUHJvdmlkZXIgPSB2b2lkIDA7XG5jb25zdCBwcm92aWRlcl8xID0gcmVxdWlyZShcIi4vcHJvdmlkZXJcIik7XG5jbGFzcyBJTXVsdGlTZXJ2aWNlUHJvdmlkZXIgZXh0ZW5kcyBwcm92aWRlcl8xLklCYXNlSnNvblJwY1Byb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgfVxufVxuZXhwb3J0cy5JTXVsdGlTZXJ2aWNlUHJvdmlkZXIgPSBJTXVsdGlTZXJ2aWNlUHJvdmlkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tdWx0aS5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JSnNvblJwY1JvdXRlciA9IHZvaWQgMDtcbmNsYXNzIElKc29uUnBjUm91dGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihyb3V0ZXMpIHtcbiAgICAgICAgdGhpcy5yb3V0ZXMgPSByb3V0ZXM7XG4gICAgfVxufVxuZXhwb3J0cy5JSnNvblJwY1JvdXRlciA9IElKc29uUnBjUm91dGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cm91dGVyLmpzLm1hcCIsbnVsbCwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zY2hlbWEuanMubWFwIixudWxsLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSUpzb25ScGNWYWxpZGF0b3IgPSB2b2lkIDA7XG5jbGFzcyBJSnNvblJwY1ZhbGlkYXRvciB7XG4gICAgY29uc3RydWN0b3Ioc2NoZW1hcykge1xuICAgICAgICB0aGlzLnNjaGVtYXMgPSBzY2hlbWFzO1xuICAgIH1cbn1cbmV4cG9ydHMuSUpzb25ScGNWYWxpZGF0b3IgPSBJSnNvblJwY1ZhbGlkYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZhbGlkYXRvci5qcy5tYXAiLG51bGwsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pc0pzb25ScGNWYWxpZGF0aW9uSW52YWxpZCA9IGV4cG9ydHMuaXNKc29uUnBjRXJyb3IgPSBleHBvcnRzLmlzSnNvblJwY1Jlc3VsdCA9IGV4cG9ydHMuaXNKc29uUnBjUmVzcG9uc2UgPSBleHBvcnRzLmlzSnNvblJwY1JlcXVlc3QgPSBleHBvcnRzLmlzSnNvblJwY1BheWxvYWQgPSB2b2lkIDA7XG5mdW5jdGlvbiBpc0pzb25ScGNQYXlsb2FkKHBheWxvYWQpIHtcbiAgICByZXR1cm4gXCJpZFwiIGluIHBheWxvYWQgJiYgXCJqc29ucnBjXCIgaW4gcGF5bG9hZCAmJiBwYXlsb2FkLmpzb25ycGMgPT09IFwiMi4wXCI7XG59XG5leHBvcnRzLmlzSnNvblJwY1BheWxvYWQgPSBpc0pzb25ScGNQYXlsb2FkO1xuZnVuY3Rpb24gaXNKc29uUnBjUmVxdWVzdChwYXlsb2FkKSB7XG4gICAgcmV0dXJuIGlzSnNvblJwY1BheWxvYWQocGF5bG9hZCkgJiYgXCJtZXRob2RcIiBpbiBwYXlsb2FkO1xufVxuZXhwb3J0cy5pc0pzb25ScGNSZXF1ZXN0ID0gaXNKc29uUnBjUmVxdWVzdDtcbmZ1bmN0aW9uIGlzSnNvblJwY1Jlc3BvbnNlKHBheWxvYWQpIHtcbiAgICByZXR1cm4gaXNKc29uUnBjUGF5bG9hZChwYXlsb2FkKSAmJiAoaXNKc29uUnBjUmVzdWx0KHBheWxvYWQpIHx8IGlzSnNvblJwY0Vycm9yKHBheWxvYWQpKTtcbn1cbmV4cG9ydHMuaXNKc29uUnBjUmVzcG9uc2UgPSBpc0pzb25ScGNSZXNwb25zZTtcbmZ1bmN0aW9uIGlzSnNvblJwY1Jlc3VsdChwYXlsb2FkKSB7XG4gICAgcmV0dXJuIFwicmVzdWx0XCIgaW4gcGF5bG9hZDtcbn1cbmV4cG9ydHMuaXNKc29uUnBjUmVzdWx0ID0gaXNKc29uUnBjUmVzdWx0O1xuZnVuY3Rpb24gaXNKc29uUnBjRXJyb3IocGF5bG9hZCkge1xuICAgIHJldHVybiBcImVycm9yXCIgaW4gcGF5bG9hZDtcbn1cbmV4cG9ydHMuaXNKc29uUnBjRXJyb3IgPSBpc0pzb25ScGNFcnJvcjtcbmZ1bmN0aW9uIGlzSnNvblJwY1ZhbGlkYXRpb25JbnZhbGlkKHZhbGlkYXRpb24pIHtcbiAgICByZXR1cm4gXCJlcnJvclwiIGluIHZhbGlkYXRpb24gJiYgdmFsaWRhdGlvbi52YWxpZCA9PT0gZmFsc2U7XG59XG5leHBvcnRzLmlzSnNvblJwY1ZhbGlkYXRpb25JbnZhbGlkID0gaXNKc29uUnBjVmFsaWRhdGlvbkludmFsaWQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12YWxpZGF0b3JzLmpzLm1hcCIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSBcIjFlMTkwODI1YmFjZmNjMTZcIjsiLCIvKiB3ZWJleHRlbnNpb24tcG9seWZpbGwgLSB2MC45LjAgLSBGcmkgTWFyIDI1IDIwMjIgMTc6MDA6MjMgKi9cbi8qIC0qLSBNb2RlOiBpbmRlbnQtdGFicy1tb2RlOiBuaWw7IGpzLWluZGVudC1sZXZlbDogMiAtKi0gKi9cbi8qIHZpbTogc2V0IHN0cz0yIHN3PTIgZXQgdHc9ODA6ICovXG4vKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICh0eXBlb2YgZ2xvYmFsVGhpcyAhPSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjaHJvbWUgIT0gXCJvYmplY3RcIiB8fCAhY2hyb21lIHx8ICFjaHJvbWUucnVudGltZSB8fCAhY2hyb21lLnJ1bnRpbWUuaWQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBzY3JpcHQgc2hvdWxkIG9ubHkgYmUgbG9hZGVkIGluIGEgYnJvd3NlciBleHRlbnNpb24uXCIpO1xufVxuXG5pZiAodHlwZW9mIGdsb2JhbFRoaXMuYnJvd3NlciA9PT0gXCJ1bmRlZmluZWRcIiB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZ2xvYmFsVGhpcy5icm93c2VyKSAhPT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICBjb25zdCBDSFJPTUVfU0VORF9NRVNTQUdFX0NBTExCQUNLX05PX1JFU1BPTlNFX01FU1NBR0UgPSBcIlRoZSBtZXNzYWdlIHBvcnQgY2xvc2VkIGJlZm9yZSBhIHJlc3BvbnNlIHdhcyByZWNlaXZlZC5cIjtcbiAgY29uc3QgU0VORF9SRVNQT05TRV9ERVBSRUNBVElPTl9XQVJOSU5HID0gXCJSZXR1cm5pbmcgYSBQcm9taXNlIGlzIHRoZSBwcmVmZXJyZWQgd2F5IHRvIHNlbmQgYSByZXBseSBmcm9tIGFuIG9uTWVzc2FnZS9vbk1lc3NhZ2VFeHRlcm5hbCBsaXN0ZW5lciwgYXMgdGhlIHNlbmRSZXNwb25zZSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgc3BlY3MgKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL01vemlsbGEvQWRkLW9ucy9XZWJFeHRlbnNpb25zL0FQSS9ydW50aW1lL29uTWVzc2FnZSlcIjtcblxuICAvLyBXcmFwcGluZyB0aGUgYnVsayBvZiB0aGlzIHBvbHlmaWxsIGluIGEgb25lLXRpbWUtdXNlIGZ1bmN0aW9uIGlzIGEgbWlub3JcbiAgLy8gb3B0aW1pemF0aW9uIGZvciBGaXJlZm94LiBTaW5jZSBTcGlkZXJtb25rZXkgZG9lcyBub3QgZnVsbHkgcGFyc2UgdGhlXG4gIC8vIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24gdW50aWwgdGhlIGZpcnN0IHRpbWUgaXQncyBjYWxsZWQsIGFuZCBzaW5jZSBpdCB3aWxsXG4gIC8vIG5ldmVyIGFjdHVhbGx5IG5lZWQgdG8gYmUgY2FsbGVkLCB0aGlzIGFsbG93cyB0aGUgcG9seWZpbGwgdG8gYmUgaW5jbHVkZWRcbiAgLy8gaW4gRmlyZWZveCBuZWFybHkgZm9yIGZyZWUuXG4gIGNvbnN0IHdyYXBBUElzID0gZXh0ZW5zaW9uQVBJcyA9PiB7XG4gICAgLy8gTk9URTogYXBpTWV0YWRhdGEgaXMgYXNzb2NpYXRlZCB0byB0aGUgY29udGVudCBvZiB0aGUgYXBpLW1ldGFkYXRhLmpzb24gZmlsZVxuICAgIC8vIGF0IGJ1aWxkIHRpbWUgYnkgcmVwbGFjaW5nIHRoZSBmb2xsb3dpbmcgXCJpbmNsdWRlXCIgd2l0aCB0aGUgY29udGVudCBvZiB0aGVcbiAgICAvLyBKU09OIGZpbGUuXG4gICAgY29uc3QgYXBpTWV0YWRhdGEgPSB7XG4gICAgICBcImFsYXJtc1wiOiB7XG4gICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiY2xlYXJBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiYm9va21hcmtzXCI6IHtcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldENoaWxkcmVuXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFJlY2VudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRTdWJUcmVlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFRyZWVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlVHJlZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJicm93c2VyQWN0aW9uXCI6IHtcbiAgICAgICAgXCJkaXNhYmxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJlbmFibGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcImdldEJhZGdlQmFja2dyb3VuZENvbG9yXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRQb3B1cFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRUaXRsZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGVuUG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0QmFkZ2VCYWNrZ3JvdW5kQ29sb3JcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0SWNvblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRQb3B1cFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0VGl0bGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJicm93c2luZ0RhdGFcIjoge1xuICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVDYWNoZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVDb29raWVzXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZURvd25sb2Fkc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVGb3JtRGF0YVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVIaXN0b3J5XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZUxvY2FsU3RvcmFnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVQYXNzd29yZHNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlUGx1Z2luRGF0YVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29tbWFuZHNcIjoge1xuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29udGV4dE1lbnVzXCI6IHtcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlQWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiY29va2llc1wiOiB7XG4gICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxDb29raWVTdG9yZXNcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiZGV2dG9vbHNcIjoge1xuICAgICAgICBcImluc3BlY3RlZFdpbmRvd1wiOiB7XG4gICAgICAgICAgXCJldmFsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDIsXG4gICAgICAgICAgICBcInNpbmdsZUNhbGxiYWNrQXJnXCI6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBhbmVsc1wiOiB7XG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDMsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMyxcbiAgICAgICAgICAgIFwic2luZ2xlQ2FsbGJhY2tBcmdcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlbGVtZW50c1wiOiB7XG4gICAgICAgICAgICBcImNyZWF0ZVNpZGViYXJQYW5lXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJkb3dubG9hZHNcIjoge1xuICAgICAgICBcImNhbmNlbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkb3dubG9hZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJlcmFzZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRGaWxlSWNvblwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGVuXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJwYXVzZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVGaWxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlc3VtZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2hvd1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImV4dGVuc2lvblwiOiB7XG4gICAgICAgIFwiaXNBbGxvd2VkRmlsZVNjaGVtZUFjY2Vzc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJpc0FsbG93ZWRJbmNvZ25pdG9BY2Nlc3NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImhpc3RvcnlcIjoge1xuICAgICAgICBcImFkZFVybFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlUmFuZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlVXJsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFZpc2l0c1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcImkxOG5cIjoge1xuICAgICAgICBcImRldGVjdExhbmd1YWdlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFjY2VwdExhbmd1YWdlc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwiaWRlbnRpdHlcIjoge1xuICAgICAgICBcImxhdW5jaFdlYkF1dGhGbG93XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJpZGxlXCI6IHtcbiAgICAgICAgXCJxdWVyeVN0YXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJtYW5hZ2VtZW50XCI6IHtcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFNlbGZcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0RW5hYmxlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1bmluc3RhbGxTZWxmXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJub3RpZmljYXRpb25zXCI6IHtcbiAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcImdldFBlcm1pc3Npb25MZXZlbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInBhZ2VBY3Rpb25cIjoge1xuICAgICAgICBcImdldFBvcHVwXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFRpdGxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImhpZGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldEljb25cIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0UG9wdXBcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBcInNldFRpdGxlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaG93XCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwicGVybWlzc2lvbnNcIjoge1xuICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVxdWVzdFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwicnVudGltZVwiOiB7XG4gICAgICAgIFwiZ2V0QmFja2dyb3VuZFBhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0UGxhdGZvcm1JbmZvXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICB9LFxuICAgICAgICBcIm9wZW5PcHRpb25zUGFnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZXF1ZXN0VXBkYXRlQ2hlY2tcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VuZE1lc3NhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAzXG4gICAgICAgIH0sXG4gICAgICAgIFwic2VuZE5hdGl2ZU1lc3NhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0VW5pbnN0YWxsVVJMXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJzZXNzaW9uc1wiOiB7XG4gICAgICAgIFwiZ2V0RGV2aWNlc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRSZWNlbnRseUNsb3NlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZXN0b3JlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJzdG9yYWdlXCI6IHtcbiAgICAgICAgXCJsb2NhbFwiOiB7XG4gICAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYW5hZ2VkXCI6IHtcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzeW5jXCI6IHtcbiAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Qnl0ZXNJblVzZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJ0YWJzXCI6IHtcbiAgICAgICAgXCJjYXB0dXJlVmlzaWJsZVRhYlwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGV0ZWN0TGFuZ3VhZ2VcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGlzY2FyZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJkdXBsaWNhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZXhlY3V0ZVNjcmlwdFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRab29tXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFpvb21TZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnb0JhY2tcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ29Gb3J3YXJkXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImhpZ2hsaWdodFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJpbnNlcnRDU1NcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJxdWVyeVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZWxvYWRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcInJlbW92ZUNTU1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZW5kTWVzc2FnZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDNcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRab29tXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9LFxuICAgICAgICBcInNldFpvb21TZXR0aW5nc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInRvcFNpdGVzXCI6IHtcbiAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcIndlYk5hdmlnYXRpb25cIjoge1xuICAgICAgICBcImdldEFsbEZyYW1lc1wiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRGcmFtZVwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwid2ViUmVxdWVzdFwiOiB7XG4gICAgICAgIFwiaGFuZGxlckJlaGF2aW9yQ2hhbmdlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwid2luZG93c1wiOiB7XG4gICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRMYXN0Rm9jdXNlZFwiOiB7XG4gICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChPYmplY3Qua2V5cyhhcGlNZXRhZGF0YSkubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhcGktbWV0YWRhdGEuanNvbiBoYXMgbm90IGJlZW4gaW5jbHVkZWQgaW4gYnJvd3Nlci1wb2x5ZmlsbFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIFdlYWtNYXAgc3ViY2xhc3Mgd2hpY2ggY3JlYXRlcyBhbmQgc3RvcmVzIGEgdmFsdWUgZm9yIGFueSBrZXkgd2hpY2ggZG9lc1xuICAgICAqIG5vdCBleGlzdCB3aGVuIGFjY2Vzc2VkLCBidXQgYmVoYXZlcyBleGFjdGx5IGFzIGFuIG9yZGluYXJ5IFdlYWtNYXBcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjcmVhdGVJdGVtXG4gICAgICogICAgICAgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gY3JlYXRlIHRoZSB2YWx1ZSBmb3IgYW55XG4gICAgICogICAgICAgIGtleSB3aGljaCBkb2VzIG5vdCBleGlzdCwgdGhlIGZpcnN0IHRpbWUgaXQgaXMgYWNjZXNzZWQuIFRoZVxuICAgICAqICAgICAgICBmdW5jdGlvbiByZWNlaXZlcywgYXMgaXRzIG9ubHkgYXJndW1lbnQsIHRoZSBrZXkgYmVpbmcgY3JlYXRlZC5cbiAgICAgKi9cbiAgICBjbGFzcyBEZWZhdWx0V2Vha01hcCBleHRlbmRzIFdlYWtNYXAge1xuICAgICAgY29uc3RydWN0b3IoY3JlYXRlSXRlbSwgaXRlbXMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VwZXIoaXRlbXMpO1xuICAgICAgICB0aGlzLmNyZWF0ZUl0ZW0gPSBjcmVhdGVJdGVtO1xuICAgICAgfVxuXG4gICAgICBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICAgIHRoaXMuc2V0KGtleSwgdGhpcy5jcmVhdGVJdGVtKGtleSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmdldChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGFuIG9iamVjdCB3aXRoIGEgYHRoZW5gIG1ldGhvZCwgYW5kIGNhblxuICAgICAqIHRoZXJlZm9yZSBiZSBhc3N1bWVkIHRvIGJlaGF2ZSBhcyBhIFByb21pc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byB0ZXN0LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB2YWx1ZSBpcyB0aGVuYWJsZS5cbiAgICAgKi9cbiAgICBjb25zdCBpc1RoZW5hYmxlID0gdmFsdWUgPT4ge1xuICAgICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0XG4gICAgICogdGhlIGdpdmVuIHByb21pc2UgYmFzZWQgb24gaG93IGl0IGlzIGNhbGxlZDpcbiAgICAgKlxuICAgICAqIC0gSWYsIHdoZW4gY2FsbGVkLCBgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yYCBjb250YWlucyBhIG5vbi1udWxsIG9iamVjdCxcbiAgICAgKiAgIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIHdpdGggdGhhdCB2YWx1ZS5cbiAgICAgKiAtIElmIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBleGFjdGx5IG9uZSBhcmd1bWVudCwgdGhlIHByb21pc2UgaXNcbiAgICAgKiAgIHJlc29sdmVkIHRvIHRoYXQgdmFsdWUuXG4gICAgICogLSBPdGhlcndpc2UsIHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHRvIGFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIG9mIHRoZVxuICAgICAqICAgZnVuY3Rpb24ncyBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvbWlzZVxuICAgICAqICAgICAgICBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgcmVzb2x1dGlvbiBhbmQgcmVqZWN0aW9uIGZ1bmN0aW9ucyBvZiBhXG4gICAgICogICAgICAgIHByb21pc2UuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJvbWlzZS5yZXNvbHZlXG4gICAgICogICAgICAgIFRoZSBwcm9taXNlJ3MgcmVzb2x1dGlvbiBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9taXNlLnJlamVjdFxuICAgICAqICAgICAgICBUaGUgcHJvbWlzZSdzIHJlamVjdGlvbiBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbWV0YWRhdGFcbiAgICAgKiAgICAgICAgTWV0YWRhdGEgYWJvdXQgdGhlIHdyYXBwZWQgbWV0aG9kIHdoaWNoIGhhcyBjcmVhdGVkIHRoZSBjYWxsYmFjay5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnXG4gICAgICogICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggb25seSB0aGUgZmlyc3RcbiAgICAgKiAgICAgICAgYXJndW1lbnQgb2YgdGhlIGNhbGxiYWNrLCBhbHRlcm5hdGl2ZWx5IGFuIGFycmF5IG9mIGFsbCB0aGVcbiAgICAgKiAgICAgICAgY2FsbGJhY2sgYXJndW1lbnRzIGlzIHJlc29sdmVkLiBCeSBkZWZhdWx0LCBpZiB0aGUgY2FsbGJhY2tcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIG9ubHkgYSBzaW5nbGUgYXJndW1lbnQsIHRoYXQgd2lsbCBiZVxuICAgICAqICAgICAgICByZXNvbHZlZCB0byB0aGUgcHJvbWlzZSwgd2hpbGUgYWxsIGFyZ3VtZW50cyB3aWxsIGJlIHJlc29sdmVkIGFzXG4gICAgICogICAgICAgIGFuIGFycmF5IGlmIG11bHRpcGxlIGFyZSBnaXZlbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn1cbiAgICAgKiAgICAgICAgVGhlIGdlbmVyYXRlZCBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBjb25zdCBtYWtlQ2FsbGJhY2sgPSAocHJvbWlzZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgIHJldHVybiAoLi4uY2FsbGJhY2tBcmdzKSA9PiB7XG4gICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgcHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnIHx8XG4gICAgICAgICAgICAgICAgICAgKGNhbGxiYWNrQXJncy5sZW5ndGggPD0gMSAmJiBtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZyAhPT0gZmFsc2UpKSB7XG4gICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJnc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJncyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcblxuICAgIGNvbnN0IHBsdXJhbGl6ZUFyZ3VtZW50cyA9IChudW1BcmdzKSA9PiBudW1BcmdzID09IDEgPyBcImFyZ3VtZW50XCIgOiBcImFyZ3VtZW50c1wiO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHdyYXBwZXIgZnVuY3Rpb24gZm9yIGEgbWV0aG9kIHdpdGggdGhlIGdpdmVuIG5hbWUgYW5kIG1ldGFkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiAgICAgICAgVGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aGljaCBpcyBiZWluZyB3cmFwcGVkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBtZXRhZGF0YVxuICAgICAqICAgICAgICBNZXRhZGF0YSBhYm91dCB0aGUgbWV0aG9kIGJlaW5nIHdyYXBwZWQuXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5taW5BcmdzXG4gICAgICogICAgICAgIFRoZSBtaW5pbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbXVzdCBiZSBwYXNzZWQgdG8gdGhlXG4gICAgICogICAgICAgIGZ1bmN0aW9uLiBJZiBjYWxsZWQgd2l0aCBmZXdlciB0aGFuIHRoaXMgbnVtYmVyIG9mIGFyZ3VtZW50cywgdGhlXG4gICAgICogICAgICAgIHdyYXBwZXIgd2lsbCByYWlzZSBhbiBleGNlcHRpb24uXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5tYXhBcmdzXG4gICAgICogICAgICAgIFRoZSBtYXhpbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbWF5IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgKiAgICAgICAgZnVuY3Rpb24uIElmIGNhbGxlZCB3aXRoIG1vcmUgdGhhbiB0aGlzIG51bWJlciBvZiBhcmd1bWVudHMsIHRoZVxuICAgICAqICAgICAgICB3cmFwcGVyIHdpbGwgcmFpc2UgYW4gZXhjZXB0aW9uLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmdcbiAgICAgKiAgICAgICAgV2hldGhlciBvciBub3QgdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCBvbmx5IHRoZSBmaXJzdFxuICAgICAqICAgICAgICBhcmd1bWVudCBvZiB0aGUgY2FsbGJhY2ssIGFsdGVybmF0aXZlbHkgYW4gYXJyYXkgb2YgYWxsIHRoZVxuICAgICAqICAgICAgICBjYWxsYmFjayBhcmd1bWVudHMgaXMgcmVzb2x2ZWQuIEJ5IGRlZmF1bHQsIGlmIHRoZSBjYWxsYmFja1xuICAgICAqICAgICAgICBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggb25seSBhIHNpbmdsZSBhcmd1bWVudCwgdGhhdCB3aWxsIGJlXG4gICAgICogICAgICAgIHJlc29sdmVkIHRvIHRoZSBwcm9taXNlLCB3aGlsZSBhbGwgYXJndW1lbnRzIHdpbGwgYmUgcmVzb2x2ZWQgYXNcbiAgICAgKiAgICAgICAgYW4gYXJyYXkgaWYgbXVsdGlwbGUgYXJlIGdpdmVuLlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9uKG9iamVjdCwgLi4uKil9XG4gICAgICogICAgICAgVGhlIGdlbmVyYXRlZCB3cmFwcGVyIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBBc3luY0Z1bmN0aW9uID0gKG5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gYXN5bmNGdW5jdGlvbldyYXBwZXIodGFyZ2V0LCAuLi5hcmdzKSB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IG1ldGFkYXRhLm1pbkFyZ3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IGxlYXN0ICR7bWV0YWRhdGEubWluQXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWluQXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gbWV0YWRhdGEubWF4QXJncykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbW9zdCAke21ldGFkYXRhLm1heEFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1heEFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgaWYgKG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUaGlzIEFQSSBtZXRob2QgaGFzIGN1cnJlbnRseSBubyBjYWxsYmFjayBvbiBDaHJvbWUsIGJ1dCBpdCByZXR1cm4gYSBwcm9taXNlIG9uIEZpcmVmb3gsXG4gICAgICAgICAgICAvLyBhbmQgc28gdGhlIHBvbHlmaWxsIHdpbGwgdHJ5IHRvIGNhbGwgaXQgd2l0aCBhIGNhbGxiYWNrIGZpcnN0LCBhbmQgaXQgd2lsbCBmYWxsYmFja1xuICAgICAgICAgICAgLy8gdG8gbm90IHBhc3NpbmcgdGhlIGNhbGxiYWNrIGlmIHRoZSBmaXJzdCBjYWxsIGZhaWxzLlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MsIG1ha2VDYWxsYmFjayh7cmVzb2x2ZSwgcmVqZWN0fSwgbWV0YWRhdGEpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGNiRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAke25hbWV9IEFQSSBtZXRob2QgZG9lc24ndCBzZWVtIHRvIHN1cHBvcnQgdGhlIGNhbGxiYWNrIHBhcmFtZXRlciwgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhbGxpbmcgYmFjayB0byBjYWxsIGl0IHdpdGhvdXQgYSBjYWxsYmFjazogXCIsIGNiRXJyb3IpO1xuXG4gICAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzKTtcblxuICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIEFQSSBtZXRob2QgbWV0YWRhdGEsIHNvIHRoYXQgdGhlIG5leHQgQVBJIGNhbGxzIHdpbGwgbm90IHRyeSB0b1xuICAgICAgICAgICAgICAvLyB1c2UgdGhlIHVuc3VwcG9ydGVkIGNhbGxiYWNrIGFueW1vcmUuXG4gICAgICAgICAgICAgIG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrID0gZmFsc2U7XG4gICAgICAgICAgICAgIG1ldGFkYXRhLm5vQ2FsbGJhY2sgPSB0cnVlO1xuXG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG1ldGFkYXRhLm5vQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MsIG1ha2VDYWxsYmFjayh7cmVzb2x2ZSwgcmVqZWN0fSwgbWV0YWRhdGEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYW4gZXhpc3RpbmcgbWV0aG9kIG9mIHRoZSB0YXJnZXQgb2JqZWN0LCBzbyB0aGF0IGNhbGxzIHRvIGl0IGFyZVxuICAgICAqIGludGVyY2VwdGVkIGJ5IHRoZSBnaXZlbiB3cmFwcGVyIGZ1bmN0aW9uLiBUaGUgd3JhcHBlciBmdW5jdGlvbiByZWNlaXZlcyxcbiAgICAgKiBhcyBpdHMgZmlyc3QgYXJndW1lbnQsIHRoZSBvcmlnaW5hbCBgdGFyZ2V0YCBvYmplY3QsIGZvbGxvd2VkIGJ5IGVhY2ggb2ZcbiAgICAgKiB0aGUgYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgb3JpZ2luYWwgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAqICAgICAgICBUaGUgb3JpZ2luYWwgdGFyZ2V0IG9iamVjdCB0aGF0IHRoZSB3cmFwcGVkIG1ldGhvZCBiZWxvbmdzIHRvLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1ldGhvZFxuICAgICAqICAgICAgICBUaGUgbWV0aG9kIGJlaW5nIHdyYXBwZWQuIFRoaXMgaXMgdXNlZCBhcyB0aGUgdGFyZ2V0IG9mIHRoZSBQcm94eVxuICAgICAqICAgICAgICBvYmplY3Qgd2hpY2ggaXMgY3JlYXRlZCB0byB3cmFwIHRoZSBtZXRob2QuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gd3JhcHBlclxuICAgICAqICAgICAgICBUaGUgd3JhcHBlciBmdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgaW4gcGxhY2Ugb2YgYSBkaXJlY3QgaW52b2NhdGlvblxuICAgICAqICAgICAgICBvZiB0aGUgd3JhcHBlZCBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJveHk8ZnVuY3Rpb24+fVxuICAgICAqICAgICAgICBBIFByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIG1ldGhvZCwgd2hpY2ggaW52b2tlcyB0aGUgZ2l2ZW4gd3JhcHBlclxuICAgICAqICAgICAgICBtZXRob2QgaW4gaXRzIHBsYWNlLlxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBNZXRob2QgPSAodGFyZ2V0LCBtZXRob2QsIHdyYXBwZXIpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkobWV0aG9kLCB7XG4gICAgICAgIGFwcGx5KHRhcmdldE1ldGhvZCwgdGhpc09iaiwgYXJncykge1xuICAgICAgICAgIHJldHVybiB3cmFwcGVyLmNhbGwodGhpc09iaiwgdGFyZ2V0LCAuLi5hcmdzKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsZXQgaGFzT3duUHJvcGVydHkgPSBGdW5jdGlvbi5jYWxsLmJpbmQoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbiAgICAvKipcbiAgICAgKiBXcmFwcyBhbiBvYmplY3QgaW4gYSBQcm94eSB3aGljaCBpbnRlcmNlcHRzIGFuZCB3cmFwcyBjZXJ0YWluIG1ldGhvZHNcbiAgICAgKiBiYXNlZCBvbiB0aGUgZ2l2ZW4gYHdyYXBwZXJzYCBhbmQgYG1ldGFkYXRhYCBvYmplY3RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAqICAgICAgICBUaGUgdGFyZ2V0IG9iamVjdCB0byB3cmFwLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFt3cmFwcGVycyA9IHt9XVxuICAgICAqICAgICAgICBBbiBvYmplY3QgdHJlZSBjb250YWluaW5nIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBzcGVjaWFsIGNhc2VzLiBBbnlcbiAgICAgKiAgICAgICAgZnVuY3Rpb24gcHJlc2VudCBpbiB0aGlzIG9iamVjdCB0cmVlIGlzIGNhbGxlZCBpbiBwbGFjZSBvZiB0aGVcbiAgICAgKiAgICAgICAgbWV0aG9kIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgdGFyZ2V0YCBvYmplY3QgdHJlZS4gVGhlc2VcbiAgICAgKiAgICAgICAgd3JhcHBlciBtZXRob2RzIGFyZSBpbnZva2VkIGFzIGRlc2NyaWJlZCBpbiB7QHNlZSB3cmFwTWV0aG9kfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbbWV0YWRhdGEgPSB7fV1cbiAgICAgKiAgICAgICAgQW4gb2JqZWN0IHRyZWUgY29udGFpbmluZyBtZXRhZGF0YSB1c2VkIHRvIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVcbiAgICAgKiAgICAgICAgUHJvbWlzZS1iYXNlZCB3cmFwcGVyIGZ1bmN0aW9ucyBmb3IgYXN5bmNocm9ub3VzLiBBbnkgZnVuY3Rpb24gaW5cbiAgICAgKiAgICAgICAgdGhlIGB0YXJnZXRgIG9iamVjdCB0cmVlIHdoaWNoIGhhcyBhIGNvcnJlc3BvbmRpbmcgbWV0YWRhdGEgb2JqZWN0XG4gICAgICogICAgICAgIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgbWV0YWRhdGFgIHRyZWUgaXMgcmVwbGFjZWQgd2l0aCBhblxuICAgICAqICAgICAgICBhdXRvbWF0aWNhbGx5LWdlbmVyYXRlZCB3cmFwcGVyIGZ1bmN0aW9uLCBhcyBkZXNjcmliZWQgaW5cbiAgICAgKiAgICAgICAge0BzZWUgd3JhcEFzeW5jRnVuY3Rpb259XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJveHk8b2JqZWN0Pn1cbiAgICAgKi9cbiAgICBjb25zdCB3cmFwT2JqZWN0ID0gKHRhcmdldCwgd3JhcHBlcnMgPSB7fSwgbWV0YWRhdGEgPSB7fSkgPT4ge1xuICAgICAgbGV0IGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIGxldCBoYW5kbGVycyA9IHtcbiAgICAgICAgaGFzKHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgcmV0dXJuIHByb3AgaW4gdGFyZ2V0IHx8IHByb3AgaW4gY2FjaGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0KHByb3h5VGFyZ2V0LCBwcm9wLCByZWNlaXZlcikge1xuICAgICAgICAgIGlmIChwcm9wIGluIGNhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbcHJvcF07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCEocHJvcCBpbiB0YXJnZXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB2YWx1ZSA9IHRhcmdldFtwcm9wXTtcblxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG1ldGhvZCBvbiB0aGUgdW5kZXJseWluZyBvYmplY3QuIENoZWNrIGlmIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgIC8vIGFueSB3cmFwcGluZy5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3cmFwcGVyc1twcm9wXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIC8vIFdlIGhhdmUgYSBzcGVjaWFsLWNhc2Ugd3JhcHBlciBmb3IgdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcnNbcHJvcF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBhc3luYyBtZXRob2QgdGhhdCB3ZSBoYXZlIG1ldGFkYXRhIGZvci4gQ3JlYXRlIGFcbiAgICAgICAgICAgICAgLy8gUHJvbWlzZSB3cmFwcGVyIGZvciBpdC5cbiAgICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSB3cmFwQXN5bmNGdW5jdGlvbihwcm9wLCBtZXRhZGF0YVtwcm9wXSk7XG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbWV0aG9kIHRoYXQgd2UgZG9uJ3Qga25vdyBvciBjYXJlIGFib3V0LiBSZXR1cm4gdGhlXG4gICAgICAgICAgICAgIC8vIG9yaWdpbmFsIG1ldGhvZCwgYm91bmQgdG8gdGhlIHVuZGVybHlpbmcgb2JqZWN0LlxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmJpbmQodGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgKGhhc093blByb3BlcnR5KHdyYXBwZXJzLCBwcm9wKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBwcm9wKSkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gb2JqZWN0IHRoYXQgd2UgbmVlZCB0byBkbyBzb21lIHdyYXBwaW5nIGZvciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIC8vIG9mLiBDcmVhdGUgYSBzdWItb2JqZWN0IHdyYXBwZXIgZm9yIGl0IHdpdGggdGhlIGFwcHJvcHJpYXRlIGNoaWxkXG4gICAgICAgICAgICAvLyBtZXRhZGF0YS5cbiAgICAgICAgICAgIHZhbHVlID0gd3JhcE9iamVjdCh2YWx1ZSwgd3JhcHBlcnNbcHJvcF0sIG1ldGFkYXRhW3Byb3BdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBcIipcIikpIHtcbiAgICAgICAgICAgIC8vIFdyYXAgYWxsIHByb3BlcnRpZXMgaW4gKiBuYW1lc3BhY2UuXG4gICAgICAgICAgICB2YWx1ZSA9IHdyYXBPYmplY3QodmFsdWUsIHdyYXBwZXJzW3Byb3BdLCBtZXRhZGF0YVtcIipcIl0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGRvIGFueSB3cmFwcGluZyBmb3IgdGhpcyBwcm9wZXJ0eSxcbiAgICAgICAgICAgIC8vIHNvIGp1c3QgZm9yd2FyZCBhbGwgYWNjZXNzIHRvIHRoZSB1bmRlcmx5aW5nIG9iamVjdC5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYWNoZSwgcHJvcCwge1xuICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BdO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBzZXQodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0KHByb3h5VGFyZ2V0LCBwcm9wLCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICBpZiAocHJvcCBpbiBjYWNoZSkge1xuICAgICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlZmluZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wLCBkZXNjKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVmaW5lUHJvcGVydHkoY2FjaGUsIHByb3AsIGRlc2MpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoY2FjaGUsIHByb3ApO1xuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgLy8gUGVyIGNvbnRyYWN0IG9mIHRoZSBQcm94eSBBUEksIHRoZSBcImdldFwiIHByb3h5IGhhbmRsZXIgbXVzdCByZXR1cm4gdGhlXG4gICAgICAvLyBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgdGFyZ2V0IGlmIHRoYXQgdmFsdWUgaXMgZGVjbGFyZWQgcmVhZC1vbmx5IGFuZFxuICAgICAgLy8gbm9uLWNvbmZpZ3VyYWJsZS4gRm9yIHRoaXMgcmVhc29uLCB3ZSBjcmVhdGUgYW4gb2JqZWN0IHdpdGggdGhlXG4gICAgICAvLyBwcm90b3R5cGUgc2V0IHRvIGB0YXJnZXRgIGluc3RlYWQgb2YgdXNpbmcgYHRhcmdldGAgZGlyZWN0bHkuXG4gICAgICAvLyBPdGhlcndpc2Ugd2UgY2Fubm90IHJldHVybiBhIGN1c3RvbSBvYmplY3QgZm9yIEFQSXMgdGhhdFxuICAgICAgLy8gYXJlIGRlY2xhcmVkIHJlYWQtb25seSBhbmQgbm9uLWNvbmZpZ3VyYWJsZSwgc3VjaCBhcyBgY2hyb21lLmRldnRvb2xzYC5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgcHJveHkgaGFuZGxlcnMgdGhlbXNlbHZlcyB3aWxsIHN0aWxsIHVzZSB0aGUgb3JpZ2luYWwgYHRhcmdldGBcbiAgICAgIC8vIGluc3RlYWQgb2YgdGhlIGBwcm94eVRhcmdldGAsIHNvIHRoYXQgdGhlIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgYXJlXG4gICAgICAvLyBkZXJlZmVyZW5jZWQgdmlhIHRoZSBvcmlnaW5hbCB0YXJnZXRzLlxuICAgICAgbGV0IHByb3h5VGFyZ2V0ID0gT2JqZWN0LmNyZWF0ZSh0YXJnZXQpO1xuICAgICAgcmV0dXJuIG5ldyBQcm94eShwcm94eVRhcmdldCwgaGFuZGxlcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc2V0IG9mIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBvYmplY3QsIHdoaWNoIGhhbmRsZXNcbiAgICAgKiB3cmFwcGluZyBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdGhhdCB0aG9zZSBtZXNzYWdlcyBhcmUgcGFzc2VkLlxuICAgICAqXG4gICAgICogQSBzaW5nbGUgd3JhcHBlciBpcyBjcmVhdGVkIGZvciBlYWNoIGxpc3RlbmVyIGZ1bmN0aW9uLCBhbmQgc3RvcmVkIGluIGFcbiAgICAgKiBtYXAuIFN1YnNlcXVlbnQgY2FsbHMgdG8gYGFkZExpc3RlbmVyYCwgYGhhc0xpc3RlbmVyYCwgb3IgYHJlbW92ZUxpc3RlbmVyYFxuICAgICAqIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB3cmFwcGVyLCBzbyB0aGF0ICBhdHRlbXB0cyB0byByZW1vdmUgYVxuICAgICAqIHByZXZpb3VzbHktYWRkZWQgbGlzdGVuZXIgd29yayBhcyBleHBlY3RlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RGVmYXVsdFdlYWtNYXA8ZnVuY3Rpb24sIGZ1bmN0aW9uPn0gd3JhcHBlck1hcFxuICAgICAqICAgICAgICBBIERlZmF1bHRXZWFrTWFwIG9iamVjdCB3aGljaCB3aWxsIGNyZWF0ZSB0aGUgYXBwcm9wcmlhdGUgd3JhcHBlclxuICAgICAqICAgICAgICBmb3IgYSBnaXZlbiBsaXN0ZW5lciBmdW5jdGlvbiB3aGVuIG9uZSBkb2VzIG5vdCBleGlzdCwgYW5kIHJldHJpZXZlXG4gICAgICogICAgICAgIGFuIGV4aXN0aW5nIG9uZSB3aGVuIGl0IGRvZXMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fVxuICAgICAqL1xuICAgIGNvbnN0IHdyYXBFdmVudCA9IHdyYXBwZXJNYXAgPT4gKHtcbiAgICAgIGFkZExpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIsIC4uLmFyZ3MpIHtcbiAgICAgICAgdGFyZ2V0LmFkZExpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSwgLi4uYXJncyk7XG4gICAgICB9LFxuXG4gICAgICBoYXNMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQuaGFzTGlzdGVuZXIod3JhcHBlck1hcC5nZXQobGlzdGVuZXIpKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUxpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb25SZXF1ZXN0RmluaXNoZWRXcmFwcGVycyA9IG5ldyBEZWZhdWx0V2Vha01hcChsaXN0ZW5lciA9PiB7XG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFdyYXBzIGFuIG9uUmVxdWVzdEZpbmlzaGVkIGxpc3RlbmVyIGZ1bmN0aW9uIHNvIHRoYXQgaXQgd2lsbCByZXR1cm4gYVxuICAgICAgICogYGdldENvbnRlbnQoKWAgcHJvcGVydHkgd2hpY2ggcmV0dXJucyBhIGBQcm9taXNlYCByYXRoZXIgdGhhbiB1c2luZyBhXG4gICAgICAgKiBjYWxsYmFjayBBUEkuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICAgICAgICogICAgICAgIFRoZSBIQVIgZW50cnkgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgbmV0d29yayByZXF1ZXN0LlxuICAgICAgICovXG4gICAgICByZXR1cm4gZnVuY3Rpb24gb25SZXF1ZXN0RmluaXNoZWQocmVxKSB7XG4gICAgICAgIGNvbnN0IHdyYXBwZWRSZXEgPSB3cmFwT2JqZWN0KHJlcSwge30gLyogd3JhcHBlcnMgKi8sIHtcbiAgICAgICAgICBnZXRDb250ZW50OiB7XG4gICAgICAgICAgICBtaW5BcmdzOiAwLFxuICAgICAgICAgICAgbWF4QXJnczogMCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgbGlzdGVuZXIod3JhcHBlZFJlcSk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gS2VlcCB0cmFjayBpZiB0aGUgZGVwcmVjYXRpb24gd2FybmluZyBoYXMgYmVlbiBsb2dnZWQgYXQgbGVhc3Qgb25jZS5cbiAgICBsZXQgbG9nZ2VkU2VuZFJlc3BvbnNlRGVwcmVjYXRpb25XYXJuaW5nID0gZmFsc2U7XG5cbiAgICBjb25zdCBvbk1lc3NhZ2VXcmFwcGVycyA9IG5ldyBEZWZhdWx0V2Vha01hcChsaXN0ZW5lciA9PiB7XG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFdyYXBzIGEgbWVzc2FnZSBsaXN0ZW5lciBmdW5jdGlvbiBzbyB0aGF0IGl0IG1heSBzZW5kIHJlc3BvbnNlcyBiYXNlZCBvblxuICAgICAgICogaXRzIHJldHVybiB2YWx1ZSwgcmF0aGVyIHRoYW4gYnkgcmV0dXJuaW5nIGEgc2VudGluZWwgdmFsdWUgYW5kIGNhbGxpbmcgYVxuICAgICAgICogY2FsbGJhY2suIElmIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiByZXR1cm5zIGEgUHJvbWlzZSwgdGhlIHJlc3BvbnNlIGlzXG4gICAgICAgKiBzZW50IHdoZW4gdGhlIHByb21pc2UgZWl0aGVyIHJlc29sdmVzIG9yIHJlamVjdHMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHsqfSBtZXNzYWdlXG4gICAgICAgKiAgICAgICAgVGhlIG1lc3NhZ2Ugc2VudCBieSB0aGUgb3RoZXIgZW5kIG9mIHRoZSBjaGFubmVsLlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHNlbmRlclxuICAgICAgICogICAgICAgIERldGFpbHMgYWJvdXQgdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZS5cbiAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oKil9IHNlbmRSZXNwb25zZVxuICAgICAgICogICAgICAgIEEgY2FsbGJhY2sgd2hpY2gsIHdoZW4gY2FsbGVkIHdpdGggYW4gYXJiaXRyYXJ5IGFyZ3VtZW50LCBzZW5kc1xuICAgICAgICogICAgICAgIHRoYXQgdmFsdWUgYXMgYSByZXNwb25zZS5cbiAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICogICAgICAgIFRydWUgaWYgdGhlIHdyYXBwZWQgbGlzdGVuZXIgcmV0dXJuZWQgYSBQcm9taXNlLCB3aGljaCB3aWxsIGxhdGVyXG4gICAgICAgKiAgICAgICAgeWllbGQgYSByZXNwb25zZS4gRmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAgICovXG4gICAgICByZXR1cm4gZnVuY3Rpb24gb25NZXNzYWdlKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSB7XG4gICAgICAgIGxldCBkaWRDYWxsU2VuZFJlc3BvbnNlID0gZmFsc2U7XG5cbiAgICAgICAgbGV0IHdyYXBwZWRTZW5kUmVzcG9uc2U7XG4gICAgICAgIGxldCBzZW5kUmVzcG9uc2VQcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgd3JhcHBlZFNlbmRSZXNwb25zZSA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoIWxvZ2dlZFNlbmRSZXNwb25zZURlcHJlY2F0aW9uV2FybmluZykge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oU0VORF9SRVNQT05TRV9ERVBSRUNBVElPTl9XQVJOSU5HLCBuZXcgRXJyb3IoKS5zdGFjayk7XG4gICAgICAgICAgICAgIGxvZ2dlZFNlbmRSZXNwb25zZURlcHJlY2F0aW9uV2FybmluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaWRDYWxsU2VuZFJlc3BvbnNlID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0ID0gbGlzdGVuZXIobWVzc2FnZSwgc2VuZGVyLCB3cmFwcGVkU2VuZFJlc3BvbnNlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmVzdWx0ID0gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzUmVzdWx0VGhlbmFibGUgPSByZXN1bHQgIT09IHRydWUgJiYgaXNUaGVuYWJsZShyZXN1bHQpO1xuXG4gICAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciBkaWRuJ3QgcmV0dXJuZWQgdHJ1ZSBvciBhIFByb21pc2UsIG9yIGNhbGxlZFxuICAgICAgICAvLyB3cmFwcGVkU2VuZFJlc3BvbnNlIHN5bmNocm9ub3VzbHksIHdlIGNhbiBleGl0IGVhcmxpZXJcbiAgICAgICAgLy8gYmVjYXVzZSB0aGVyZSB3aWxsIGJlIG5vIHJlc3BvbnNlIHNlbnQgZnJvbSB0aGlzIGxpc3RlbmVyLlxuICAgICAgICBpZiAocmVzdWx0ICE9PSB0cnVlICYmICFpc1Jlc3VsdFRoZW5hYmxlICYmICFkaWRDYWxsU2VuZFJlc3BvbnNlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQSBzbWFsbCBoZWxwZXIgdG8gc2VuZCB0aGUgbWVzc2FnZSBpZiB0aGUgcHJvbWlzZSByZXNvbHZlc1xuICAgICAgICAvLyBhbmQgYW4gZXJyb3IgaWYgdGhlIHByb21pc2UgcmVqZWN0cyAoYSB3cmFwcGVkIHNlbmRNZXNzYWdlIGhhc1xuICAgICAgICAvLyB0byB0cmFuc2xhdGUgdGhlIG1lc3NhZ2UgaW50byBhIHJlc29sdmVkIHByb21pc2Ugb3IgYSByZWplY3RlZFxuICAgICAgICAvLyBwcm9taXNlKS5cbiAgICAgICAgY29uc3Qgc2VuZFByb21pc2VkUmVzdWx0ID0gKHByb21pc2UpID0+IHtcbiAgICAgICAgICBwcm9taXNlLnRoZW4obXNnID0+IHtcbiAgICAgICAgICAgIC8vIHNlbmQgdGhlIG1lc3NhZ2UgdmFsdWUuXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UobXNnKTtcbiAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAvLyBTZW5kIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgZXJyb3IgaWYgdGhlIHJlamVjdGVkIHZhbHVlXG4gICAgICAgICAgICAvLyBpcyBhbiBpbnN0YW5jZSBvZiBlcnJvciwgb3IgdGhlIG9iamVjdCBpdHNlbGYgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgbGV0IG1lc3NhZ2U7XG4gICAgICAgICAgICBpZiAoZXJyb3IgJiYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgfHxcbiAgICAgICAgICAgICAgICB0eXBlb2YgZXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBtZXNzYWdlID0gXCJBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XG4gICAgICAgICAgICAgIF9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXzogdHJ1ZSxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvLyBQcmludCBhbiBlcnJvciBvbiB0aGUgY29uc29sZSBpZiB1bmFibGUgdG8gc2VuZCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHNlbmQgb25NZXNzYWdlIHJlamVjdGVkIHJlcGx5XCIsIGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHJldHVybmVkIGEgUHJvbWlzZSwgc2VuZCB0aGUgcmVzb2x2ZWQgdmFsdWUgYXMgYVxuICAgICAgICAvLyByZXN1bHQsIG90aGVyd2lzZSB3YWl0IHRoZSBwcm9taXNlIHJlbGF0ZWQgdG8gdGhlIHdyYXBwZWRTZW5kUmVzcG9uc2VcbiAgICAgICAgLy8gY2FsbGJhY2sgdG8gcmVzb2x2ZSBhbmQgc2VuZCBpdCBhcyBhIHJlc3BvbnNlLlxuICAgICAgICBpZiAoaXNSZXN1bHRUaGVuYWJsZSkge1xuICAgICAgICAgIHNlbmRQcm9taXNlZFJlc3VsdChyZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbmRQcm9taXNlZFJlc3VsdChzZW5kUmVzcG9uc2VQcm9taXNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExldCBDaHJvbWUga25vdyB0aGF0IHRoZSBsaXN0ZW5lciBpcyByZXBseWluZy5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgY29uc3Qgd3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2sgPSAoe3JlamVjdCwgcmVzb2x2ZX0sIHJlcGx5KSA9PiB7XG4gICAgICBpZiAoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAvLyBEZXRlY3Qgd2hlbiBub25lIG9mIHRoZSBsaXN0ZW5lcnMgcmVwbGllZCB0byB0aGUgc2VuZE1lc3NhZ2UgY2FsbCBhbmQgcmVzb2x2ZVxuICAgICAgICAvLyB0aGUgcHJvbWlzZSB0byB1bmRlZmluZWQgYXMgaW4gRmlyZWZveC5cbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3dlYmV4dGVuc2lvbi1wb2x5ZmlsbC9pc3N1ZXMvMTMwXG4gICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UgPT09IENIUk9NRV9TRU5EX01FU1NBR0VfQ0FMTEJBQ0tfTk9fUkVTUE9OU0VfTUVTU0FHRSkge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHJlcGx5ICYmIHJlcGx5Ll9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXykge1xuICAgICAgICAvLyBDb252ZXJ0IGJhY2sgdGhlIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIGVycm9yIGludG9cbiAgICAgICAgLy8gYW4gRXJyb3IgaW5zdGFuY2UuXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVwbHkubWVzc2FnZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShyZXBseSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHdyYXBwZWRTZW5kTWVzc2FnZSA9IChuYW1lLCBtZXRhZGF0YSwgYXBpTmFtZXNwYWNlT2JqLCAuLi5hcmdzKSA9PiB7XG4gICAgICBpZiAoYXJncy5sZW5ndGggPCBtZXRhZGF0YS5taW5BcmdzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbGVhc3QgJHttZXRhZGF0YS5taW5BcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5taW5BcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA+IG1ldGFkYXRhLm1heEFyZ3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBtb3N0ICR7bWV0YWRhdGEubWF4QXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWF4QXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB3cmFwcGVkQ2IgPSB3cmFwcGVkU2VuZE1lc3NhZ2VDYWxsYmFjay5iaW5kKG51bGwsIHtyZXNvbHZlLCByZWplY3R9KTtcbiAgICAgICAgYXJncy5wdXNoKHdyYXBwZWRDYik7XG4gICAgICAgIGFwaU5hbWVzcGFjZU9iai5zZW5kTWVzc2FnZSguLi5hcmdzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBzdGF0aWNXcmFwcGVycyA9IHtcbiAgICAgIGRldnRvb2xzOiB7XG4gICAgICAgIG5ldHdvcms6IHtcbiAgICAgICAgICBvblJlcXVlc3RGaW5pc2hlZDogd3JhcEV2ZW50KG9uUmVxdWVzdEZpbmlzaGVkV3JhcHBlcnMpLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHJ1bnRpbWU6IHtcbiAgICAgICAgb25NZXNzYWdlOiB3cmFwRXZlbnQob25NZXNzYWdlV3JhcHBlcnMpLFxuICAgICAgICBvbk1lc3NhZ2VFeHRlcm5hbDogd3JhcEV2ZW50KG9uTWVzc2FnZVdyYXBwZXJzKSxcbiAgICAgICAgc2VuZE1lc3NhZ2U6IHdyYXBwZWRTZW5kTWVzc2FnZS5iaW5kKG51bGwsIFwic2VuZE1lc3NhZ2VcIiwge21pbkFyZ3M6IDEsIG1heEFyZ3M6IDN9KSxcbiAgICAgIH0sXG4gICAgICB0YWJzOiB7XG4gICAgICAgIHNlbmRNZXNzYWdlOiB3cmFwcGVkU2VuZE1lc3NhZ2UuYmluZChudWxsLCBcInNlbmRNZXNzYWdlXCIsIHttaW5BcmdzOiAyLCBtYXhBcmdzOiAzfSksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3Qgc2V0dGluZ01ldGFkYXRhID0ge1xuICAgICAgY2xlYXI6IHttaW5BcmdzOiAxLCBtYXhBcmdzOiAxfSxcbiAgICAgIGdldDoge21pbkFyZ3M6IDEsIG1heEFyZ3M6IDF9LFxuICAgICAgc2V0OiB7bWluQXJnczogMSwgbWF4QXJnczogMX0sXG4gICAgfTtcbiAgICBhcGlNZXRhZGF0YS5wcml2YWN5ID0ge1xuICAgICAgbmV0d29yazoge1wiKlwiOiBzZXR0aW5nTWV0YWRhdGF9LFxuICAgICAgc2VydmljZXM6IHtcIipcIjogc2V0dGluZ01ldGFkYXRhfSxcbiAgICAgIHdlYnNpdGVzOiB7XCIqXCI6IHNldHRpbmdNZXRhZGF0YX0sXG4gICAgfTtcblxuICAgIHJldHVybiB3cmFwT2JqZWN0KGV4dGVuc2lvbkFQSXMsIHN0YXRpY1dyYXBwZXJzLCBhcGlNZXRhZGF0YSk7XG4gIH07XG5cbiAgLy8gVGhlIGJ1aWxkIHByb2Nlc3MgYWRkcyBhIFVNRCB3cmFwcGVyIGFyb3VuZCB0aGlzIGZpbGUsIHdoaWNoIG1ha2VzIHRoZVxuICAvLyBgbW9kdWxlYCB2YXJpYWJsZSBhdmFpbGFibGUuXG4gIG1vZHVsZS5leHBvcnRzID0gd3JhcEFQSXMoY2hyb21lKTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZ2xvYmFsVGhpcy5icm93c2VyO1xufVxuIl0sIm5hbWVzIjpbImdsb2JhbFRoaXMiLCJjaHJvbWUiLCJydW50aW1lIiwiaWQiLCJFcnJvciIsImJyb3dzZXIiLCJPYmplY3QiLCJnZXRQcm90b3R5cGVPZiIsInByb3RvdHlwZSIsIkNIUk9NRV9TRU5EX01FU1NBR0VfQ0FMTEJBQ0tfTk9fUkVTUE9OU0VfTUVTU0FHRSIsIlNFTkRfUkVTUE9OU0VfREVQUkVDQVRJT05fV0FSTklORyIsIndyYXBBUElzIiwiZXh0ZW5zaW9uQVBJcyIsImFwaU1ldGFkYXRhIiwia2V5cyIsImxlbmd0aCIsIkRlZmF1bHRXZWFrTWFwIiwiV2Vha01hcCIsImNvbnN0cnVjdG9yIiwiY3JlYXRlSXRlbSIsIml0ZW1zIiwidW5kZWZpbmVkIiwiZ2V0Iiwia2V5IiwiaGFzIiwic2V0IiwiaXNUaGVuYWJsZSIsInZhbHVlIiwidGhlbiIsIm1ha2VDYWxsYmFjayIsInByb21pc2UiLCJtZXRhZGF0YSIsImNhbGxiYWNrQXJncyIsImxhc3RFcnJvciIsInJlamVjdCIsIm1lc3NhZ2UiLCJzaW5nbGVDYWxsYmFja0FyZyIsInJlc29sdmUiLCJwbHVyYWxpemVBcmd1bWVudHMiLCJudW1BcmdzIiwid3JhcEFzeW5jRnVuY3Rpb24iLCJuYW1lIiwiYXN5bmNGdW5jdGlvbldyYXBwZXIiLCJ0YXJnZXQiLCJhcmdzIiwibWluQXJncyIsIm1heEFyZ3MiLCJQcm9taXNlIiwiZmFsbGJhY2tUb05vQ2FsbGJhY2siLCJjYkVycm9yIiwiY29uc29sZSIsIndhcm4iLCJub0NhbGxiYWNrIiwid3JhcE1ldGhvZCIsIm1ldGhvZCIsIndyYXBwZXIiLCJQcm94eSIsImFwcGx5IiwidGFyZ2V0TWV0aG9kIiwidGhpc09iaiIsImNhbGwiLCJoYXNPd25Qcm9wZXJ0eSIsIkZ1bmN0aW9uIiwiYmluZCIsIndyYXBPYmplY3QiLCJ3cmFwcGVycyIsImNhY2hlIiwiY3JlYXRlIiwiaGFuZGxlcnMiLCJwcm94eVRhcmdldCIsInByb3AiLCJyZWNlaXZlciIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwiZW51bWVyYWJsZSIsImRlc2MiLCJSZWZsZWN0IiwiZGVsZXRlUHJvcGVydHkiLCJ3cmFwRXZlbnQiLCJ3cmFwcGVyTWFwIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsImhhc0xpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJvblJlcXVlc3RGaW5pc2hlZFdyYXBwZXJzIiwib25SZXF1ZXN0RmluaXNoZWQiLCJyZXEiLCJ3cmFwcGVkUmVxIiwiZ2V0Q29udGVudCIsImxvZ2dlZFNlbmRSZXNwb25zZURlcHJlY2F0aW9uV2FybmluZyIsIm9uTWVzc2FnZVdyYXBwZXJzIiwib25NZXNzYWdlIiwic2VuZGVyIiwic2VuZFJlc3BvbnNlIiwiZGlkQ2FsbFNlbmRSZXNwb25zZSIsIndyYXBwZWRTZW5kUmVzcG9uc2UiLCJzZW5kUmVzcG9uc2VQcm9taXNlIiwicmVzcG9uc2UiLCJzdGFjayIsInJlc3VsdCIsImVyciIsImlzUmVzdWx0VGhlbmFibGUiLCJzZW5kUHJvbWlzZWRSZXN1bHQiLCJtc2ciLCJlcnJvciIsIl9fbW96V2ViRXh0ZW5zaW9uUG9seWZpbGxSZWplY3RfXyIsImNhdGNoIiwid3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2siLCJyZXBseSIsIndyYXBwZWRTZW5kTWVzc2FnZSIsImFwaU5hbWVzcGFjZU9iaiIsIndyYXBwZWRDYiIsInB1c2giLCJzZW5kTWVzc2FnZSIsInN0YXRpY1dyYXBwZXJzIiwiZGV2dG9vbHMiLCJuZXR3b3JrIiwib25NZXNzYWdlRXh0ZXJuYWwiLCJ0YWJzIiwic2V0dGluZ01ldGFkYXRhIiwiY2xlYXIiLCJwcml2YWN5Iiwic2VydmljZXMiLCJ3ZWJzaXRlcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwidmVyc2lvbiI6MywiZmlsZSI6ImNvbnRlbnQtc2NyaXB0LjNkYTJhZTE3LmpzLm1hcCJ9
