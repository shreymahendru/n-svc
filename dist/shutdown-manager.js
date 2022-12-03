"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutdownManager = void 0;
const tslib_1 = require("tslib");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class ShutdownManager {
    constructor(cleanup) {
        this._isShutDown = false;
        this._shutdownPromise = null;
        (0, n_defensive_1.given)(cleanup, "cleanup").ensureHasValue().ensureIsArray().ensureIsNotEmpty();
        this._cleanup = cleanup;
        process
            .on("SIGINT", () => {
            this._initiateShutdown("SIGINT").catch(e => console.error(e));
        })
            .on("SIGTERM", () => {
            this._initiateShutdown("SIGTERM").catch(e => console.error(e));
        });
    }
    get isShutdown() { return this._isShutDown; }
    _initiateShutdown(signal) {
        console.warn(`SIGNAL RECEIVED (${signal})`);
        if (this._shutdownPromise == null)
            this._shutdownPromise = this._actuallyShutdown(signal);
        return this._shutdownPromise;
    }
    _actuallyShutdown(signal) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.warn(`APPLICATION STOPPING (${signal})`);
            if (this._isShutDown)
                return;
            this._isShutDown = true;
            for (const action of this._cleanup) {
                try {
                    yield action();
                }
                catch (error) {
                    console.warn("Error during cleanup");
                    console.warn(error);
                }
            }
            console.warn(`APPLICATION STOPPED (${signal})`);
            process.exit(0);
        });
    }
}
exports.ShutdownManager = ShutdownManager;
//# sourceMappingURL=shutdown-manager.js.map