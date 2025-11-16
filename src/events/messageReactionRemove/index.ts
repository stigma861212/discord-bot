import { Events, MessageReaction, User } from "discord.js";
import { EventMoudle } from "../../type";

export const event: EventMoudle = {
    name: Events.MessageReactionRemove,
    once: false
}

export const action = async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    console.log(`${user.tag} removed reaction: ${reaction.emoji.name}`);
};