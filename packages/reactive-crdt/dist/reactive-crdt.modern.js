import * as reactive from '@reactivedata/reactive';
import { markRaw, $reactive, $reactiveproxy } from '@reactivedata/reactive';
import { makeYJSObservable, useReactiveBindings } from '@reactivedata/yjs-reactive-bindings';
export { useMobxBindings, useVueBindings } from '@reactivedata/yjs-reactive-bindings';
import * as Y from 'yjs';
export { Y };

// const RAW_SYMBOL = Symbol("bo");
class Box {
  // public RAW_SYMBOL;
  constructor(value) {
    this.value = void 0;
    this.value = value;
  }

}
function boxed(value) {
  return new Box(Object.freeze(value));
}

function isYType(element) {
  return element instanceof Y.AbstractType;
}

const yToWrappedCache = new WeakMap();
function parseYjsReturnValue(value, implicitObserver) {
  if (isYType(value)) {
    value._implicitObserver = implicitObserver;

    if (value instanceof Y.Array || value instanceof Y.Map) {
      if (!yToWrappedCache.has(value)) {
        const wrapped = crdtValue$1(value);
        yToWrappedCache.set(value, wrapped);
      }

      value = yToWrappedCache.get(value);
    } else if (value instanceof Y.XmlElement || value instanceof Y.XmlFragment || value instanceof Y.XmlText || value instanceof Y.XmlHook || value instanceof Y.Text) {
      markRaw(value);
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

function crdtObject(initializer, map = new Y.Map()) {
  if (map[$reactive]) {
    throw new Error("unexpected"); // map = map[$reactive].raw;
  }

  const proxy = new Proxy({}, {
    set: (target, p, value) => {
      if (typeof p !== "string") {
        throw new Error();
      }

      const wrapped = crdtValue$1(value); // TODO: maybe set cache

      const internal = getInternalAny$1(wrapped) || wrapped;

      if (internal instanceof Box) {
        map.set(p, internal.value);
      } else {
        map.set(p, internal);
      }

      return true;
    },
    get: (target, p, receiver) => {
      if (p === INTERNAL_SYMBOL$1) {
        return map;
      }

      if (typeof p !== "string") {
        return Reflect.get(target, p); // throw new Error("get non string parameter");
      }

      let ic;

      if (receiver && receiver[$reactiveproxy]) {
        var _receiver$$reactivepr;

        ic = (_receiver$$reactivepr = receiver[$reactiveproxy]) == null ? void 0 : _receiver$$reactivepr.implicitObserver;
        map._implicitObserver = ic;
      }

      let ret = map.get(p);
      ret = parseYjsReturnValue(ret, ic);
      return ret;
    },
    deleteProperty: (target, p) => {
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
    has: (target, p) => {
      if (typeof p === "string" && map.has(p)) {
        return true;
      }

      return false;
    },

    getOwnPropertyDescriptor(target, p) {
      if (typeof p === "string" && map.has(p)) {
        return {
          enumerable: true,
          configurable: true
        };
      }

      return undefined;
    },

    ownKeys: target => {
      return Array.from(map.keys());
    }
  });
  yToWrappedCache.set(map, proxy);

  for (let key in initializer) {
    proxy[key] = initializer[key];
  }

  return proxy;
}

makeYJSObservable();
useReactiveBindings(reactive); // use reactive bindings by default

const INTERNAL_SYMBOL$1 = Symbol("INTERNAL_SYMBOL");
function getInternalAny$1(object
/*CRDTArray<any> | CRDTObject<any>*/
) {
  return object[INTERNAL_SYMBOL$1];
}
function crdtValue$1(value) {
  value = getInternalAny$1(value) || value; // unwrap

  if (value instanceof Y.Array) {
    return crdtArray([], value);
  } else if (value instanceof Y.Map) {
    return crdtObject({}, value);
  } else if (typeof value === "string") {
    return value; // TODO
  } else if (Array.isArray(value)) {
    return crdtArray(value);
  } else if (value instanceof Y.XmlElement || value instanceof Y.XmlFragment || value instanceof Y.XmlText || value instanceof Y.XmlHook) {
    return value;
  } else if (value instanceof Y.Text) {
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
  const slice = function slice() {
    var _this$$reactiveproxy;

    let ic = (_this$$reactiveproxy = this[$reactiveproxy]) == null ? void 0 : _this$$reactiveproxy.implicitObserver;
    arr._implicitObserver = ic;
    const items = arr.slice.bind(arr).apply(arr, arguments);
    return items.map(item => {
      const ret = parseYjsReturnValue(item, ic);
      return ret;
    });
  };

  const wrapItems = function wrapItems(items) {
    return items.map(item => {
      const wrapped = crdtValue$1(item); // TODO

      const internal = getInternalAny$1(wrapped) || wrapped;

      if (internal instanceof Box) {
        return internal.value;
      } else {
        return internal;
      }
    });
  };

  const ret = {
    // get length() {
    //   return arr.length;
    // },
    // set length(val: number) {
    //   throw new Error("set length of yjs array is unsupported");
    // },
    slice,
    unshift: arr.unshift.bind(arr),
    push: (...items) => {
      arr.push(wrapItems(items));
      return arr.length;
    },
    insert: arr.insert.bind(arr),
    toJSON: arr.toJSON.bind(arr),
    forEach: function () {
      return [].forEach.apply(slice.apply(this), arguments);
    },
    filter: function () {
      return [].filter.apply(slice.apply(this), arguments);
    },
    find: function () {
      return [].find.apply(slice.apply(this), arguments);
    },
    map: function () {
      return [].map.apply(slice.apply(this), arguments);
    },
    indexOf: function () {
      return [].indexOf.apply(slice.apply(this), arguments);
    },
    splice: function () {
      let start = arguments[0] < 0 ? arr.length - Math.abs(arguments[0]) : arguments[0];
      let deleteCount = arguments[1];
      let items = Array.from(Array.from(arguments).slice(2));
      let deleted = slice.apply(this, [start, Number.isInteger(deleteCount) ? start + deleteCount : undefined]);
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
    const asNum = Number(p); // https://stackoverflow.com/questions/10834796/validate-that-a-string-is-a-positive-integer

    if (Number.isInteger(asNum)) {
      return asNum;
    }
  }

  return p;
}

function crdtArray(initializer, arr = new Y.Array()) {
  if (arr[$reactive]) {
    throw new Error("unexpected"); // arr = arr[$reactive].raw;
  }

  const implementation = arrayImplementation(arr);
  const proxy = new Proxy(implementation, {
    set: (target, pArg, value) => {
      const p = propertyToNumber(pArg);

      if (typeof p !== "number") {
        throw new Error();
      } // TODO map.set(p, smartValue(value));


      return true;
    },
    get: (target, pArg, receiver) => {
      const p = propertyToNumber(pArg);

      if (p === INTERNAL_SYMBOL$1) {
        return arr;
      }

      if (typeof p === "number") {
        let ic;

        if (receiver && receiver[$reactiveproxy]) {
          var _receiver$$reactivepr;

          ic = (_receiver$$reactivepr = receiver[$reactiveproxy]) == null ? void 0 : _receiver$$reactivepr.implicitObserver;
          arr._implicitObserver = ic;
        }

        let _ret = arr.get(p);

        _ret = parseYjsReturnValue(_ret, ic);
        return _ret;
      }

      if (p === Symbol.toStringTag) {
        return "Array";
      }

      if (p === Symbol.iterator) {
        const values = arr.slice();
        return Reflect.get(values, p);
      }

      if (p === "length") {
        return arr.length;
      } // forward to arrayimplementation


      const ret = Reflect.get(target, p, receiver);
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
    deleteProperty: (target, pArg) => {
      const p = propertyToNumber(pArg);

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
    has: (target, pArg) => {
      const p = propertyToNumber(pArg);

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

    getOwnPropertyDescriptor(target, pArg) {
      const p = propertyToNumber(pArg);

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

    ownKeys: target => {
      const keys = [];

      for (let i = 0; i < arr.length; i++) {
        keys.push(i + "");
      }

      keys.push("length");
      return keys;
    }
  });
  implementation.push.apply(proxy, initializer);
  return proxy;
}

makeYJSObservable();
useReactiveBindings(reactive); // use reactive bindings by default

const INTERNAL_SYMBOL = Symbol("INTERNAL_SYMBOL");
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
function crdtValue(value) {
  value = getInternalAny(value) || value; // unwrap

  if (value instanceof Y.Array) {
    return crdtArray([], value);
  } else if (value instanceof Y.Map) {
    return crdtObject({}, value);
  } else if (typeof value === "string") {
    return value; // TODO
  } else if (Array.isArray(value)) {
    return crdtArray(value);
  } else if (value instanceof Y.XmlElement || value instanceof Y.XmlFragment || value instanceof Y.XmlText || value instanceof Y.XmlHook) {
    return value;
  } else if (value instanceof Y.Text) {
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

export { INTERNAL_SYMBOL, crdt, crdtValue, getInternalAny, getInternalArray, getInternalMap };
//# sourceMappingURL=reactive-crdt.modern.js.map
