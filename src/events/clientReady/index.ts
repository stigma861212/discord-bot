import { ChannelType, Client, Events } from "discord.js";
import { EventMoudle } from "../../type";
import { Database, GuildFields } from "../../database";
import { announcementInfo } from "../../announcement";

export const event: EventMoudle = {
    name: Events.ClientReady,
    once: true
}

export const action = async (client: Client<boolean>) => {
    if (client.guilds.cache.size == 0) return;
    // console.log("logged in", client.guilds.cache);
    console.log("logged in");

    // TODO: 用db查詢伺服器的textNotice_id進行通知

    const db = new Database();

    const dbData: Array<{ server_id: string, textNotice_id: string, server_name: string }> = db.useGuildTable()
        .select(GuildFields.ServerId)
        .select(GuildFields.TextNoticeId)
        .select(GuildFields.ServerName)
        .execute();

    // 將所有的 guilds id 轉換成一個 Set，提高查找效率
    const guildIdsInCache = new Set(client.guilds.cache.map(guild => guild.id));

    // 檢查哪些 dbData 中的 server_id 不在 client.guilds.cache 中
    const missingGuilds = dbData.filter(data => !guildIdsInCache.has(data.server_id));

    if (missingGuilds.length > 0) {
        console.log("These server IDs are not in the bot's cache:", missingGuilds.map(data => [data.server_id, data.server_name]));
        missingGuilds.map(data => db.useGuildTable().where(GuildFields.ServerId, data.server_id).delete(true));
    }

    for (const guildData of client.guilds.cache) {
        const guild = guildData[1];
        const guildId = guildData[1].id

        for (const data of dbData) {
            if (data.server_id == guildId) {
                const channel = guild.channels.cache.get(data.textNotice_id);
                if (channel && channel.type === ChannelType.GuildText) {
                    await channel.send({ embeds: [announcementInfo], allowedMentions: { parse: [] } });
                } else {
                    console.log('Channel not found or not a text channel.');
                }
            }
        }
    }
}