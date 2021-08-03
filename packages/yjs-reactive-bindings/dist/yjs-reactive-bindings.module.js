import * as Y from 'yjs';

var customCreateAtom;
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

  customCreateAtom = function customCreateAtom(name, obo) {
    var id = 0;
    var data = vue.reactive({
      data: id
    });
    var atom = {
      reportObserved: function reportObserved() {
        return data.data;
      },
      reportChanged: function reportChanged() {
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
  customCreateAtom = function customCreateAtom(name, obo, obu) {
    // TMP
    var atom = reactive.createAtom(name);

    if (obo) {
      obo();
    }

    return atom;
  };
}

var arraysObserved = new WeakSet();
function observeArray(array) {
  if (arraysObserved.has(array)) {
    // already patched
    return array;
  }

  arraysObserved.add(array);
  var selfAtom;
  var atoms = new Map();

  function reportSelfAtom() {
    if (!selfAtom) {
      var handler = function handler(event) {
        if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
          selfAtom.reportChanged();
        }
      };

      selfAtom = createAtom("map", function () {
        array.observe(handler);
      }, function () {
        array.unobserve(handler);
      });
    }

    selfAtom.reportObserved(array._implicitObserver);
  }

  function reportArrayElementAtom(key) {
    var atom = atoms.get(key); // possible optimization: only register a single handler for all keys

    if (!atom) {
      var handler = function handler(event) {
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

      atom = createAtom(key + "", function () {
        array.observe(handler);
      }, function () {
        array.unobserve(handler);
      });
      atoms.set(key, atom);
    }

    atom.reportObserved(array._implicitObserver);
  }

  var originalGet = array.get;

  array.get = function (key) {
    if (typeof key !== "number") {
      throw new Error("unexpected");
    }

    reportArrayElementAtom(key);
    var ret = Reflect.apply(originalGet, this, arguments);
    return ret;
  };

  function patch(method) {
    var originalFunction = array[method];

    array[method] = function () {
      reportSelfAtom();
      var ret = Reflect.apply(originalFunction, this, arguments);
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

var docsObserved = new WeakSet(); // TODO: add atoms, etc

function observeDoc(doc) {
  if (docsObserved.has(doc)) {
    // already patched
    return doc;
  }

  docsObserved.add(doc);
  var originalGet = doc.get;

  doc.get = function (key) {
    if (typeof key !== "string") {
      throw new Error("unexpected");
    }

    var ret = Reflect.apply(originalGet, this, arguments);
    return ret;
  };

  return doc;
}

var mapsObserved = new WeakSet();
function observeMap(map) {
  if (mapsObserved.has(map)) {
    // already patched
    return map;
  }

  mapsObserved.add(map);
  var selfAtom;
  var atoms = new Map();

  function reportSelfAtom() {
    if (!selfAtom) {
      var handler = function handler(event) {
        if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
          selfAtom.reportChanged();
        }
      };

      selfAtom = createAtom("map", function () {
        map.observe(handler);
      }, function () {
        map.unobserve(handler);
      });
    }

    selfAtom.reportObserved(map._implicitObserver);
  }

  function reportMapKeyAtom(key) {
    var atom = atoms.get(key); // possible optimization: only register a single handler for all keys

    if (!atom) {
      var handler = function handler(event) {
        if (event.keysChanged.has(key)) {
          if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
            atom.reportChanged();
          }
        }
      };

      atom = createAtom(key, function () {
        map.observe(handler);
      }, function () {
        map.unobserve(handler);
      });
      atoms.set(key, atom);
    }

    atom.reportObserved(map._implicitObserver);
  }

  var originalGet = map.get;

  map.get = function (key) {
    if (typeof key !== "string") {
      throw new Error("unexpected");
    }

    reportMapKeyAtom(key);
    var ret = Reflect.apply(originalGet, this, arguments);
    return ret;
  };

  function patch(method) {
    var originalFunction = map[method];

    map[method] = function () {
      reportSelfAtom();
      var ret = Reflect.apply(originalFunction, this, arguments);
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

var textAtoms = new WeakMap();
function observeText(value) {
  var atom = textAtoms.get(value);

  if (!atom) {
    var handler = function handler(_changes) {
      atom.reportChanged();
    };

    atom = createAtom("text", function () {
      value.observe(handler);
    }, function () {
      value.unobserve(handler);
    });
  }

  function patch(method) {
    var originalFunction = value[method];

    value[method] = function () {
      atom.reportObserved(this._implicitObserver);
      var ret = Reflect.apply(originalFunction, this, arguments);
      return ret;
    };
  }

  patch("toString");
  patch("toJSON");
  return value;
}

var xmlAtoms = new WeakMap();
function observeXml(value) {
  var atom = xmlAtoms.get(value);

  if (!atom) {
    var handler = function handler(event) {
      if (event.changes.added.size || event.changes.deleted.size || event.changes.keys.size || event.changes.delta.length) {
        atom.reportChanged();
      }
    };

    atom = createAtom("xml", function () {
      value.observe(handler);
    }, function () {
      value.unobserve(handler);
    });
  }

  function patch(method) {
    var originalFunction = value[method];

    value[method] = function () {
      atom.reportObserved(this._implicitObserver);
      var ret = Reflect.apply(originalFunction, this, arguments);
      return ret;
    };
  }

  function patchGetter(method) {
    var target = value;
    var descriptor = Object.getOwnPropertyDescriptor(target, method); // properties might be defined down the prototype chain (e.g., properties on XmlFragment when working on an XmlElement)

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

    var originalFunction = descriptor.get;

    descriptor.get = function () {
      atom.reportObserved(this._implicitObserver);
      var ret = Reflect.apply(originalFunction, this, arguments);
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
  Y.observeTypeCreated(function (el) {
    observeYJS(el);
  });
}

export { isYType, makeYJSObservable, observeDoc, observeMap, observeText, observeYJS, useMobxBindings, useReactiveBindings, useVueBindings, vueRef };
//# sourceMappingURL=yjs-reactive-bindings.module.js.map
