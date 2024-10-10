import { Events, Message, OmitPartialGroupDMChannel, PartialMessage } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.MessageDelete,
    once: false
}

export const action = (message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>) => {
    if (!message.author || message.author.bot) return
    // console.log(`${message.author.globalName} delete message: ${message.content}`);
    // message.channel.send(`${message.author.globalName} delete message: ${message.content}`);
}