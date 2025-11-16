import { Events, Guild } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.GuildCreate,
    once: false
}

export const action = async (guild: Guild) => {
    console.log(`Bot joined guild: ${guild.name} (${guild.id})`);
}