import { given } from "@nivinjoseph/n-defensive";
import { Logger } from "@nivinjoseph/n-log";


export class ShutdownManager
{
    private readonly _logger: Logger;
    private readonly _cleanup: ReadonlyArray<() => Promise<any>>;
    private _isShutDown = false;
    private _shutdownPromise: Promise<void> | null = null;


    public get isShutdown(): boolean { return this._isShutDown; }


    public constructor(logger: Logger, cleanup: ReadonlyArray<() => Promise<any>>)
    {
        given(logger, "logger").ensureHasValue().ensureIsObject();
        this._logger = logger;
        
        given(cleanup, "cleanup").ensureHasValue().ensureIsArray().ensureIsNotEmpty();
        this._cleanup = cleanup;

        process
            .on("SIGINT", () =>
            {
                this._initiateShutdown("SIGINT").catch(e => this._logger.logError(e));
            })
            .on("SIGTERM", () =>
            {
                this._initiateShutdown("SIGTERM").catch(e => this._logger.logError(e));
            });
    }

    private async _initiateShutdown(signal: string): Promise<void>
    {
        await this._logger.logWarning(`SIGNAL RECEIVED (${signal})`);

        if (this._shutdownPromise == null)
            this._shutdownPromise = this._actuallyShutdown(signal);

        await this._shutdownPromise;
    }

    private async _actuallyShutdown(signal: string): Promise<void>
    {
        await this._logger.logWarning(`APPLICATION STOPPING (${signal})...`);

        if (this._isShutDown)
            return;

        this._isShutDown = true;

        await this._logger.logInfo("EXECUTING SHUTDOWN...");
        for (const action of this._cleanup)
        {
            try 
            {
                await action();
            }
            catch (error)
            {
                await this._logger.logWarning("ERROR DURING SHUTDOWN");
                await this._logger.logError(error as any);
            }
        }
        await this._logger.logInfo("SHUTDOWN COMPLETE");

        await this._logger.logWarning(`APPLICATION STOPPED (${signal})`);
        process.exit(0);
    }
}