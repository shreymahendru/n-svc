import { ComponentInstaller, Registry } from "@nivinjoseph/n-ject";
import { given } from "@nivinjoseph/n-defensive";
import { App } from "./app";
import { ConsoleLogger, LogDateTimeZone } from "@nivinjoseph/n-log";
import { SvcApp } from "../src";


const logger = new ConsoleLogger({ logDateTimeZone: LogDateTimeZone.est });

class Installer implements ComponentInstaller
{
    public install(registry: Registry): void
    {
        given(registry, "registry").ensureHasValue().ensureIsObject();

        registry.registerInstance("Logger", logger);
    }
}


const service = new SvcApp();

service
    .useLogger(logger)
    .useInstaller(new Installer())
    .registerProgram(App)
    .bootstrap();