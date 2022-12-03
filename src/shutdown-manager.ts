import { given } from "@nivinjoseph/n-defensive";


export class ShutdownManager
{
    private readonly _cleanup: ReadonlyArray<() => Promise<any>>;
    private _isShutDown = false;
    private _shutdownPromise: Promise<void> | null = null;


    public get isShutdown(): boolean { return this._isShutDown; }


    public constructor(cleanup: ReadonlyArray<() => Promise<any>>)
    {
        given(cleanup, "cleanup").ensureHasValue().ensureIsArray().ensureIsNotEmpty();
        this._cleanup = cleanup;

        process
            .on("SIGINT", () =>
            {
                this._initiateShutdown("SIGINT").catch(e => console.error(e));
            })
            .on("SIGTERM", () =>
            {
                this._initiateShutdown("SIGTERM").catch(e => console.error(e));
            });
    }

    private _initiateShutdown(signal: string): Promise<void>
    {
        console.warn(`SIGNAL RECEIVED (${signal})`);

        if (this._shutdownPromise == null)
            this._shutdownPromise = this._actuallyShutdown(signal);

        return this._shutdownPromise;
    }

    private async _actuallyShutdown(signal: string): Promise<void>
    {
        console.warn(`APPLICATION STOPPING (${signal})`);

        if (this._isShutDown)
            return;

        this._isShutDown = true;

        for (const action of this._cleanup)
        {
            try 
            {
                await action();
            }
            catch (error)
            {
                console.warn("Error during cleanup");
                console.warn(error);
            }
        }

        console.warn(`APPLICATION STOPPED (${signal})`);
        process.exit(0);
    }
}