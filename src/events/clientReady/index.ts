import { Client, Events, TextChannel } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.ClientReady,
    once: true
}

export const action = async (client: Client<boolean>) => {
    if (client.guilds.cache.size == 0) return;
        console.log("logged in");
    // client.guilds.cache.forEach(async (guild) => {
    //     const channel = await client.channels.fetch(guild.systemChannelId as string) as TextChannel;
    //     console.log("logged in");
    //     // channel.send(`${client.user?.tag} logged in !`);
    // });
}