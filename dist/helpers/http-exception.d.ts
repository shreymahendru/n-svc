import { Exception } from "n-exception";
import "n-ext";
export declare class HttpException extends Exception {
    private readonly _statusCode;
    private readonly _body;
    readonly statusCode: number;
    readonly body: any;
    constructor(statusCode: number);
    constructor(statusCode: number, body: any);
}
