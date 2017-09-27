import "n-ext";
import { RouteParam } from "./route-param";
export declare class RouteInfo {
    private readonly _routeTemplate;
    private readonly _routeParams;
    private readonly _routeParamsRegistry;
    private readonly _vueRoute;
    private readonly _pathSegments;
    private readonly _routeKey;
    private _hasQuery;
    readonly route: string;
    readonly vueRoute: string;
    readonly params: ReadonlyArray<RouteParam>;
    readonly pathSegments: ReadonlyArray<string>;
    readonly routeKey: string;
    constructor(routeTemplate: string);
    findRouteParam(key: string): RouteParam;
    generateUrl(values: any): string;
    private populateRouteParams();
    private extractTemplateParams(routeTemplate);
    private generateVueRoute(routeTemplate);
    private populatePathSegments();
    private generateRouteKey();
}
