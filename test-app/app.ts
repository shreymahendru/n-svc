import { inject } from "@nivinjoseph/n-ject";
import { Logger } from "@nivinjoseph/n-log";
import { given } from "@nivinjoseph/n-defensive";
import { Program } from "../src";
import { Delay } from "@nivinjoseph/n-util";


@inject("Logger")
export class App implements Program
{
    private readonly _logger: Logger;
    private _stopRequested: boolean;


    public constructor(logger: Logger)
    {
        given(logger, "logger").ensureHasValue().ensureIsObject();
        this._logger = logger;
        
        this._stopRequested = false;
    }


    public async start(): Promise<void>
    {
        let index = 1;
        
        while (index <= 15 && !this._stopRequested)
        {
            await this._logger.logInfo(`${index} I am running...`);
            index++;
            await Delay.seconds(1);
        }
    }
    
    public async stop(): Promise<void>
    {
        this._stopRequested = true;
        
        await this._logger.logInfo("I am stopping...");
        
        await Delay.seconds(2);
    }
}