import * as Y from "yjs";
import { CRDTArray } from "./array";
import { CRDTObject } from "./object";
import { Box } from "./boxed";
import { JSONValue } from "./types";
export { useMobxBindings, useVueBindings } from "@reactivedata/yjs-reactive-bindings";
export declare const INTERNAL_SYMBOL: unique symbol;
export declare function getInternalMap<T extends ObjectSchemaType>(object: CRDTObject<T>): Y.Map<T>;
export declare function getInternalArray<T>(object: CRDTArray<T>): Y.Array<T>;
export declare function getInternalAny(object: any): CRDTArray<any> | CRDTObject<any> | undefined;
export declare function crdtValue<T extends NestedSchemaType>(value: T | Y.Array<any> | Y.Map<any>, parent: T | Y.Array<any> | Y.Map<any>): CRDTArray<any> | CRDTObject<any> | (T & string) | (T & Y.XmlFragment) | (T & Y.XmlHook) | (T & Y.Text) | (T & Box<any>) | (T & number) | (T & boolean);
export declare function crdt<T extends ObjectSchemaType>(doc: Y.Doc): CRDTObject<T>;
export declare type NestedSchemaType = JSONValue | ObjectSchemaType | Box<any> | Y.AbstractType<any> | NestedSchemaType[];
export declare type ObjectSchemaType = {
    [key: string]: NestedSchemaType;
};
export { Y };
