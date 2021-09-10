import { crdt, getInternalMap } from "@reactivedata/reactive-crdt";
import { Box, boxed } from "./boxed";
import * as Y from "yjs";

const doc1 = new Y.Doc();
let store1 = crdt<any>(doc1);
store1.mymap = {};
store1.myothermap = { test: store1.mymap };
