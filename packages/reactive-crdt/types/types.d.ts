export declare type Primitive = bigint | boolean | null | number | string | symbol | undefined;
export declare type JSONValue = Primitive | JSONObject | JSONArray;
export declare type JSONObject = {
    [key: string]: JSONValue;
};
export declare type JSONArray = Array<JSONValue>;
export declare function isYType(element: any): boolean;
