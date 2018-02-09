import { RouteInfo } from "./helpers/route-info";
import { given } from "@nivinjoseph/n-defensive";


// public
export abstract class Utils // static class
{
    public static generateUrl(route: string, params?: object, baseUrl?: string): string
    {
        given(route, "route").ensureHasValue().ensure(t => !t.isEmptyOrWhiteSpace());

        let url = route.trim();

        if (baseUrl !== undefined && baseUrl != null)
        {
            baseUrl = baseUrl.trim();
            if (baseUrl.endsWith("/"))
                baseUrl = baseUrl.substr(0, baseUrl.length - 1);

            if (!url.startsWith("/"))
                url = "/" + url;

            url = baseUrl + url;
        }

        return params ? new RouteInfo(url).generateUrl(params) : url.replaceAll(" ", "");
    }
}