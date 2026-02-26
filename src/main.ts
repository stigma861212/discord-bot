import { loadEvents, loadAllCommands } from "./loader";
import dotenv from "dotenv";
import ClientDataManager from "./clientDataManager";

dotenv.config();

/**enter */
const mainStart = async () => {
    /**discord client */
    const client = ClientDataManager.getInstance().getClient();
    await loadAllCommands();
    await loadEvents(client);
    console.log("mainStart complete");
};

mainStart();