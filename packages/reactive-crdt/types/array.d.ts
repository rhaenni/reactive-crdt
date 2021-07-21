import * as Y from "yjs";
import { INTERNAL_SYMBOL, ObjectSchemaType } from ".";
import { CRDTObject } from "./object";
import { Box } from "./boxed";
export declare type CRDTArray<T> = {
    [INTERNAL_SYMBOL]?: Y.Array<T>;
    [n: number]: T extends Box<infer A> ? A : T extends Array<infer A> ? CRDTArray<A> : T extends ObjectSchemaType ? CRDTObject<T> : T;
} & T[];
export declare function crdtArray<T>(initializer: T[], arr?: Y.Array<T>): CRDTArray<T>;
