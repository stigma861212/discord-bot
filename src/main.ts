import { loadCommands, loadEvents } from "./loader";
import dotenv from "dotenv";
import ClientDataManager from "./clientDataManager";
import { initDB, closeDB } from "./database";
import { getLatestNewVideo } from "./youTubeDataAPIv3";
dotenv.config();

initDB();

/**discord client */
const client = ClientDataManager.getInstance().getClient();

loadCommands();
loadEvents(client);

/**Catch close server to close db */
process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing database connection...');
    closeDB();
    console.log('Database connection closed.');
    process.exit(0);  // 退出程序
});