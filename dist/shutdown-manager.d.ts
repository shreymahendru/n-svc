import { Logger } from "@nivinjoseph/n-log";
export declare class ShutdownManager {
    private readonly _logger;
    private readonly _cleanup;
    private _isShutDown;
    private _shutdownPromise;
    get isShutdown(): boolean;
    constructor(logger: Logger, cleanup: ReadonlyArray<() => Promise<any>>);
    private _initiateShutdown;
    private _actuallyShutdown;
}
//# sourceMappingURL=shutdown-manager.d.ts.map