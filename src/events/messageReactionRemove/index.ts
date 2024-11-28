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

    const message = reaction.message;
    message.reactions.cache.clear();
    console.log(`${user.tag} removed reaction: ${reaction.emoji.name}`);
    if (message.embeds.length == 0) return;
    switch (message.embeds[0].title) {
        case "領取身分組":
            if (reaction.emoji.name == "🎟️") {
                const member = await message.guild!.members.fetch(user.id);
                const role = message.guild!.roles.cache.find((r) => r.name === "小精靈觀察員");
                try {
                    await member.roles.remove(role!);
                } catch (error) {
                    console.log("no role:", error);
                }
            }
            break;
        default:
            break;
    }
};