"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvcApp = void 0;
const tslib_1 = require("tslib");
const n_ject_1 = require("@nivinjoseph/n-ject");
const n_exception_1 = require("@nivinjoseph/n-exception");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_log_1 = require("@nivinjoseph/n-log");
const n_config_1 = require("@nivinjoseph/n-config");
const shutdown_manager_1 = require("./shutdown-manager");
// public
class SvcApp {
    constructor(container) {
        this._programKey = "$program";
        this._programRegistered = false;
        this._disposeActions = new Array();
        this._isBootstrapped = false;
        // private _isShutDown = false;
        this._isCleanUp = false;
        (0, n_defensive_1.given)(container, "container").ensureIsObject().ensureIsType(n_ject_1.Container);
        if (container == null) {
            this._container = new n_ject_1.Container();
            this._ownsContainer = true;
        }
        else {
            this._container = container;
            this._ownsContainer = false;
        }
    }
    get containerRegistry() { return this._container; }
    useLogger(logger) {
        if (this._isBootstrapped)
            throw new n_exception_1.InvalidOperationException("useLogger");
        (0, n_defensive_1.given)(logger, "logger").ensureHasValue().ensureIsObject();
        this._logger = logger;
        return this;
    }
    useInstaller(installer) {
        if (this._isBootstrapped)
            throw new n_exception_1.InvalidOperationException("useInstaller");
        (0, n_defensive_1.given)(installer, "installer").ensureHasValue();
        this._container.install(installer);
        return this;
    }
    registerProgram(programClass) {
        if (this._isBootstrapped || this._programRegistered)
            throw new n_exception_1.InvalidOperationException("registerProgram");
        (0, n_defensive_1.given)(programClass, "programClass").ensureHasValue().ensureIsFunction();
        this._container.registerSingleton(this._programKey, programClass);
        this._programRegistered = true;
        return this;
    }
    registerDisposeAction(disposeAction) {
        if (this._isBootstrapped)
            throw new n_exception_1.InvalidOperationException("registerForDispose");
        (0, n_defensive_1.given)(disposeAction, "disposeAction").ensureHasValue().ensureIsFunction();
        this._disposeActions.push(() => {
            return new Promise((resolve) => {
                try {
                    disposeAction()
                        .then(() => resolve())
                        .catch((e) => {
                        this._logger.logError(e).finally(() => resolve());
                        // resolve();
                        // // tslint:disable-next-line
                        // this._logger.logError(e).then(() => resolve());
                    });
                }
                catch (error) {
                    this._logger.logError(error).finally(() => resolve());
                    // resolve();
                    // // tslint:disable-next-line
                    // this._logger.logError(error).then(() => resolve());
                }
            });
        });
        return this;
    }
    bootstrap() {
        if (this._isBootstrapped || !this._programRegistered)
            throw new n_exception_1.InvalidOperationException("bootstrap");
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this._logger)
            this._logger = new n_log_1.ConsoleLogger({
                useJsonFormat: n_config_1.ConfigurationManager.getConfig("env") !== "dev"
            });
        this._configureContainer();
        this._configureStartup()
            .then(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const appEnv = n_config_1.ConfigurationManager.getConfig("env");
            const appName = n_config_1.ConfigurationManager.getConfig("package.name");
            const appVersion = n_config_1.ConfigurationManager.getConfig("package.version");
            const appDescription = n_config_1.ConfigurationManager.getConfig("package.description");
            yield this._logger.logInfo(`ENV: ${appEnv}; NAME: ${appName}; VERSION: ${appVersion}; DESCRIPTION: ${appDescription}.`);
            this._configureShutDown();
            const p = this._program.start();
            this._isBootstrapped = true;
            yield this._logger.logInfo("SERVICE STARTED");
            yield p;
        }))
            .then(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this._shutdownManager.isShutdown)
                yield this._cleanUp();
        }))
            .then(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this._shutdownManager.isShutdown)
                yield this._logger.logInfo(`SERVICE COMPLETE`);
        }))
            .catch((err) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._logger.logWarning(`SERVICE ERROR`);
            yield this._logger.logError(err);
            process.exit(1);
        }));
    }
    _configureContainer() {
        if (this._ownsContainer)
            this._container.bootstrap();
        this.registerDisposeAction(() => this._container.dispose());
    }
    _configureStartup() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._logger.logInfo(`SERVICE STARTING...`);
            this._program = this._container.resolve(this._programKey);
        });
    }
    _configureShutDown() {
        this.registerDisposeAction(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._logger.logInfo("CLEANING UP. PLEASE WAIT...");
            // return Delay.seconds(ConfigurationManager.getConfig<string>("env") === "dev" ? 2 : 20);
        }));
        this._shutdownManager = new shutdown_manager_1.ShutdownManager(this._logger, [
            () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield this._logger.logInfo("STOPPING PROGRAM...");
                    yield this._program.stop();
                    yield this._logger.logInfo("PROGRAM STOPPED");
                }
                catch (error) {
                    yield this._logger.logWarning("ERROR STOPPING PROGRAM");
                    yield this._logger.logError(error);
                }
            }),
            () => this._cleanUp()
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
    _cleanUp() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._isCleanUp)
                return;
            this._isCleanUp = true;
            yield this._logger.logInfo("DISPOSE ACTIONS EXECUTING...");
            try {
                yield Promise.allSettled(this._disposeActions.map(t => t()));
                yield this._logger.logInfo("DISPOSE ACTIONS COMPLETE");
            }
            catch (error) {
                yield this._logger.logWarning("DISPOSE ACTIONS ERROR");
                yield this._logger.logError(error);
            }
        });
    }
}
exports.SvcApp = SvcApp;
//# sourceMappingURL=svc-app.js.map