"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_ject_1 = require("@nivinjoseph/n-ject");
const n_exception_1 = require("@nivinjoseph/n-exception");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
// public
class SvcApp {
    constructor() {
        this._programKey = "$program";
        this._programRegistered = false;
        this._isBootstrapped = false;
        this._container = new n_ject_1.Container();
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
    bootstrap() {
        if (this._isBootstrapped || !this._programRegistered)
            throw new n_exception_1.InvalidOperationException("bootstrap");
        this._container.bootstrap();
        this._isBootstrapped = true;
        let program = this._container.resolve(this._programKey);
        const programType = program.getTypeName();
        console.log(`Program ${programType} started.`);
        program.run()
            .then(() => console.log(`Program ${programType} complete.`))
            .catch((err) => console.error(`Program ${programType} error:`, err));
    }
}
exports.SvcApp = SvcApp;
//# sourceMappingURL=svc-app.js.map