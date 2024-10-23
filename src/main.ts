import { loadEvents, loadAllCommands } from "./loader";
import dotenv from "dotenv";
import ClientDataManager from "./clientDataManager";

dotenv.config();

/**enter */
const mainStart = async () => {
    /**discord client */
    const client = ClientDataManager.getInstance().getClient();
    await loadAllCommands();
    loadEvents(client);
};

mainStart();

// TODO: 固定時間檢查機器人當前所在所有的伺服器來對DB做一次資料清理