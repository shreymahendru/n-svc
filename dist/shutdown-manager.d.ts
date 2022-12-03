export declare class ShutdownManager {
    private readonly _cleanup;
    private _isShutDown;
    private _shutdownPromise;
    get isShutdown(): boolean;
    constructor(cleanup: ReadonlyArray<() => Promise<any>>);
    private _initiateShutdown;
    private _actuallyShutdown;
}
