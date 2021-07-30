var reactive = require('@reactivedata/reactive');
var yjsReactiveBindings = require('@reactivedata/yjs-reactive-bindings');
var Y = require('yjs');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      }
    });
  }
  n['default'] = e;
  return n;
}

var reactive__namespace = /*#__PURE__*/_interopNamespace(reactive);
var Y__namespace = /*#__PURE__*/_interopNamespace(Y);

// const RAW_SYMBOL = Symbol("bo");
var Box = // public RAW_SYMBOL;
function Box(value) {
  this.value = void 0;
  this.value = value;
};
function boxed(value) {
  return new Box(Object.freeze(value));
}

function isYType(element) {
  return element instanceof Y__namespace.AbstractType;
}

var yToWrappedCache = new WeakMap();
function parseYjsReturnValue(value, implicitObserver) {
  if (isYType(value)) {
    value._implicitObserver = implicitObserver;

    if (value instanceof Y__namespace.Array || value instanceof Y__namespace.Map) {
      if (!yToWrappedCache.has(value)) {
        var wrapped = crdtValue$1(value, null);
        yToWrappedCache.set(value, wrapped);
      }

      value = yToWrappedCache.get(value);
    } else if (value instanceof Y__namespace.XmlElement || value instanceof Y__namespace.XmlFragment || value instanceof Y__namespace.XmlText || value instanceof Y__namespace.XmlHook || value instanceof Y__namespace.Text) {
      reactive.markRaw(value);
      value.__v_skip = true; // for vue Reactive
    } else {
      throw new Error("unknown YType");
    }

    return value;
  } else if (typeof value === "object") {
    return boxed(value);
  }

  return value;
}

function crdtObject(initializer, map) {
  if (map === void 0) {
    map = new Y__namespace.Map();
  }

  if (map[reactive.$reactive]) {
    throw new Error("unexpected"); // map = map[$reactive].raw;
  }

  var proxy = new Proxy({}, {
    set: function set(target, p, value) {
      if (typeof p !== "string") {
        throw new Error();
      }

      var wrapped = crdtValue$1(value, map); // TODO: maybe set cache

      var internal = getInternalAny$1(wrapped) || wrapped;

      if (internal instanceof Box) {
        map.set(p, internal.value);
      } else {
        map.set(p, internal);
      }

      return true;
    },
    get: function get(target, p, receiver) {
      if (p === INTERNAL_SYMBOL$1) {
        return map;
      }

      if (typeof p !== "string") {
        return Reflect.get(target, p); // throw new Error("get non string parameter");
      }

      var ic;

      if (receiver && receiver[reactive.$reactiveproxy]) {
        var _receiver$$reactivepr;

        ic = (_receiver$$reactivepr = receiver[reactive.$reactiveproxy]) == null ? void 0 : _receiver$$reactivepr.implicitObserver;
        map._implicitObserver = ic;
      }

      var ret = map.get(p);
      ret = parseYjsReturnValue(ret, ic);
      return ret;
    },
    deleteProperty: function deleteProperty(target, p) {
      if (typeof p !== "string") {
        throw new Error();
      }

      if (map.has(p)) {
        map.delete(p);
        return true;
      } else {
        return false;
      }
    },
    has: function has(target, p) {
      if (typeof p === "string" && map.has(p)) {
        return true;
      }

      return false;
    },
    getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, p) {
      if (typeof p === "string" && map.has(p)) {
        return {
          enumerable: true,
          configurable: true
        };
      }

      return undefined;
    },
    ownKeys: function ownKeys(target) {
      return Array.from(map.keys());
    }
  });
  yToWrappedCache.set(map, proxy);

  for (var key in initializer) {
    proxy[key] = initializer[key];
  }

  return proxy;
}

yjsReactiveBindings.makeYJSObservable();
yjsReactiveBindings.useReactiveBindings(reactive__namespace); // use reactive bindings by default

var INTERNAL_SYMBOL$1 = Symbol("INTERNAL_SYMBOL");
function getInternalAny$1(object
/*CRDTArray<any> | CRDTObject<any>*/
) {
  return object[INTERNAL_SYMBOL$1];
}
function crdtValue$1(value, parent) {
  value = getInternalAny$1(value) || value; // unwrap

  if (value instanceof Y__namespace.Array) {
    if (parent && parent !== value.parent) {
      // parent has changed = moved
      return crdtArray(value.toJSON()); // create new yarray since yjs does not allow moving an already inserted type
    } else {
      return crdtArray([], value);
    }
  } else if (value instanceof Y__namespace.Map) {
    if (parent && parent !== value.parent) {
      // parent has changed = moved
      return crdtObject(value.toJSON()); // create new ymap since yjs does not allow moving an already inserted type
    } else {
      return crdtObject({}, value);
    }
  } else if (typeof value === "string") {
    return value; // TODO
  } else if (Array.isArray(value)) {
    return crdtArray(value);
  } else if (value instanceof Y__namespace.XmlElement || value instanceof Y__namespace.XmlFragment || value instanceof Y__namespace.XmlText || value instanceof Y__namespace.XmlHook) {
    return value;
  } else if (value instanceof Y__namespace.Text) {
    return value;
  } else if (typeof value === "object") {
    if (value instanceof Box) {
      return value;
    } else {
      return crdtObject(value);
    }
  } else if (typeof value === "number" || typeof value === "boolean") {
    return value;
  } else {
    throw new Error("invalid");
  }
}

function arrayImplementation(arr) {
  var slice = function slice() {
    var _this$$reactiveproxy;

    var ic = (_this$$reactiveproxy = this[reactive.$reactiveproxy]) == null ? void 0 : _this$$reactiveproxy.implicitObserver;
    arr._implicitObserver = ic;
    var items = arr.slice.bind(arr).apply(arr, arguments);
    return items.map(function (item) {
      var ret = parseYjsReturnValue(item, ic);
      return ret;
    });
  };

  var wrapItems = function wrapItems(items) {
    return items.map(function (item) {
      var wrapped = crdtValue$1(item, arr); // TODO

      var internal = getInternalAny$1(wrapped) || wrapped;

      if (internal instanceof Box) {
        return internal.value;
      } else {
        return internal;
      }
    });
  };

  var ret = {
    // get length() {
    //   return arr.length;
    // },
    // set length(val: number) {
    //   throw new Error("set length of yjs array is unsupported");
    // },
    slice: slice,
    unshift: arr.unshift.bind(arr),
    push: function push() {
      arr.push(wrapItems([].slice.call(arguments)));
      return arr.length;
    },
    insert: arr.insert.bind(arr),
    toJSON: arr.toJSON.bind(arr),
    forEach: function forEach() {
      return [].forEach.apply(slice.apply(this), arguments);
    },
    filter: function filter() {
      return [].filter.apply(slice.apply(this), arguments);
    },
    find: function find() {
      return [].find.apply(slice.apply(this), arguments);
    },
    map: function map() {
      return [].map.apply(slice.apply(this), arguments);
    },
    indexOf: function indexOf() {
      return [].indexOf.apply(slice.apply(this), arguments);
    },
    splice: function splice() {
      var start = arguments[0] < 0 ? arr.length - Math.abs(arguments[0]) : arguments[0];
      var deleteCount = arguments[1];
      var items = Array.from(Array.from(arguments).slice(2));
      var deleted = slice.apply(this, [start, Number.isInteger(deleteCount) ? start + deleteCount : undefined]);
      arr.delete(start, deleteCount);
      arr.insert(start, wrapItems(items));
      return deleted;
    } // toJSON = () => {
    //   return this.arr.toJSON() slice();
    // };
    // delete = this.arr.delete.bind(this.arr) as (Y.Array<T>)["delete"];

  }; // this is necessary to prevent errors like "trap reported non-configurability for property 'length' which is either non-existent or configurable in the proxy target" when adding support for ownKeys and Reflect.keysx

  Object.defineProperty(ret, "length", {
    enumerable: false,
    configurable: false,
    writable: true,
    value: arr.length
  });
  return ret;
}

function propertyToNumber(p) {
  if (typeof p === "string" && p.trim().length) {
    var asNum = Number(p); // https://stackoverflow.com/questions/10834796/validate-that-a-string-is-a-positive-integer

    if (Number.isInteger(asNum)) {
      return asNum;
    }
  }

  return p;
}

function crdtArray(initializer, arr) {
  if (arr === void 0) {
    arr = new Y__namespace.Array();
  }

  if (arr[reactive.$reactive]) {
    throw new Error("unexpected"); // arr = arr[$reactive].raw;
  }

  var implementation = arrayImplementation(arr);
  var proxy = new Proxy(implementation, {
    set: function set(target, pArg, value) {
      var p = propertyToNumber(pArg);

      if (typeof p !== "number") {
        throw new Error();
      } // TODO map.set(p, smartValue(value));


      return true;
    },
    get: function get(target, pArg, receiver) {
      var p = propertyToNumber(pArg);

      if (p === INTERNAL_SYMBOL$1) {
        return arr;
      }

      if (typeof p === "number") {
        var ic;

        if (receiver && receiver[reactive.$reactiveproxy]) {
          var _receiver$$reactivepr;

          ic = (_receiver$$reactivepr = receiver[reactive.$reactiveproxy]) == null ? void 0 : _receiver$$reactivepr.implicitObserver;
          arr._implicitObserver = ic;
        }

        var _ret = arr.get(p);

        _ret = parseYjsReturnValue(_ret, ic);
        return _ret;
      }

      if (p === Symbol.toStringTag) {
        return "Array";
      }

      if (p === Symbol.iterator) {
        var values = arr.slice();
        return Reflect.get(values, p);
      }

      if (p === "length") {
        return arr.length;
      } // forward to arrayimplementation


      var ret = Reflect.get(target, p, receiver);
      return ret;
    },
    // getOwnPropertyDescriptor: (target, pArg) => {
    //   const p = propertyToNumber(pArg);
    //   if (typeof p === "number" && p < arr.length && p >= 0) {
    //     return { configurable: true, enumerable: true, value: arr.get(p) };
    //   } else {
    //     return undefined;
    //   }
    // },
    deleteProperty: function deleteProperty(target, pArg) {
      var p = propertyToNumber(pArg);

      if (typeof p !== "number") {
        throw new Error();
      }

      if (p < arr.length && p >= 0) {
        arr.delete(p);
        return true;
      } else {
        return false;
      }
    },
    has: function has(target, pArg) {
      var p = propertyToNumber(pArg);

      if (typeof p !== "number") {
        // forward to arrayimplementation
        return Reflect.has(target, p);
      }

      if (p < arr.length && p >= 0) {
        return true;
      } else {
        return false;
      }
    },
    getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, pArg) {
      var p = propertyToNumber(pArg);

      if (p === "length") {
        return {
          enumerable: false,
          configurable: false,
          writable: true
        };
      }

      if (typeof p === "number" && p >= 0 && p < arr.length) {
        return {
          enumerable: true,
          configurable: true,
          writable: true
        };
      }

      return undefined;
    },
    ownKeys: function ownKeys(target) {
      var keys = [];

      for (var i = 0; i < arr.length; i++) {
        keys.push(i + "");
      }

      keys.push("length");
      return keys;
    }
  });
  implementation.push.apply(proxy, initializer);
  return proxy;
}

yjsReactiveBindings.makeYJSObservable();
yjsReactiveBindings.useReactiveBindings(reactive__namespace); // use reactive bindings by default

var INTERNAL_SYMBOL = Symbol("INTERNAL_SYMBOL");
function getInternalMap(object) {
  return object[INTERNAL_SYMBOL];
}
function getInternalArray(object) {
  return object[INTERNAL_SYMBOL];
}
function getInternalAny(object
/*CRDTArray<any> | CRDTObject<any>*/
) {
  return object[INTERNAL_SYMBOL];
}
function crdtValue(value, parent) {
  value = getInternalAny(value) || value; // unwrap

  if (value instanceof Y__namespace.Array) {
    if (parent && parent !== value.parent) {
      // parent has changed = moved
      return crdtArray(value.toJSON()); // create new yarray since yjs does not allow moving an already inserted type
    } else {
      return crdtArray([], value);
    }
  } else if (value instanceof Y__namespace.Map) {
    if (parent && parent !== value.parent) {
      // parent has changed = moved
      return crdtObject(value.toJSON()); // create new ymap since yjs does not allow moving an already inserted type
    } else {
      return crdtObject({}, value);
    }
  } else if (typeof value === "string") {
    return value; // TODO
  } else if (Array.isArray(value)) {
    return crdtArray(value);
  } else if (value instanceof Y__namespace.XmlElement || value instanceof Y__namespace.XmlFragment || value instanceof Y__namespace.XmlText || value instanceof Y__namespace.XmlHook) {
    return value;
  } else if (value instanceof Y__namespace.Text) {
    return value;
  } else if (typeof value === "object") {
    if (value instanceof Box) {
      return value;
    } else {
      return crdtObject(value);
    }
  } else if (typeof value === "number" || typeof value === "boolean") {
    return value;
  } else {
    throw new Error("invalid");
  }
}
function crdt(doc) {
  return crdtObject({}, doc.getMap());
}

Object.defineProperty(exports, 'useMobxBindings', {
  enumerable: true,
  get: function () {
    return yjsReactiveBindings.useMobxBindings;
  }
});
Object.defineProperty(exports, 'useVueBindings', {
  enumerable: true,
  get: function () {
    return yjsReactiveBindings.useVueBindings;
  }
});
exports.Y = Y__namespace;
exports.INTERNAL_SYMBOL = INTERNAL_SYMBOL;
exports.crdt = crdt;
exports.crdtValue = crdtValue;
exports.getInternalAny = getInternalAny;
exports.getInternalArray = getInternalArray;
exports.getInternalMap = getInternalMap;
//# sourceMappingURL=reactive-crdt.js.map
