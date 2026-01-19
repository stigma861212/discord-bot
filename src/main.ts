import { loadEvents, loadAllCommands } from "./loader";
import dotenv from "dotenv";
import ClientDataManager from "./clientDataManager";
import ffmpegPath from "ffmpeg-static";

dotenv.config();

// Provide FFmpeg binary for @discordjs/voice (prism-media)
if (!process.env.FFMPEG_PATH && ffmpegPath) {
    process.env.FFMPEG_PATH = ffmpegPath;
}

/**enter */
const mainStart = async () => {
    /**discord client */
    const client = ClientDataManager.getInstance().getClient();
    await loadAllCommands();
    await loadEvents(client);
    console.log("mainStart complete");
};

mainStart();