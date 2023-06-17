import { BaseClusterWorker, BaseClusterWorkerSetup } from "eris-fleet";
import { Message } from "eris";

/**
 * This class will contain your bot's code. Eris-fleet will create a new instance of this class on each cluster.
 */
export class MyBotWorker extends BaseClusterWorker {
    /**
     * This is the constructor. Make sure this had a super passing a single variable from the constructor.
     * This single variable is of the {@link wumpus-carrier!BaseClusterWorkerSetup} type. You don't need to worry about it.
     */
    constructor(setup: BaseClusterWorkerSetup) {
        // Do not delete this super.
        super(setup);

        this.bot.on('messageCreate', this.handleMessage.bind(this));
    }

    async handleMessage(msg: Message) {
        if (msg.content === "!sendCommand" && !msg.author.bot) {
            // Sends a command to the example service: "myService"
            const reply = await this.ipc.serviceCommand("myService", {smileyFace: ":)"}, true);
            //console.log(reply);
            this.bot.createMessage(msg.channel.id, reply);
        }
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