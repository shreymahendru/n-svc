"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("n-defensive");
require("n-ext");
const n_exception_1 = require("n-exception");
const route_param_1 = require("./route-param");
// route format: /api/Product/{id:number}?{name?:string}&{all:boolean}
class RouteInfo {
    constructor(routeTemplate) {
        this._routeParams = new Array();
        this._routeParamsRegistry = {};
        this._pathSegments = new Array();
        n_defensive_1.given(routeTemplate, "routeTemplate").ensureHasValue().ensure(t => !t.isEmptyOrWhiteSpace());
        routeTemplate = routeTemplate.trim();
        while (routeTemplate.contains(" "))
            routeTemplate = routeTemplate.replace(" ", "");
        if (routeTemplate.endsWith("/"))
            routeTemplate = routeTemplate.substr(0, routeTemplate.length - 1);
        if (routeTemplate.contains("//"))
            throw new n_exception_1.ArgumentException("routeTemplate", "contains //");
        this._routeTemplate = routeTemplate;
        this.populateRouteParams();
        this._vueRoute = this.generateVueRoute(this._routeTemplate);
        this.populatePathSegments();
        this._routeKey = this.generateRouteKey();
    }
    get route() { return this._routeTemplate; }
    get vueRoute() { return this._vueRoute; }
    get params() { return this._routeParams; }
    get pathSegments() { return this._pathSegments; }
    get routeKey() { return this._routeKey; }
    findRouteParam(key) {
        n_defensive_1.given(key, "key").ensureHasValue().ensure(t => !t.isEmptyOrWhiteSpace());
        return this._routeParamsRegistry[key.trim().toLowerCase()];
    }
    generateUrl(values) {
        let url = this._routeTemplate;
        let hasQuery = this._hasQuery;
        for (let key in values) {
            let routeParam = this.findRouteParam(key);
            if (routeParam) {
                let param = "{" + routeParam.param + "}";
                let replacement = routeParam.isQuery
                    ? "{0}={1}".format(key, encodeURIComponent(values.getValue(key)))
                    : encodeURIComponent(values.getValue(key));
                url = url.replace(param, replacement);
            }
            else {
                url = `${url}${hasQuery ? "&" : "?"}${"{0}={1}".format(key, encodeURIComponent(values.getValue(key)))}`;
                hasQuery = true;
            }
        }
        return url;
    }
    populateRouteParams() {
        let index = 1;
        for (let routeParam of this.extractTemplateParams(this._routeTemplate).map(t => new route_param_1.RouteParam(t))) {
            let key = routeParam.paramKey.toLowerCase();
            if (this._routeParamsRegistry[key])
                throw new n_exception_1.ApplicationException("Invalid route template. Duplicate route params (case insensitive) detected.");
            routeParam.setOrder(index++);
            this._routeParamsRegistry[key] = routeParam;
            this._routeParams.push(routeParam);
        }
    }
    extractTemplateParams(routeTemplate) {
        let templateParams = new Array();
        let queryFound = false;
        let startFound = false;
        let startIndex = 0;
        for (let i = 0; i < routeTemplate.length; i++) {
            if (routeTemplate[i] === "?" && !startFound) {
                if (queryFound)
                    throw new n_exception_1.ApplicationException("Invalid route template. Unresolvable '?' characters detected.");
                queryFound = true;
            }
            if (routeTemplate[i] === "{") {
                if (startFound)
                    throw new n_exception_1.ApplicationException("Invalid route template. Braces do not match.");
                startFound = true;
                startIndex = i + 1;
            }
            else if (routeTemplate[i] === "}") {
                if (!startFound)
                    throw new n_exception_1.ApplicationException("Invalid route template. Braces do not match.");
                let value = routeTemplate.substring(startIndex, i);
                value = value.trim();
                if (queryFound)
                    value = value + "[Q]";
                templateParams.push(value);
                startFound = false;
            }
        }
        this._hasQuery = queryFound;
        return templateParams;
    }
    generateVueRoute(routeTemplate) {
        for (let routeParam of this._routeParams) {
            let asItWas = "{" + routeParam.param + "}";
            if (!routeTemplate.contains(asItWas))
                throw new n_exception_1.ApplicationException("Invalid route template.");
            routeTemplate = routeTemplate.replace(asItWas, ":{0}".format(routeParam.paramKey));
        }
        if (routeTemplate.contains("?")) {
            let splitted = routeTemplate.split("?");
            if (splitted.length > 2)
                throw new n_exception_1.ApplicationException("Invalid route template. Unresolvable '?' characters detected.");
            routeTemplate = splitted[0];
        }
        return routeTemplate;
    }
    populatePathSegments() {
        let routeTemplate = this._vueRoute;
        let pathSegments = new Array();
        pathSegments.push("/");
        for (let item of routeTemplate.split("/")) {
            if (item === null || item.isEmptyOrWhiteSpace() || item.startsWith(":"))
                continue;
            if (pathSegments.some(t => t === item))
                throw new n_exception_1.ArgumentException("routeTemplate", "cannot contain duplicate segments");
            pathSegments.push(item);
        }
        this._pathSegments.push(...pathSegments);
    }
    generateRouteKey() {
        return this._pathSegments.join("/").replace("//", "/");
    }
}
exports.RouteInfo = RouteInfo;
//# sourceMappingURL=route-info.js.map