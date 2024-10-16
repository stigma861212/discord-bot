import { ChannelType, Events, Guild } from "discord.js";
import { EventMoudle } from "../../type";
import { insertGuildDB } from "../../database";

export const event: EventMoudle = {
    name: Events.GuildCreate,
    once: false
}

export const action = (guild: Guild) => {
    // console.log("guild:", guild);
    // console.log("DISCORD_SERVER_ID:", guild.id);
    // console.log("STIGMA 的伺服器:", guild.name);
    // console.log("伺服器頻道id:", guild.systemChannelId);

    insertGuildDB(guild.id, guild.name, guild.systemChannelId as string);

    for (const [, channel] of guild.channels.cache) {
        if (channel.type === ChannelType.GuildText) {
            // console.log(`頻道名稱: ${channel.name}, ID: ${channel.id}`);
            channel.send(`這裡是什麼鬼地方!!!`);
            break;
        }
    }
}