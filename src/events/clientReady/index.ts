import { CategoryChannel, ChannelType, Client, Events, TextChannel } from "discord.js";
import { EventMoudle } from "../../type";
import { Database, GuildFields, YoutuberSubscribeFields } from "../../database";
import { announcementInfo } from "../../announcement";
import { getLatestNewVideo } from "../../youTubeDataAPIv3";

/**是否重啟時發送公告 */
const needAnnouncement: boolean = false;
/**Notice time，0~60 */
const minutes = 0;

export const event: EventMoudle = {
    name: Events.ClientReady,
    once: false
}

export const action = async (client: Client<boolean>) => {
    console.log("logged in");
    // TODO: 用db查詢伺服器的textNotice_id進行通知
    await checkGuildsExist(client);
    if (client.guilds.cache.size == 0) return;
    await sendAnnouncement(client);
    await cleanMusicServe(client);
    setInterval(() => {
        checkAndNotify(client);
    }, 60 * 1000);
}

/**
 * Clean up unused server data in the backend.
 * @param client 
 */
const checkGuildsExist = async (client: Client<boolean>) => {
    const dbData: Array<{ server_id: string, textNotice_id: string, server_name: string }> = new Database().useGuildTable()
        .select(GuildFields.ServerId)
        .select(GuildFields.TextNoticeId)
        .select(GuildFields.ServerName)
        .execute();
    // 將所有的 guilds id 轉換成一個 Set，提高查找效率
    const guildIdsInCache = new Set(client.guilds.cache.map(guild => guild.id));
    console.log("guildIdsInCache:", guildIdsInCache);
    // 檢查哪些 dbData 中的 server_id 不在 client.guilds.cache 中
    const missingGuilds = dbData.filter(data => !guildIdsInCache.has(data.server_id));

    if (missingGuilds.length > 0) {
        console.log("These server IDs are not in the bot's cache:", missingGuilds.map(data => [data.server_id, data.server_name]));
        missingGuilds.map(data => new Database().useGuildTable().where(GuildFields.ServerId, data.server_id).delete(true));
    }
}

const cleanMusicServe = async (client: Client<boolean>) => {
    const data: Array<{ server_id: string, category_id: string, textHome_id: string, textNotice_id: string, textYTNotice_id: string }> = new Database().useGuildTable()
        .select(GuildFields.ServerId)
        .select(GuildFields.CategoryId)
        .select(GuildFields.TextHomeId)
        .select(GuildFields.TextNoticeId)
        .select(GuildFields.TextYTNoticeId)
        .execute();
    client.guilds.cache.forEach((guild) => {
        data.forEach(element => {
            if (guild.id == element.server_id) {
                const category = guild.channels.cache.get(element.category_id) as CategoryChannel;
                const idList = [element.textHome_id, element.textNotice_id, element.textYTNotice_id];
                category.children.cache.forEach(channel => {
                    if (!idList.includes(channel.id)) {
                        guild.channels.cache.get(channel.id)?.delete();
                    }
                });
            }
        });
    })
}

const sendAnnouncement = async (client: Client<boolean>) => {
    const dbData: Array<{ server_id: string, textNotice_id: string }> = new Database().useGuildTable()
        .select(GuildFields.ServerId)
        .select(GuildFields.TextNoticeId)
        .execute();

    for (const guildData of client.guilds.cache) {
        const guild = guildData[1];
        const guildId = guildData[1].id

        for (const data of dbData) {
            if (data.server_id == guildId) {
                const channel = guild.channels.cache.get(data.textNotice_id);
                if (channel && channel.type === ChannelType.GuildText) {
                    if (needAnnouncement) channel.send({ embeds: [announcementInfo], allowedMentions: { parse: [] } });
                } else {
                    console.log('textNotice_id not found or not a text channel.');
                }
            }
        }
    }
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
 * Video notice time, check if time minutes is correct set
 * @returns is correct or not
 */
const isExactHour = () => {
    const now = new Date();
    return now.getMinutes() == minutes;
}