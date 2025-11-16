import { Client, Events } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.ClientReady,
    once: false
}

export const action = async (client: Client<boolean>) => {
    console.log("logged in");
}