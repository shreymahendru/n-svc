import { ComponentInstaller } from "n-ject";
export declare class SvcApp {
    private readonly _container;
    private readonly _programKey;
    private _programRegistered;
    private _isBootstrapped;
    constructor();
    useInstaller(installer: ComponentInstaller): this;
    registerProgram(programClass: Function): this;
    bootstrap(): void;
}
