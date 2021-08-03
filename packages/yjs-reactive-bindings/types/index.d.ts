import * as Y from "yjs";
import { observeDoc } from "./types/doc";
import { observeMap } from "./types/map";
import { observeText } from "./types/text";
export declare function isYType(element: any): any;
export declare function observeYJS(element: Y.AbstractType<any> | Y.Doc): Y.AbstractType<any> | Y.Doc;
export declare function makeYJSObservable(): void;
export { useMobxBindings, useReactiveBindings, useVueBindings, vueRef } from "./observableProvider";
export { observeText, observeMap, observeDoc };
