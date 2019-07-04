"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const route_info_1 = require("./helpers/route-info");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class Utils {
    static generateUrl(route, params, baseUrl) {
        n_defensive_1.given(route, "route").ensureHasValue().ensure(t => !t.isEmptyOrWhiteSpace());
        let url = route.trim();
        if (baseUrl !== undefined && baseUrl != null) {
            baseUrl = baseUrl.trim();
            if (baseUrl.endsWith("/"))
                baseUrl = baseUrl.substr(0, baseUrl.length - 1);
            if (!url.startsWith("/"))
                url = "/" + url;
            url = baseUrl + url;
        }
        return params ? new route_info_1.RouteInfo(url).generateUrl(params) : url.replaceAll(" ", "");
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map