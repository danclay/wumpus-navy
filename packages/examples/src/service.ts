import { BaseServiceWorker, BaseServiceWorkerSetup } from "eris-fleet";

/**
 * This class will contain a service's code. Eris-fleet will create a new instance of this on the respective service's worker.
 */
export class MyServiceWorker extends BaseServiceWorker {
    /**
     * This is the constructor. Make sure this had a super passing a single variable from the constructor.
     * This single variable is of the {@link wumpus-carrier!BaseServiceWorkerSetup} type. You don't need to worry about it.
     * Make sure to call `this.serviceReady()` when your service is ready for use.
     */
    constructor(setup: BaseServiceWorkerSetup) {
        // Do not delete this super.
        super(setup);

        // Run this function when your service is ready for use. This MUST be run for the worker spawning to continue.
        this.serviceReady();
    }

    /**
     * This is how you can interact with clusters. They can send commands here and this function will either just take the data or respond.
     * Whatever you return will be sent to a receptive call. The data will be serialized.
     * @param dataSentInCommand This has the data you get from a command
     */
    async handleCommand(dataSentInCommand: any) {
        // Return a response if you want to respond
        return dataSentInCommand.smileyFace;
    }

    /**
     * This is an optional property. Use this if you need to gracefully shutdown things. Call the function below when it is done.
     * @param done Just call this function when you are done gracefully shutting down.
     */
    shutdown(done: () => void) {
        // do stuff
        done();
    }
}