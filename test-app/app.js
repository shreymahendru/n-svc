"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const tslib_1 = require("tslib");
const n_ject_1 = require("@nivinjoseph/n-ject");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
let App = class App {
    constructor(logger) {
        (0, n_defensive_1.given)(logger, "logger").ensureHasValue().ensureIsObject();
        this._logger = logger;
        this._stopRequested = false;
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let index = 1;
            while (index <= 15 && !this._stopRequested) {
                yield this._logger.logInfo(`${index} I am running...`);
                index++;
                yield n_util_1.Delay.seconds(1);
            }
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this._stopRequested = true;
            yield this._logger.logInfo("I am stopping...");
            yield n_util_1.Delay.seconds(2);
        });
    }
};
App = tslib_1.__decorate([
    (0, n_ject_1.inject)("Logger"),
    tslib_1.__metadata("design:paramtypes", [Object])
], App);
exports.App = App;
//# sourceMappingURL=app.js.map