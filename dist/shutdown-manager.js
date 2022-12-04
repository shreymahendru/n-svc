"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutdownManager = void 0;
const tslib_1 = require("tslib");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class ShutdownManager {
    constructor(logger, cleanup) {
        this._isShutDown = false;
        this._shutdownPromise = null;
        (0, n_defensive_1.given)(logger, "logger").ensureHasValue().ensureIsObject();
        this._logger = logger;
        (0, n_defensive_1.given)(cleanup, "cleanup").ensureHasValue().ensureIsArray().ensureIsNotEmpty();
        this._cleanup = cleanup;
        process
            .on("SIGINT", () => {
            this._initiateShutdown("SIGINT").catch(e => this._logger.logError(e));
        })
            .on("SIGTERM", () => {
            this._initiateShutdown("SIGTERM").catch(e => this._logger.logError(e));
        });
    }
    get isShutdown() { return this._isShutDown; }
    _initiateShutdown(signal) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._logger.logWarning(`SIGNAL RECEIVED (${signal})`);
            if (this._shutdownPromise == null)
                this._shutdownPromise = this._actuallyShutdown(signal);
            yield this._shutdownPromise;
        });
    }
    _actuallyShutdown(signal) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._logger.logWarning(`APPLICATION STOPPING (${signal})...`);
            if (this._isShutDown)
                return;
            this._isShutDown = true;
            yield this._logger.logInfo("EXECUTING SHUTDOWN...");
            for (const action of this._cleanup) {
                try {
                    yield action();
                }
                catch (error) {
                    yield this._logger.logWarning("ERROR DURING SHUTDOWN");
                    yield this._logger.logError(error);
                }
            }
            yield this._logger.logInfo("SHUTDOWN COMPLETE");
            yield this._logger.logWarning(`APPLICATION STOPPED (${signal})`);
            process.exit(0);
        });
    }
}
exports.ShutdownManager = ShutdownManager;
//# sourceMappingURL=shutdown-manager.js.map