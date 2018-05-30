import { Container, ComponentInstaller } from "@nivinjoseph/n-ject";
import { InvalidOperationException } from "@nivinjoseph/n-exception";
import { given } from "@nivinjoseph/n-defensive";
import { Program } from "./program";


// public
export class SvcApp
{
    private readonly _container: Container;
    private readonly _programKey = "$program";
    private _programRegistered = false;
    private _isBootstrapped: boolean = false;
    
    
    
    public constructor()
    {
        this._container = new Container();
    }
    
    
    public useInstaller(installer: ComponentInstaller): this
    {
        if (this._isBootstrapped)
            throw new InvalidOperationException("useInstaller");

        given(installer, "installer").ensureHasValue();
        this._container.install(installer);
        return this;
    }
    
    public registerProgram(programClass: Function): this
    {
        if (this._isBootstrapped || this._programRegistered)
            throw new InvalidOperationException("registerProgram");

        given(programClass, "programClass").ensureHasValue().ensureIsFunction();
        this._container.registerSingleton(this._programKey, programClass);
        this._programRegistered = true;
        return this;
    }
    
    public bootstrap(): void
    {
        if (this._isBootstrapped || !this._programRegistered)
            throw new InvalidOperationException("bootstrap");

        this._container.bootstrap();
        
        this._isBootstrapped = true;
        
        let program = this._container.resolve<Program>(this._programKey);
        program.run()
            .then(() => console.log("Program complete."))
            .catch((err) => console.error("Program error:", err));
    }
}