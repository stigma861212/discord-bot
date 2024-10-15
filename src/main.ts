import { loadSlashCommands, loadEvents, loadContextMenuCommands, loadAllCommands } from "./loader";
import dotenv from "dotenv";
import ClientDataManager from "./clientDataManager";
import { initDB, closeDB } from "./database";
import { getLatestNewVideo } from "./youTubeDataAPIv3";
import { deletetemp } from "./command";

dotenv.config();

/**enter */
const mainStart = async () => {
    initDB();
    /**discord client */
    const client = ClientDataManager.getInstance().getClient();
    await loadAllCommands();
    loadEvents(client);
};

mainStart();

// TODO: 固定時間檢查機器人當前所在所有的伺服器來對DB做一次資料清理


/**Catch close server to close db */
process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing database connection...');
    closeDB();
    console.log('Database connection closed.');
    process.exit(0);  // 退出程序
});