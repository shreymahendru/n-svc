import { Container, ComponentInstaller, Registry } from "@nivinjoseph/n-ject";
import { InvalidOperationException } from "@nivinjoseph/n-exception";
import { given } from "@nivinjoseph/n-defensive";
import { Program } from "./program";
import { Logger, ConsoleLogger } from "@nivinjoseph/n-log";
import { ConfigurationManager } from "@nivinjoseph/n-config";
import { ShutdownManager } from "./shutdown-manager";


// public
export class SvcApp
{
    private readonly _container: Container;
    private readonly _ownsContainer: boolean;
    private readonly _programKey = "$program";
    private _logger!: Logger;
    private _programRegistered = false;
    private readonly _disposeActions = new Array<() => Promise<void>>();
    private _isBootstrapped = false;
    private _program!: Program;
    // private _isShutDown = false;
    private _isCleanUp = false;
    // private _shutdownPromise: Promise<void> | null = null;
    private _shutdownManager!: ShutdownManager;
    
    
    public get containerRegistry(): Registry { return this._container; }
    
    
    public constructor(container?: Container)
    {
        given(container as Container, "container").ensureIsObject().ensureIsType(Container);
        if (container == null)
        {
            this._container = new Container();
            this._ownsContainer = true;
        }
        else
        {
            this._container = container;
            this._ownsContainer = false;
        }
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

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this._logger)
            this._logger = new ConsoleLogger();
        
        this._configureContainer();
        
        this._configureStartup()
            .then(() =>
            {
                const appEnv = ConfigurationManager.getConfig<string>("env");
                const appName = ConfigurationManager.getConfig<string>("package.name");
                const appVersion = ConfigurationManager.getConfig<string>("package.version");
                const appDescription = ConfigurationManager.getConfig<string>("package.description");

                console.log(`ENV: ${appEnv}; NAME: ${appName}; VERSION: ${appVersion}; DESCRIPTION: ${appDescription}.`);
                
                this._configureShutDown();
                
                const p = this._program.start();
                this._isBootstrapped = true;
                console.log("SERVICE STARTED!");
                return p;
            })
            .then(async () =>
            {
                if (!this._shutdownManager.isShutdown)
                    await this._cleanUp();
            })
            .then(() =>
            {
                if (!this._shutdownManager.isShutdown)
                    console.log(`SERVICE COMPLETE!`);
            })
            .catch((err) =>
            {
                console.error(`SERVICE ERROR!!!`);
                console.error(err);
                process.exit(1);
            });
    }
    
    private _configureContainer(): void
    {
        if (this._ownsContainer)
            this._container.bootstrap();
        
        this.registerDisposeAction(() => this._container.dispose());
    }
    
    private async _configureStartup(): Promise<void>
    {
        console.log(`SERVICE STARTING...`);
        this._program = this._container.resolve<Program>(this._programKey);
    }
    
    private _configureShutDown(): void
    {
        this.registerDisposeAction(() =>
        {
            console.log("CLEANING UP. PLEASE WAIT...");
            // return Delay.seconds(ConfigurationManager.getConfig<string>("env") === "dev" ? 2 : 20);
            return Promise.resolve();
        });
        
        
        this._shutdownManager = new ShutdownManager([
            (): Promise<void> => this._program.stop(),
            (): Promise<any> => this._cleanUp()
        ]);
        

        // process.on("SIGTERM", () =>
        // {
        //     this._shutDown("SIGTERM").catch(e => console.error(e));
        // });
        // process.on("SIGINT", () =>
        // {
        //     this._shutDown("SIGINT").catch(e => console.error(e));
        // });
    }
    
    // private async _shutDown(signal: string): Promise<void>
    // {
    //     console.warn(`SIGNAL RECEIVED (${signal})`);
        
    //     if (this._shutdownPromise == null)
    //         this._shutdownPromise = this._actuallyShutdown(signal);
        
    //     return this._shutdownPromise;
    // }
    
    // private async _actuallyShutdown(signal: string): Promise<void>
    // {
    //     console.warn(`SERVICE STOPPING (${signal})`);
        
    //     if (this._isShutDown)
    //         return;

    //     this._isShutDown = true;

    //     await this._program.stop();

    //     await this._cleanUp();

    //     console.warn(`SERVICE STOPPED (${signal})`);
    //     process.exit(0);  
    // }
    
    private async _cleanUp(): Promise<void>
    {
        if (this._isCleanUp)
            return;

        console.log("Dispose actions executing");
        
        this._isCleanUp = true;
        
        try
        {
            await Promise.all(this._disposeActions.map(t => t()));
            console.log("Dispose actions complete");
        }
        catch (error)
        {
            console.warn("Dispose actions error");
            console.error(error);
        }
    }
}