import { Client, Events, TextChannel } from "discord.js";
import { EventMoudle } from "../../type";
import { Database, GuildFields, YoutuberSubscribeFields } from "../../database";
import { getLatestNewVideo } from "../../youTubeDataAPIv3";

/**Notice time */
const minutes = 0;

export const event: EventMoudle = {
    name: Events.ClientReady,
    once: false
}

export const action = async (client: Client<boolean>) => {
    // TODO: 後續限制每個伺服器最多訂閱次數減少yt v3 api流量 --> 限流
    // TODO: 特殊伺服器id可解鎖限制，限制方式為檔案或db待定
    // TODO: 特殊伺服器db是否分離待定

    // checkAndNotify(client);

    // 每分鐘執行檢查
    setInterval(() => {
        checkAndNotify(client);
    }, 60 * 1000);
}

/**
 * Check the subscribed videos and send them to the required server.
 * @param client server
 */
const checkAndNotify = async (client: Client<boolean>) => {
    if (!isExactHour()) return;
    if (client.guilds.cache.size == 0) return;

    const subscribelist: Array<{ youtuber_id: string, server_id: string }> = new Database().useYoutuberSubscribeTable()
        .select(YoutuberSubscribeFields.YoutuberId)
        .select(YoutuberSubscribeFields.ServerId)
        .execute();
    // console.log("subscribelist:", subscribelist);
    const youtuberServerCount: Record<string, Set<{
        server_id: string;
        textYTNotice_id: string;
    }>> = {};

    for (const subscribe of subscribelist) {
        const { youtuber_id, server_id } = subscribe;
        youtuberServerCount[youtuber_id] ||= new Set<{
            server_id: string;
            textYTNotice_id: string;
        }>();

        const textYTNotice_id: Array<{ textYTNotice_id: string }> = new Database().useGuildTable()
            .select(GuildFields.TextYTNoticeId)
            .where(GuildFields.ServerId, server_id)
            .execute();

        const obj = {
            server_id: server_id,
            textYTNotice_id: textYTNotice_id[0].textYTNotice_id
        }
        youtuberServerCount[youtuber_id].add(obj);
    }
    // console.log("youtuberServerCount:", youtuberServerCount);
    for (const ytID in youtuberServerCount) {
        const serverList = youtuberServerCount[ytID];
        const videoList = await getLatestNewVideo(ytID);
        if (videoList.length == 0) continue;
        for (const server of serverList) {
            // send the url to each server connect channel
            const channel = await client.channels.fetch(server.textYTNotice_id) as TextChannel;
            channel.send(videoList.join("\n"));
        }
    }
}

/**
 * Vedio notice time, check if time minutes is correct set
 * @returns is correct or not
 */
function isExactHour(): boolean {
    const now = new Date();
    return now.getMinutes() == minutes;
}