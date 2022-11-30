"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvcApp = void 0;
const tslib_1 = require("tslib");
const n_ject_1 = require("@nivinjoseph/n-ject");
const n_exception_1 = require("@nivinjoseph/n-exception");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_log_1 = require("@nivinjoseph/n-log");
const n_config_1 = require("@nivinjoseph/n-config");
// public
class SvcApp {
    constructor(container) {
        this._programKey = "$program";
        this._programRegistered = false;
        this._disposeActions = new Array();
        this._isBootstrapped = false;
        this._isShutDown = false;
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
                        console.error(e);
                        resolve();
                        // // tslint:disable-next-line
                        // this._logger.logError(e).then(() => resolve());
                    });
                }
                catch (error) {
                    console.error(error);
                    resolve();
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
            this._logger = new n_log_1.ConsoleLogger();
        this._configureContainer();
        this._configureStartup()
            .then(() => {
            const appEnv = n_config_1.ConfigurationManager.getConfig("env");
            const appName = n_config_1.ConfigurationManager.getConfig("package.name");
            const appVersion = n_config_1.ConfigurationManager.getConfig("package.version");
            const appDescription = n_config_1.ConfigurationManager.getConfig("package.description");
            console.log(`ENV: ${appEnv}; NAME: ${appName}; VERSION: ${appVersion}; DESCRIPTION: ${appDescription}.`);
            const p = this._program.start();
            this._configureShutDown();
            this._isBootstrapped = true;
            console.log("SERVICE STARTED!");
            return p;
        })
            .then(() => {
            console.log(`SERVICE COMPLETE!`);
            return this._cleanUp();
        })
            .then(() => this._cleanUp())
            .catch((err) => {
            console.error(`SERVICE ERROR!!!`);
            console.error(err);
            process.exit(1);
        });
    }
    _configureContainer() {
        if (this._ownsContainer)
            this._container.bootstrap();
        this.registerDisposeAction(() => this._container.dispose());
    }
    _configureStartup() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log(`SERVICE STARTING...`);
            this._program = this._container.resolve(this._programKey);
        });
    }
    _configureShutDown() {
        this.registerDisposeAction(() => {
            console.log("CLEANING UP. PLEASE WAIT...");
            // return Delay.seconds(ConfigurationManager.getConfig<string>("env") === "dev" ? 2 : 20);
            return Promise.resolve();
        });
        process.on("SIGTERM", () => {
            this._shutDown("SIGTERM").catch(e => console.error(e));
        });
        process.on("SIGINT", () => {
            this._shutDown("SIGINT").catch(e => console.error(e));
        });
    }
    _shutDown(signal) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._isShutDown)
                return;
            this._isShutDown = true;
            yield this._program.stop();
            console.warn(`SERVICE STOPPING (${signal}).`);
            yield this._cleanUp();
            console.warn(`SERVICE STOPPED (${signal}).`);
            process.exit(0);
        });
    }
    _cleanUp() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._isCleanUp)
                return;
            this._isCleanUp = true;
            console.log("Dispose actions executing.");
            try {
                yield Promise.all(this._disposeActions.map(t => t()));
                console.log("Dispose actions complete.");
            }
            catch (error) {
                console.warn("Dispose actions error.");
                console.error(error);
            }
        });
    }
}
exports.SvcApp = SvcApp;
//# sourceMappingURL=svc-app.js.map