import { CategoryChannel, ChatInputCommandInteraction } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType } from "../../type";
import { Database, GuildFields } from "../../database";
import { deleteBotChannelSuccess, deleteBotChannelError } from "../../announcement";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "deletebotchannel",
    description: "delete Bot Create Channel",
    nameLocalizations: {
        'zh-TW': '刪除機器人頻道列表',
    },
    descriptionLocalizations: {
        'zh-TW': '刪除機器人加入時所新增的頻道',
    }
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

if (initCommandInfo.nameLocalizations) {
    command.setNameLocalizations(initCommandInfo.nameLocalizations);
}
if (initCommandInfo.descriptionLocalizations) {
    command.setDescriptionLocalizations(initCommandInfo.descriptionLocalizations);
}

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
        try {
            await data.followUp({ content: deleteBotChannelSuccess, ephemeral: true });
        } catch (error) {
            console.log("user delete the channel in deleted channel");
        }
    } catch (error) {
        console.log("delete channel error:", error);
        await data.followUp({ content: deleteBotChannelError });
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();