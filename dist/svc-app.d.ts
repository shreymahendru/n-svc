import { Container, ComponentInstaller, Registry } from "@nivinjoseph/n-ject";
import { Logger } from "@nivinjoseph/n-log";
export declare class SvcApp {
    private readonly _container;
    private readonly _ownsContainer;
    private readonly _programKey;
    private _logger;
    private _programRegistered;
    private readonly _disposeActions;
    private _isBootstrapped;
    private _program;
    private _isShutDown;
    private _isCleanUp;
    get containerRegistry(): Registry;
    constructor(container?: Container);
    useLogger(logger: Logger): this;
    useInstaller(installer: ComponentInstaller): this;
    registerProgram(programClass: Function): this;
    registerDisposeAction(disposeAction: () => Promise<void>): this;
    bootstrap(): void;
    private _configureContainer;
    private _configureStartup;
    private _configureShutDown;
    private _shutDown;
    private _cleanUp;
}
