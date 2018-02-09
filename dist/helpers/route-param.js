"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
require("@nivinjoseph/n-ext");
const n_exception_1 = require("@nivinjoseph/n-exception");
const http_exception_1 = require("./http-exception");
class RouteParam {
    constructor(routeParam) {
        this._order = 0;
        n_defensive_1.given(routeParam, "routeParam").ensureHasValue().ensure(t => !t.isEmptyOrWhiteSpace());
        let param = routeParam.trim();
        let paramKey;
        let paramType;
        let isQuery = false;
        let isOptional = false;
        if (param.endsWith("[Q]")) {
            isQuery = true;
            param = param.replace("[Q]", "");
        }
        if (param.contains(":")) {
            let splitted = param.split(":");
            if (splitted.length > 2 || splitted[0].isEmptyOrWhiteSpace() || splitted[1].isEmptyOrWhiteSpace())
                throw new n_exception_1.InvalidArgumentException("routeParam");
            paramKey = splitted[0].trim();
            paramType = splitted[1].trim().toLowerCase();
            if (paramType !== ParamTypes.boolean && paramType !== ParamTypes.number && paramType !== ParamTypes.string)
                paramType = ParamTypes.any;
        }
        else {
            paramKey = param;
            paramType = ParamTypes.any;
        }
        if (paramKey.endsWith("?")) {
            if (!isQuery)
                throw new n_exception_1.ApplicationException("Path parameters cannot be optional.");
            paramKey = paramKey.substr(0, paramKey.length - 1);
            isOptional = true;
        }
        this._param = param;
        this._paramKey = paramKey;
        this._paramType = paramType;
        this._isQuery = isQuery;
        this._isOptional = isOptional;
    }
    get param() { return this._param; }
    get paramKey() { return this._paramKey; }
    get paramType() { return this._paramType; }
    get isQuery() { return this._isQuery; }
    get isOptional() { return this._isOptional; }
    get order() { return this._order; }
    setOrder(order) {
        n_defensive_1.given(order, "order").ensureHasValue();
        if (this._order > 0)
            throw new n_exception_1.InvalidOperationException("setOrder");
        this._order = order;
    }
    parseParam(value) {
        if (value === undefined || value == null || value.isEmptyOrWhiteSpace() || value.trim().toLowerCase() === "null") {
            if (this._isOptional)
                return null;
            throw new http_exception_1.HttpException(404);
        }
        value = value.trim();
        if (this._paramType === ParamTypes.string || this._paramType === ParamTypes.any)
            return value;
        try {
            return this._paramType === ParamTypes.number ? this.parseNumber(value) : this.parseBoolean(value);
        }
        catch (error) {
            if (this._isOptional)
                return null;
            throw error;
        }
    }
    parseNumber(value) {
        try {
            let num = value.contains(".") ? Number.parseFloat(value) : Number.parseInt(value);
            if (!Number.isNaN(num))
                return num;
            throw "PARSE ERROR";
        }
        catch (error) {
            throw new http_exception_1.HttpException(404);
        }
    }
    parseBoolean(value) {
        value = value.toLowerCase();
        if (value === "true")
            return true;
        if (value === "false")
            return false;
        throw new http_exception_1.HttpException(404);
    }
}
exports.RouteParam = RouteParam;
class ParamTypes {
    static get boolean() { return this._boolean; }
    static get number() { return this._number; }
    static get string() { return this._string; }
    static get any() { return this._any; }
}
ParamTypes._boolean = "boolean";
ParamTypes._number = "number";
ParamTypes._string = "string";
ParamTypes._any = "any";
//# sourceMappingURL=route-param.js.map