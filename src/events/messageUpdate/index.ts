import { Events, Message, OmitPartialGroupDMChannel, PartialMessage, TextChannel } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.MessageUpdate,
    once: false
}

export const action = (message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>) => {
    if (!message.author || message.author.bot) return
    // console.log(`${message.author.globalName} update message: ${message.content} -> ${message.reactions.message.content}`);
    // (message.channel as TextChannel).send(`${message.author.globalName} update message: ${message.content} -> ${message.reactions.message.content}`);
}