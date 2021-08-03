import * as Y from "yjs";
import { observeArray } from "./types/array";
import { observeDoc } from "./types/doc";
import { observeMap } from "./types/map";
import { observeText } from "./types/text";
import { observeXml } from "./types/xml";

export function isYType(element: any) {
  return element instanceof Y.AbstractType || Object.prototype.hasOwnProperty.call(element, "autoLoad"); // detect subdocs. Is there a better way for this?
}

export function observeYJS(element: Y.AbstractType<any> | Y.Doc) {
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
    return observeDoc((element as any) as Y.Doc);
  } else if (element instanceof Y.XmlFragment) {
    return observeXml(element);
  } else if (element instanceof Y.XmlElement) {
    return observeXml(element);
  } else {
    if (element._item === null && element._start === null) {
      // console.warn("edge case");
    } else {
      // throw new Error("not yet supported");
    }
  }
  return element;
}

export function makeYJSObservable() {
  Y.observeTypeCreated(el => {
    observeYJS(el);
  });
}

export { useMobxBindings, useReactiveBindings, useVueBindings, vueRef } from "./observableProvider";
export { observeText, observeMap, observeDoc };
