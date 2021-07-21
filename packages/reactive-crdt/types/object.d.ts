import * as Y from "yjs";
import { INTERNAL_SYMBOL, ObjectSchemaType } from ".";
import { CRDTArray } from "./array";
import { Box } from "./boxed";
export declare type CRDTObject<T extends ObjectSchemaType> = {
    [P in keyof T]?: T[P] extends Box<infer A> ? Box<A> : T[P] extends Array<infer A> ? CRDTArray<A> : T[P] extends ObjectSchemaType ? CRDTObject<T[P]> : T[P];
} & {
    [INTERNAL_SYMBOL]?: Y.Map<T>;
};
export declare function crdtObject<T extends ObjectSchemaType>(initializer: T, map?: Y.Map<any>): CRDTObject<T>;
