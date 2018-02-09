import "@nivinjoseph/n-ext";
export declare class RouteParam {
    private readonly _param;
    private readonly _paramKey;
    private readonly _paramType;
    private readonly _isQuery;
    private readonly _isOptional;
    private _order;
    readonly param: string;
    readonly paramKey: string;
    readonly paramType: string;
    readonly isQuery: boolean;
    readonly isOptional: boolean;
    readonly order: number;
    constructor(routeParam: string);
    setOrder(order: number): void;
    parseParam(value: string): any;
    private parseNumber(value);
    private parseBoolean(value);
}
