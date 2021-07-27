import { crdt, Y } from "./packages/reactive-crdt/dist/reactive-crdt.js";
//import { Box, boxed } from "../src/boxed";
//import * as Y from "yjs";

const doc1 = new Y.Doc();
let store1 = crdt(doc1);
store1.arr = [];
store1.arr.push({ title: "Todo 1", completed: true });
store1.arr.push({ title: "Todo 2", completed: false });
let filtered_array = store1.arr.filter(x => !x.completed);
console.log("fa", filtered_array, filtered_array.length);
store1.arr = filtered_array;
/* store1.arr = [
  { title: "Todo 1", completed: true },
  { title: "Todo 2", completed: false }
]; */
