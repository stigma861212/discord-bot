import { Client, Events, TextChannel } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.ClientReady,
    once: true
}

export const action = async (client: Client<boolean>) => {
    if (client.guilds.cache.size == 0) return;
    console.log("logged in");

    client.guilds.cache.forEach(async (guild) => {
        const channel = await client.channels.fetch(guild.systemChannelId as string) as TextChannel;
        channel.send(`
        **${client.user?.tag}** logged in!
        
        __本次重啟更新內容:__
        
        1. **新增小精靈 yt 退訂閱功能**  
           對小精靈訂閱通知右鍵 > **應用程式** > **unsubscribe** 即可取消此頻道訂閱。
        2. **斜線指令新增刪除當前頻道訊息功能**  
           使用 **/purge** 指令，amount 選擇刪除行數，member（可選）選擇指定對象。
        `);
    });
}