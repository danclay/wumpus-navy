<div align="center">
  <p>
  <a href="https://github.com/OceanicJS/Oceanic"><img src="https://img.shields.io/badge/Discord%20Library-Oceanic-blue?style=flat-square" alt="Discord Library" /></a>
    <!--<a href="https://www.npmjs.com/package/oceanic-fleet"><img src="https://img.shields.io/npm/v/oceanic-fleet.svg?cacheSeconds=3600&style=flat-square&label=version&logo=npm" alt="NPM version" /> <img alt="Downloads" src="https://img.shields.io/npm/dw/oceanic-fleet?style=flat-square" /></a>-->
    <a href="https://raw.githubusercontent.com/danclay/wumpus-navy/master/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/oceanic-fleet?style=flat-square" /></a>
    <!--<a href="https://github.com/danclay/wumpus-navy/actions/workflows/ci.yml"><img src="https://img.shields.io/github/workflow/status/danclay/wumpus-navy/Node.js%20CI/master?style=flat-square&logo=github" alt="Node.js CI" /></a>-->
    <!--<a href="https://github.com/danclay/wumpus-navy"><img alt="Stars" src="https://img.shields.io/github/stars/danclay/wumpus-navy?style=social" /></a>-->
  </p>
  <p>
    <a href="https://www.npmjs.com/package/oceanic-fleet/"><img src="https://nodei.co/npm/oceanic-fleet.svg" /></a>
  </p>
</div>

### [Documentation](https://danclay.github.io/wumpus-navy/) | [Github](https://github.com/danclay/wumpus-navy) | [Oceanic](https://github.com/OceanicJS/Oceanic)

# About oceanic-fleet

A spin-off of [eris-sharder](https://github.com/discordware/eris-sharder) and [megane](https://github.com/brussell98/megane) with services and configurable logging.

For detailed documentation check the [docs](https://danclay.github.io/wumpus-navy/).

oceanic-fleet currently supports Oceanic v1.x

## Highlighted Features:

- Clustering into many processes to use more cores
- Sharding
- Recalculate shards with minimal downtime
- Update a bot with minimal downtime using soft restarts
- Customizable logging
- Fetch data from across clusters easily
- Services (non-Oceanic workers)
- IPC to communicate between clusters, other clusters, and services
- Detailed stats collection
- Soft cluster and service restarts where the old worker is killed after the new one is ready
- Graceful shutdowns
- Central request handler
- Central data store
- Can use a modified version of the Oceanic client
- Concurrency support
- Fully typed for Typescript

A very basic diagram:

![Basic diagram](https://cdn.discordapp.com/attachments/866590047436144641/965161462479859742/Untitled_Diagram.drawio_1.png)

## Help

If you still have questions, you can join the support server on Discord: [Discord server](https://discord.gg/tk2n3naJn3)

[![Support server on Discord](https://discord.com/api/guilds/866589508392976384/widget.png?style=banner2)](https://discord.gg/tk2n3naJn3)

# Installation
Run `npm install oceanic-fleet` or with yarn: `yarn add oceanic-fleet`.

To use a less refined, but more up-to-date branch, use `npm install danclay/wumpus-navy#dev` or `yarn add danclay/wumpus-navy#dev`. [Documentation for the dev branch.](https://github.com/danclay/wumpus-navy/tree/dev)

# Basics

Some working examples are in [test/](https://github.com/danclay/wumpus-navy/tree/master/test).

## Naming Conventions
| Term | Description |
|-----------|----------------------------------------------------------------------------|
| "fleet" | All the components below |
| "admiral" | A single sharding manager |
| "worker" | A worker for node clustering |
| "cluster" | A worker containing Oceanic shards |
| "service" | A worker that does not contain Oceanic shards, but can interact with clusters |

## Get Started
To get started, you will need at least 2 files:
1. Your file which will create the fleet. This will be called "index.js" for now.
2. Your file containing your bot code. This will be called "bot.js" for now. This file will extend [BaseClusterWorker](https://danclay.github.io/wumpus-navy/classes/BaseClusterWorker.html)

In the example below, the variable `options` is passed to the admiral. [Read the docs](https://danclay.github.io/wumpus-navy/interfaces/Options.html) for what options you can pass.

Here is an example of `index.js`:
```js
const { isMaster } = require('cluster');
const { Fleet } = require('oceanic-fleet');
const path = require('path');
const { inspect } = require('util');

require('dotenv').config();

const options = {
    path: path.join(__dirname, "./bot.js"),
    token: process.env.token
}

const Admiral = new Fleet(options);

if (isMaster) {
    // Code to only run for your master process
    Admiral.on('log', m => console.log(m));
    Admiral.on('debug', m => console.debug(m));
    Admiral.on('warn', m => console.warn(m));
    Admiral.on('error', m => console.error(inspect(m)));

    // Logs stats when they arrive
    Admiral.on('stats', m => console.log(m));
}
```
This creates a new Admiral that will manage `bot.js` running in other processes. [More details](https://danclay.github.io/wumpus-navy/classes/BaseClusterWorker.html)

The following is an example of `bot.js`. [Read the IPC docs](https://danclay.github.io/wumpus-navy/classes/IPC.html) for what you can access and do with clusters.
```js
const { BaseClusterWorker } = require('oceanic-fleet');

module.exports = class BotWorker extends BaseClusterWorker {
    constructor(setup) {
        // Do not delete this super.
        super(setup);

        this.bot.on('messageCreate', this.handleMessage.bind(this));

        // Demonstration of the properties the cluster has (Keep reading for info on IPC):
        this.ipc.log(this.workerID); // ID of the worker
        this.ipc.log(this.clusterID); // The ID of the cluster
    }

    async handleMessage(msg) {
        if (msg.content === "!ping" && !msg.author.bot) {
            this.bot.createMessage(msg.channel.id, "Pong!");
        }
    }

	handleCommand(dataSentInCommand) {
		// Optional function to return data from this cluster when requested
		return "hello!"
	}

    shutdown(done) {
        // Optional function to gracefully shutdown things if you need to.
        done(); // Use this function when you are done gracefully shutting down.
    }
}
```
**Make sure your bot file extends BaseClusterWorker!**
The bot above will respond with "Pong!" when it receives the command "!ping".

## Services

You can create services for your bot. Services are workers which do not interact directly with Oceanic. Services are useful for processing tasks, a central location to get the latest version of languages for your bot, custom statistics, and more! [Read the IPC docs](https://danclay.github.io/wumpus-navy/classes/IPC.html) for what you can access and do with services. **Note that services always start before the clusters. Clusters will only start after all the services have started.** [More details](https://danclay.github.io/wumpus-navy/classes/BaseServiceWorker.html)

To add a service, add the following to the options you pass to the fleet:

```js
const options = {
    // Your other options...
    services: [{name: "myService", path: path.join(__dirname, "./service.js")}]
}
```
Add a new array element for each service you want to register. Make sure each service has a unique name or else the fleet will crash.

Here is an example of `service.js`:

```js
const { BaseServiceWorker } = require('oceanic-fleet');

module.exports = class ServiceWorker extends BaseServiceWorker {
    constructor(setup) {
        // Do not delete this super.
        super(setup);

        // Run this function when your service is ready for use. This MUST be run for the worker spawning to continue.
        this.serviceReady();

        // Demonstration of the properties the service has (Keep reading for info on IPC):
    	this.ipc.log(this.workerID); // ID of the worker
    	this.ipc.log(this.serviceName); // The name of the service

    }
    // This is the function which will handle commands
    async handleCommand(dataSentInCommand) {
        // Return a response if you want to respond
        return dataSentInCommand.smileyFace;
    }

    shutdown(done) {
        // Optional function to gracefully shutdown things if you need to.
        done(); // Use this function when you are done gracefully shutting down.
    }
}
```

**Make sure your service file extends BaseServiceWorker!**
This service will simply return a value within an object sent to it within the command message called "smileyFace". Services can be used for much more than this though. To send a command to this service, you could use this:

```js
const reply = await this.ipc.command("myService", {smileyFace: ":)"}, true);
this.bot.createMessage(msg.channel.id, reply);
```

This command is being sent using the IPC. In this command, the first argument is the name of the service to send the command to, the second argument is the message to send it (in this case a simple object), and the third argument is whether you want a response (this will default to false unless you specify "true"). If you want a response, you must `await` the command or use `.then()`.

### Handling service errors

If you encounter an error while starting your service, run `this.serviceStartingError('error here')` instead of `this.serviceReady()`. Using this will report an error and restart the worker. **Note that services always start before the clusters, so if your service keeps having starting errors your bot will be stuck in a loop.** This issue may be fixed in the future from some sort of maxRestarts option, but this is currently not a functionality.

If you encounter an error when processing a command within your service, you can do the following to reject the promise:
```js
// handleCommand function within the ServiceWorker class
async handleCommand(dataSentInCommand) {
    // Rejects the promise
    return {err: "Uh oh.. an error!"};
}
```
When sending the command, you can do the following to deal with the error:
```js
this.ipc.command("myService", {smileyFace: ":)"}, true).then((reply) => {
    // A successful response
    this.bot.createMessage(msg.channel.id, reply);
}).catch((e) => {
    // Do whatever you want with the error
    console.error(e);
});
```

# In-depth

Below is more in-depth documentation.

## Admiral 

### Admiral options

Visit [the docs](https://danclay.github.io/wumpus-navy/interfaces/Options.html) for a complete list of options.

### Admiral events

Visit [the docs](https://danclay.github.io/wumpus-navy/classes/Fleet.html) for a complete list of events.

### Central Request Handler

The central request handler forwards Oceanic requests to the master process where the request is sent to a single Oceanic request handler instance. This helps to prevent 429 errors from occurring when you have x number of clusters keeping track of ratelimiting separately. When a response is received, it is sent back to the cluster's Oceanic client.

### Large Bots

If you are using a "very large bot," Discord's special gateway settings apply. Ensure your shard count is a multiple of the number set by Discord or set `options.shards` and `options.guildsPerShard` to `"auto"`. You may also be able to use concurrency (see below).

If your bot is really large such that it spans many machines you can still use oceanic-fleet. However, no official way exists of doing this and possible configurations are very subjective. I suggest making an API which assigns first and last shards to seperate Admirals and a service which connects to said central API to conduct IPC requests and management tasks. Your API would have to route requests accordingly. All IPC requests would be relayed through said central API. A central request handler can be created by replacing the Oceanic Client's request handler with your own which uses your central API. oceanic-fleet's central request handler uses Oceanic's so any modifications will be used. Stats and other info will have to be reported and combined through mentioned central API. You can try to adapt this for Kubernetes if wanted. *This has not been tests as I have no reason to attempt it; it's just an idea.*

### Concurrency

oceanic-fleet supports concurrency by starting clusters at the same time based on your bot's `max_concurrency` value. The clusters are started together in groups. The `max_concurrency` value can be overridden with [options.maxConcurrencyOverride](https://danclay.github.io/wumpus-navy/interfaces/Options.html#maxConcurrencyOverride). Ensure the number of clusters is a multiple of the number of shards being started on this instance (`(last shard ID - first shard ID + 1) % clusters = 0`). Also make sure the number of shards per cluster is greater than the max concurrency value if you want concurrency to occur across clusters (`max concurrency % ((last shard ID - first shard ID + 1) / clusters) = 0`). If not, Oceanic can still do concurrency on each cluster as per the concurrency buckets. If you would like to supress the warning set [options.maxConcurrencyOverride](https://danclay.github.io/wumpus-navy/interfaces/Options.html#maxConcurrencyOverride) to 1.

### Typescript

Visit [the docs](https://danclay.github.io/wumpus-navy/modules.html) to view the Typescript interfaces.

### Choose what to log

You can choose what to log by using the `whatToLog` property in the options object. You can choose either a whitelist or a blacklist of what to log. You can select what to log by using an array. To possible array elements are shown [on the docs](https://danclay.github.io/wumpus-navy/modules.html#LoggingOptions). Here is an example of choosing what to log:
```js
const options = {
    // Your other options
    whatToLog: {
        // This will only log when the admiral starts, when clusters are ready, and when services are ready.
        whitelist: ['admiral_start', 'cluster_ready', 'service_ready']
    }
};
```
Change `whitelist` to `blacklist` if you want to use a blacklist. Change the array as you wish. **Errors and warnings will always be sent.**

## IPC

Clusters and services can use IPC to interact with other clusters, the Admiral, and services. Visit [the IPC docs](https://danclay.github.io/wumpus-navy/classes/IPC.html) to view available methods.

## Stats

Stats are given in [this](https://danclay.github.io/wumpus-navy/interfaces/Stats.html) format.

## Using a specific version of Oceanic or a modified version of Oceanic

You can use an extended Oceanic client by passing it to the Options. (see the [options.customClient](https://danclay.github.io/wumpus-navy/interfaces/Options.html#customClient) section).

```js
const { Fleet } = require("oceanic-fleet");
const { Client } = require("oceanic.js");

class ModifiedClient extends Client {
    // etc etc
}

const options = {
    // other options
    customClient: ModifiedClient
}
const Admiral = new Fleet(options);
```

## Using ES Modules

Instead of using the file path, you can use ES Modules by passing your BotWorker class to `options.BotWorker` and your ServiceWorker class to `ServiceWorker` in the `options.services` array. See [test/](https://github.com/danclay/wumpus-navy/tree/master/test) for examples.