import { CategoryChannel, ChatInputCommandInteraction } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType } from "../../type";
import { Database, GuildFields } from "../../database";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "deletebotchannel",
    description: "delete Bot Create Channel"
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [];

/**Get OptionInfoGroup each child name */
function getOptionsName(): Array<string> {
    let optionsName: Array<string> = [];
    initOptionInfoGroup.forEach(optionInfo => {
        optionsName.push(optionInfo.name);
    });
    return optionsName
}

/**Create command */
export const command = createSlashCommand(initCommandInfo.name, initCommandInfo.description, initOptionInfoGroup);

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    await data.deferReply({ ephemeral: true });

    const guildId = data.guildId;
    const category_id: string = new Database().useGuildTable().where(GuildFields.ServerId, guildId).select(GuildFields.CategoryId).execute()[0].category_id;
    const channel: CategoryChannel = data.guild?.channels.cache.get(category_id) as CategoryChannel;
    try {
        for (const [, child] of channel.children.cache) {
            await child.delete();
        }
        await channel.delete();
        await data.followUp({ content: `已刪除小精靈相關頻道，現在小精靈失業中`, ephemeral: true });
    } catch (error) {
        console.log("delete channel error:", error);
        await data.followUp({ content: `刪除頻道時發生錯誤：${error}` });
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();