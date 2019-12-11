"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const n_ject_1 = require("@nivinjoseph/n-ject");
const n_exception_1 = require("@nivinjoseph/n-exception");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_log_1 = require("@nivinjoseph/n-log");
const n_util_1 = require("@nivinjoseph/n-util");
const n_config_1 = require("@nivinjoseph/n-config");
class SvcApp {
    constructor() {
        this._programKey = "$program";
        this._programRegistered = false;
        this._disposeActions = new Array();
        this._isBootstrapped = false;
        this._program = null;
        this._isShutDown = false;
        this._isCleanUp = false;
        this._container = new n_ject_1.Container();
    }
    get containerRegistry() { return this._container; }
    useLogger(logger) {
        if (this._isBootstrapped)
            throw new n_exception_1.InvalidOperationException("useLogger");
        n_defensive_1.given(logger, "logger").ensureHasValue().ensureIsObject();
        this._logger = logger;
        return this;
    }
    useInstaller(installer) {
        if (this._isBootstrapped)
            throw new n_exception_1.InvalidOperationException("useInstaller");
        n_defensive_1.given(installer, "installer").ensureHasValue();
        this._container.install(installer);
        return this;
    }
    registerProgram(programClass) {
        if (this._isBootstrapped || this._programRegistered)
            throw new n_exception_1.InvalidOperationException("registerProgram");
        n_defensive_1.given(programClass, "programClass").ensureHasValue().ensureIsFunction();
        this._container.registerSingleton(this._programKey, programClass);
        this._programRegistered = true;
        return this;
    }
    registerDisposeAction(disposeAction) {
        if (this._isBootstrapped)
            throw new n_exception_1.InvalidOperationException("registerForDispose");
        n_defensive_1.given(disposeAction, "disposeAction").ensureHasValue().ensureIsFunction();
        this._disposeActions.push(() => {
            return new Promise((resolve) => {
                try {
                    disposeAction()
                        .then(() => resolve())
                        .catch((e) => {
                        console.error(e);
                        resolve();
                    });
                }
                catch (error) {
                    console.error(error);
                    resolve();
                }
            });
        });
        return this;
    }
    bootstrap() {
        if (this._isBootstrapped || !this._programRegistered)
            throw new n_exception_1.InvalidOperationException("bootstrap");
        if (!this._logger)
            this._logger = new n_log_1.ConsoleLogger();
        this.configureContainer();
        this.configureStartup()
            .then(() => {
            const appEnv = n_config_1.ConfigurationManager.getConfig("env");
            const appName = n_config_1.ConfigurationManager.getConfig("appInfo.name");
            const appVersion = n_config_1.ConfigurationManager.getConfig("appInfo.version");
            const appDescription = n_config_1.ConfigurationManager.getConfig("appInfo.description");
            console.log(`ENV: ${appEnv}; NAME: ${appName}; VERSION: ${appVersion}; DESCRIPTION: ${appDescription}.`);
            const p = this._program.start();
            this.configureShutDown();
            this._isBootstrapped = true;
            console.log("SERVICE STARTED.");
            return p;
        })
            .then(() => {
            console.log(`SERVICE COMPLETE.`);
            return this.cleanUp();
        })
            .then(() => this.cleanUp())
            .catch((err) => {
            console.error(`SERVICE ERROR!!!`);
            console.error(err);
        });
    }
    configureContainer() {
        this._container.bootstrap();
        this.registerDisposeAction(() => this._container.dispose());
    }
    configureStartup() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`SERVICE STARTING.`);
            this._program = this._container.resolve(this._programKey);
        });
    }
    configureShutDown() {
        this.registerDisposeAction(() => {
            console.log("CLEANING UP. PLEASE WAIT...");
            return n_util_1.Delay.seconds(n_config_1.ConfigurationManager.getConfig("env") === "dev" ? 2 : 20);
        });
        process.on("SIGTERM", () => this.shutDown("SIGTERM"));
        process.on("SIGINT", () => this.shutDown("SIGINT"));
    }
    shutDown(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isShutDown)
                return;
            this._isShutDown = true;
            yield this._program.stop();
            console.warn(`SERVICE STOPPING (${signal}).`);
            yield this.cleanUp();
            console.warn(`SERVICE STOPPED (${signal}).`);
            process.exit(0);
        });
    }
    cleanUp() {
        return __awaiter(this, void 0, void 0, function* () {
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