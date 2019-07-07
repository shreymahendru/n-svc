"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const app_1 = require("./app");
const n_log_1 = require("@nivinjoseph/n-log");
const src_1 = require("../src");
const logger = new n_log_1.ConsoleLogger(n_log_1.LogDateTimeZone.est);
class Installer {
    install(registry) {
        n_defensive_1.given(registry, "registry").ensureHasValue().ensureIsObject();
        registry.registerInstance("Logger", logger);
    }
}
const service = new src_1.SvcApp();
service
    .useLogger(logger)
    .useInstaller(new Installer())
    .registerProgram(app_1.App);
service.bootstrap();
//# sourceMappingURL=service.js.map