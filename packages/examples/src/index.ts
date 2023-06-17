import nodeCluster from "cluster";
import { Fleet, Options } from "eris-fleet";
import { inspect } from "util";
import { MyBotWorker } from "./bot";
import { MyServiceWorker } from "./service";

const options: Options = {
    token: process.env.token!,
    BotWorker: MyBotWorker,
    services: [{name: "myService", ServiceWorker: MyServiceWorker}]
}

const Admiral = new Fleet(options);

if (nodeCluster.isPrimary) {
    // Code to only run for your master process
    Admiral.on('log', m => console.log(m));
    Admiral.on('debug', m => console.debug(m));
    Admiral.on('warn', m => console.warn(m));
    Admiral.on('error', m => console.error(inspect(m)));

    
    // Logs stats when they arrive
    Admiral.on('stats', m => console.log(m));
}