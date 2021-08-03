import * as Y from 'yjs';

let customCreateAtom;
function createAtom(_name, _onBecomeObservedHandler, _onBecomeUnobservedHandler) {
  if (customCreateAtom) {
    return customCreateAtom.apply(null, arguments);
  } else {
    throw new Error("observable implementation not provided. Call useReactiveBindings, useVueBindings or useMobxBindings.");
  }
}
function useMobxBindings(mobx) {
  customCreateAtom = mobx.createAtom;
}
var vueRef;
function useVueBindings(vue) {
  vueRef = vue;

  customCreateAtom = function (name, obo) {
    let id = 0;
    const data = vue.reactive({
      data: id
    });
    const atom = {
      reportObserved() {
        return data.data;
      },

      reportChanged() {
        data.data = ++id;
      }

    };

    if (obo) {
      obo();
    }

    return atom;
  };
}
function useReactiveBindings(reactive) {
  customCreateAtom = function (name, obo, obu) {
    // TMP
    const atom = reactive.createAtom(name);

    if (obo) {
      obo();
    }

    return atom;
  };
}

const arraysObserved = new WeakSet();
function observeArray(array) {
  if (arraysObserved.has(array)) {
    // already patched
    return array;
  }

  arraysObserved.add(array);
  let selfAtom;
  const atoms = new Map();

  function reportSelfAtom() {
    if (!selfAtom) {
      const handler = event => {
        if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
          selfAtom.reportChanged();
        }
      };

      selfAtom = createAtom("map", () => {
        array.observe(handler);
      }, () => {
        array.unobserve(handler);
      });
    }

    selfAtom.reportObserved(array._implicitObserver);
  }

  function reportArrayElementAtom(key) {
    let atom = atoms.get(key); // possible optimization: only register a single handler for all keys

    if (!atom) {
      const handler = event => {
        // TODO: detect key of changed element
        // if (event.keys.has(key + "")) {
        //   if (
        //     event.changes.added.size ||
        //     event.changes.deleted.size ||
        //     event.changes.keys.size ||
        //     event.changes.delta.length
        //   ) {
        atom.reportChanged(); // }
      };

      atom = createAtom(key + "", () => {
        array.observe(handler);
      }, () => {
        array.unobserve(handler);
      });
      atoms.set(key, atom);
    }

    atom.reportObserved(array._implicitObserver);
  }

  const originalGet = array.get;

  array.get = function (key) {
    if (typeof key !== "number") {
      throw new Error("unexpected");
    }

    reportArrayElementAtom(key);
    const ret = Reflect.apply(originalGet, this, arguments);
    return ret;
  };

  function patch(method) {
    const originalFunction = array[method];

    array[method] = function () {
      reportSelfAtom();
      const ret = Reflect.apply(originalFunction, this, arguments);
      return ret;
    };
  }

  patch("forEach");
  patch("toJSON");
  patch("toArray");
  patch("slice");
  patch("map"); // TODO: length, iterator

  return array;
}

const docsObserved = new WeakSet(); // TODO: add atoms, etc

function observeDoc(doc) {
  if (docsObserved.has(doc)) {
    // already patched
    return doc;
  }

  docsObserved.add(doc);
  const originalGet = doc.get;

  doc.get = function (key) {
    if (typeof key !== "string") {
      throw new Error("unexpected");
    }

    const ret = Reflect.apply(originalGet, this, arguments);
    return ret;
  };

  return doc;
}

const mapsObserved = new WeakSet();
function observeMap(map) {
  if (mapsObserved.has(map)) {
    // already patched
    return map;
  }

  mapsObserved.add(map);
  let selfAtom;
  const atoms = new Map();

  function reportSelfAtom() {
    if (!selfAtom) {
      const handler = event => {
        if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
          selfAtom.reportChanged();
        }
      };

      selfAtom = createAtom("map", () => {
        map.observe(handler);
      }, () => {
        map.unobserve(handler);
      });
    }

    selfAtom.reportObserved(map._implicitObserver);
  }

  function reportMapKeyAtom(key) {
    let atom = atoms.get(key); // possible optimization: only register a single handler for all keys

    if (!atom) {
      const handler = event => {
        if (event.keysChanged.has(key)) {
          if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
            atom.reportChanged();
          }
        }
      };

      atom = createAtom(key, () => {
        map.observe(handler);
      }, () => {
        map.unobserve(handler);
      });
      atoms.set(key, atom);
    }

    atom.reportObserved(map._implicitObserver);
  }

  const originalGet = map.get;

  map.get = function (key) {
    if (typeof key !== "string") {
      throw new Error("unexpected");
    }

    reportMapKeyAtom(key);
    const ret = Reflect.apply(originalGet, this, arguments);
    return ret;
  };

  function patch(method) {
    const originalFunction = map[method];

    map[method] = function () {
      reportSelfAtom();
      const ret = Reflect.apply(originalFunction, this, arguments);
      return ret;
    };
  }

  patch("values");
  patch("entries");
  patch("keys");
  patch("forEach");
  patch("toJSON"); // TODO: has, iterator

  return map;
}

const textAtoms = new WeakMap();
function observeText(value) {
  let atom = textAtoms.get(value);

  if (!atom) {
    const handler = _changes => {
      atom.reportChanged();
    };

    atom = createAtom("text", () => {
      value.observe(handler);
    }, () => {
      value.unobserve(handler);
    });
  }

  function patch(method) {
    const originalFunction = value[method];

    value[method] = function () {
      atom.reportObserved(this._implicitObserver);
      const ret = Reflect.apply(originalFunction, this, arguments);
      return ret;
    };
  }

  patch("toString");
  patch("toJSON");
  return value;
}

const xmlAtoms = new WeakMap();
function observeXml(value) {
  let atom = xmlAtoms.get(value);

  if (!atom) {
    const handler = event => {
      if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
        atom.reportChanged();
      }
    };

    atom = createAtom("xml", () => {
      value.observe(handler);
    }, () => {
      value.unobserve(handler);
    });
  }

  function patch(method) {
    const originalFunction = value[method];

    value[method] = function () {
      atom.reportObserved(this._implicitObserver);
      const ret = Reflect.apply(originalFunction, this, arguments);
      return ret;
    };
  }

  function patchGetter(method) {
    let target = value;
    let descriptor = Object.getOwnPropertyDescriptor(target, method); // properties might be defined down the prototype chain (e.g., properties on XmlFragment when working on an XmlElement)

    if (!descriptor) {
      target = Object.getPrototypeOf(target);
      descriptor = Object.getOwnPropertyDescriptor(target, method);
    }

    if (!descriptor) {
      target = Object.getPrototypeOf(target);
      descriptor = Object.getOwnPropertyDescriptor(target, method);
    }

    if (!descriptor) {
      throw new Error("property not found");
    }

    const originalFunction = descriptor.get;

    descriptor.get = function () {
      atom.reportObserved(this._implicitObserver);
      const ret = Reflect.apply(originalFunction, this, arguments);
      return ret;
    };

    Object.defineProperty(target, method, descriptor);
  }

  patch("toString");
  patch("toDOM");
  patch("toArray");
  patch("getAttribute");
  patchGetter("firstChild");
  return value;
}

function isYType(element) {
  return element instanceof Y.AbstractType || Object.prototype.hasOwnProperty.call(element, "autoLoad"); // detect subdocs. Is there a better way for this?
}
function observeYJS(element) {
  if (element instanceof Y.XmlText) {
    return observeText(element);
  } else if (element instanceof Y.Text) {
    return observeText(element);
  } else if (element instanceof Y.Array) {
    return observeArray(element);
  } else if (element instanceof Y.Map) {
    return observeMap(element);
  } else if (element instanceof Y.Doc || Object.prototype.hasOwnProperty.call(element, "autoLoad")) {
    // subdoc. Ok way to detect this?
    return observeDoc(element);
  } else if (element instanceof Y.XmlFragment) {
    return observeXml(element);
  } else if (element instanceof Y.XmlElement) {
    return observeXml(element);
  } else ;

  return element;
}
function makeYJSObservable() {
  Y.observeTypeCreated(el => {
    observeYJS(el);
  });
}

export { isYType, makeYJSObservable, observeDoc, observeMap, observeText, observeYJS, useMobxBindings, useReactiveBindings, useVueBindings, vueRef };
//# sourceMappingURL=yjs-reactive-bindings.modern.js.map
