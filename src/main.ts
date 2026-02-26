import path from "path";
import { loadEvents, loadAllCommands } from "./loader";
import dotenv from "dotenv";
import ClientDataManager from "./clientDataManager";

// pkg 執行時從 exe 所在目錄載入 .env
const envPath = (process as { pkg?: unknown }).pkg
    ? path.join(path.dirname(process.execPath), ".env")
    : undefined;
dotenv.config({ path: envPath });

/**enter */
const mainStart = async () => {
    /**discord client */
    const client = ClientDataManager.getInstance().getClient();
    await loadAllCommands();
    await loadEvents(client);
    console.log("mainStart complete");
};

mainStart();