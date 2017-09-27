import { given } from "n-defensive";
import "n-ext";
import { ApplicationException, ArgumentException } from "n-exception";
import { RouteParam } from "./route-param";

// route format: /api/Product/{id:number}?{name?:string}&{all:boolean}

export class RouteInfo
{
    private readonly _routeTemplate: string;
    private readonly _routeParams = new Array<RouteParam>();
    private readonly _routeParamsRegistry: { [index: string]: RouteParam } = {};
    private readonly _vueRoute: string;
    private readonly _pathSegments = new Array<string>();
    private readonly _routeKey: string;
    private _hasQuery: boolean;


    public get route(): string { return this._routeTemplate; }
    public get vueRoute(): string { return this._vueRoute; }
    public get params(): ReadonlyArray<RouteParam> { return this._routeParams; }
    public get pathSegments(): ReadonlyArray<string> { return this._pathSegments; }
    public get routeKey(): string { return this._routeKey; }


    public constructor(routeTemplate: string)
    {
        given(routeTemplate, "routeTemplate").ensureHasValue().ensure(t => !t.isEmptyOrWhiteSpace());
        routeTemplate = routeTemplate.trim();
        while (routeTemplate.contains(" "))
            routeTemplate = routeTemplate.replace(" ", "");

        if (routeTemplate.endsWith("/"))
            routeTemplate = routeTemplate.substr(0, routeTemplate.length - 1);

        if (routeTemplate.contains("//"))
            throw new ArgumentException("routeTemplate", "contains //");

        this._routeTemplate = routeTemplate;
        this.populateRouteParams();
        this._vueRoute = this.generateVueRoute(this._routeTemplate);
        this.populatePathSegments();
        this._routeKey = this.generateRouteKey();
    }


    public findRouteParam(key: string): RouteParam
    {
        given(key, "key").ensureHasValue().ensure(t => !t.isEmptyOrWhiteSpace());
        return this._routeParamsRegistry[key.trim().toLowerCase()];
    }

    public generateUrl(values: any): string
    {
        let url = this._routeTemplate;
        let hasQuery = this._hasQuery;

        for (let key in values)
        {
            let routeParam = this.findRouteParam(key);
            if (routeParam)
            {
                let param = "{" + routeParam.param + "}";
                let replacement = routeParam.isQuery
                    ? "{0}={1}".format(key, encodeURIComponent(values.getValue(key)))
                    : encodeURIComponent(values.getValue(key));
                url = url.replace(param, replacement);
            }
            else
            {
                url = `${url}${hasQuery ? "&" : "?"}${"{0}={1}".format(key, encodeURIComponent(values.getValue(key)))}`;
                hasQuery = true;
            }
        }

        return url;
    }

    private populateRouteParams(): void
    {
        let index = 1;
        for (let routeParam of this.extractTemplateParams(this._routeTemplate).map(t => new RouteParam(t)))
        {
            let key = routeParam.paramKey.toLowerCase();
            if (this._routeParamsRegistry[key])
                throw new ApplicationException("Invalid route template. Duplicate route params (case insensitive) detected.");

            routeParam.setOrder(index++);
            this._routeParamsRegistry[key] = routeParam;
            this._routeParams.push(routeParam);
        }
    }

    private extractTemplateParams(routeTemplate: string): Array<string>
    {
        let templateParams = new Array<string>();
        let queryFound = false;
        let startFound = false;
        let startIndex = 0;

        for (let i = 0; i < routeTemplate.length; i++)
        {
            if (routeTemplate[i] === "?" && !startFound)
            {
                if (queryFound)
                    throw new ApplicationException("Invalid route template. Unresolvable '?' characters detected.");

                queryFound = true;
            }

            if (routeTemplate[i] === "{")
            {
                if (startFound)
                    throw new ApplicationException("Invalid route template. Braces do not match.");

                startFound = true;
                startIndex = i + 1;
            }
            else if (routeTemplate[i] === "}")
            {
                if (!startFound)
                    throw new ApplicationException("Invalid route template. Braces do not match.");

                let value = routeTemplate.substring(startIndex, i);
                value = value.trim();
                if (queryFound) value = value + "[Q]";
                templateParams.push(value);
                startFound = false;
            }
        }

        this._hasQuery = queryFound;

        return templateParams;
    }

    private generateVueRoute(routeTemplate: string): string
    {
        for (let routeParam of this._routeParams)
        {
            let asItWas = "{" + routeParam.param + "}";
            if (!routeTemplate.contains(asItWas))
                throw new ApplicationException("Invalid route template.");

            routeTemplate = routeTemplate.replace(asItWas, ":{0}".format(routeParam.paramKey));
        }

        if (routeTemplate.contains("?"))
        {
            let splitted = routeTemplate.split("?");
            if (splitted.length > 2)
                throw new ApplicationException("Invalid route template. Unresolvable '?' characters detected.");

            routeTemplate = splitted[0];
        }

        return routeTemplate;
    }

    private populatePathSegments()
    {
        let routeTemplate = this._vueRoute;
        let pathSegments = new Array<string>();

        pathSegments.push("/");

        for (let item of routeTemplate.split("/"))
        {
            if (item === null || item.isEmptyOrWhiteSpace() || item.startsWith(":"))
                continue;

            if (pathSegments.some(t => t === item))
                throw new ArgumentException("routeTemplate", "cannot contain duplicate segments");

            pathSegments.push(item);
        }

        this._pathSegments.push(...pathSegments);
    }

    private generateRouteKey(): string
    {
        return this._pathSegments.join("/").replace("//", "/");
    }
}