import { Exception } from "n-exception";
import "n-ext";
import { given } from "n-defensive";

export class HttpException extends Exception
{
    private readonly _statusCode: number;
    private readonly _body: any;


    public get statusCode(): number { return this._statusCode; }
    public get body(): any { return this._body; }


    public constructor(statusCode: number);
    public constructor(statusCode: number, body: any);
    public constructor(statusCode: number, body?: any)
    {
        given(statusCode, "statusCode").ensureHasValue()
            .ensure(t => [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410,
                411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
                500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511].some(u => u === t));

        super("HTTP status {0}".format(statusCode.toString()));

        this._statusCode = statusCode;
        this._body = body;
    }
}