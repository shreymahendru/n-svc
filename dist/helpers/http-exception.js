"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_exception_1 = require("@nivinjoseph/n-exception");
require("@nivinjoseph/n-ext");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class HttpException extends n_exception_1.Exception {
    get statusCode() { return this._statusCode; }
    get body() { return this._body; }
    constructor(statusCode, body) {
        n_defensive_1.given(statusCode, "statusCode").ensureHasValue()
            .ensure(t => [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410,
            411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
            500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511].some(u => u === t));
        super("HTTP status {0}".format(statusCode.toString()));
        this._statusCode = statusCode;
        this._body = body;
    }
}
exports.HttpException = HttpException;
//# sourceMappingURL=http-exception.js.map