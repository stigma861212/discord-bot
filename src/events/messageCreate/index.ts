import { Events, Message, OmitPartialGroupDMChannel, PartialMessage } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.MessageCreate,
    once: false
}

export const action = (message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>) => {
    if (!message.author || message.author.bot) return
}