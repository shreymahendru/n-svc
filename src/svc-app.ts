import { Container, ComponentInstaller, Registry } from "@nivinjoseph/n-ject";
import { InvalidOperationException } from "@nivinjoseph/n-exception";
import { given } from "@nivinjoseph/n-defensive";
import { Program } from "./program";
import { Logger, ConsoleLogger } from "@nivinjoseph/n-log";
import { Delay } from "@nivinjoseph/n-util";
import { ConfigurationManager } from "@nivinjoseph/n-config";


// public
export class SvcApp
{
    private readonly _container: Container;
    private readonly _programKey = "$program";
    private _logger: Logger;
    private _programRegistered = false;
    private _disposeActions = new Array<() => Promise<void>>();
    private _isBootstrapped: boolean = false;
    private _program: Program | null = null;
    private _isShutDown = false;
    private _isCleanUp = false;
    
    
    public get containerRegistry(): Registry { return this._container; }
    
    
    public constructor()
    {
        this._container = new Container();
    }
    
    
    public useLogger(logger: Logger): this
    {
        if (this._isBootstrapped)
            throw new InvalidOperationException("useLogger");

        given(logger, "logger").ensureHasValue().ensureIsObject();

        this._logger = logger;
        return this;
    }
    
    public useInstaller(installer: ComponentInstaller): this
    {
        if (this._isBootstrapped)
            throw new InvalidOperationException("useInstaller");

        given(installer, "installer").ensureHasValue();
        this._container.install(installer);
        return this;
    }
    
    public registerProgram(programClass: Function): this
    {
        if (this._isBootstrapped || this._programRegistered)
            throw new InvalidOperationException("registerProgram");

        given(programClass, "programClass").ensureHasValue().ensureIsFunction();
        this._container.registerSingleton(this._programKey, programClass);
        this._programRegistered = true;
        return this;
    }
    
    public registerDisposeAction(disposeAction: () => Promise<void>): this
    {
        if (this._isBootstrapped)
            throw new InvalidOperationException("registerForDispose");

        given(disposeAction, "disposeAction").ensureHasValue().ensureIsFunction();

        this._disposeActions.push(() =>
        {
            return new Promise((resolve) =>
            {
                try 
                {
                    disposeAction()
                        .then(() => resolve())
                        .catch((e) =>
                        {
                            console.error(e);
                            resolve();
                            // // tslint:disable-next-line
                            // this._logger.logError(e).then(() => resolve());
                        });
                }
                catch (error)
                {
                    console.error(error);
                    resolve();
                    // // tslint:disable-next-line
                    // this._logger.logError(error).then(() => resolve());
                }
            });
        });
        return this;
    }
    
    public bootstrap(): void
    {
        if (this._isBootstrapped || !this._programRegistered)
            throw new InvalidOperationException("bootstrap");

        if (!this._logger)
            this._logger = new ConsoleLogger();
        
        this.configureContainer();
        
        this.configureStartup()
            .then(() =>
            {
                const p = this._program.start();
                this.configureShutDown();
                this._isBootstrapped = true;
                return p;
            })
            .then(() => this._logger.logInfo(`SERVICE COMPLETE.`))
            .then(() => this.cleanUp())
            .catch(async (err) =>
            {
                await this._logger.logWarning(`SERVICE ERROR!!!`);
                await this._logger.logError(err);
            });
    }
    
    private configureContainer(): void
    {
        this._container.bootstrap();
        this.registerDisposeAction(() => this._container.dispose());
    }
    
    private async configureStartup(): Promise<void>
    {
        await this._logger.logInfo(`SERVICE STARTING.`);
        this._program = this._container.resolve<Program>(this._programKey);
    }
    
    private configureShutDown(): void
    {
        this.registerDisposeAction(() =>
        {
            console.log("CLEANING UP. PLEASE WAIT...");
            return Delay.seconds(ConfigurationManager.getConfig<string>("env") === "dev" ? 2 : 20);
        });

        process.on("SIGTERM", () => this.shutDown("SIGTERM"));
        process.on("SIGINT", () => this.shutDown("SIGINT"));
    }
    
    private async shutDown(signal: string): Promise<void>
    {
        if (this._isShutDown)
            return;

        this._isShutDown = true;

        await this._program.stop();
        await this._logger.logWarning(`SERVICE STOPPING (${signal}).`);

        await this.cleanUp();   

        await this._logger.logWarning(`SERVICE STOPPED (${signal}).`);
        process.exit(0);    
    }
    
    private async cleanUp(): Promise<void>
    {
        if (this._isCleanUp)
            return;

        this._isCleanUp = true;
        
        await this._logger.logInfo("Dispose actions executing.");
        try
        {
            await Promise.all(this._disposeActions.map(t => t()));
            await this._logger.logInfo("Dispose actions complete.");
        }
        catch (error)
        {
            await this._logger.logWarning("Dispose actions error.");
            await this._logger.logError(error);
        }
    }
}