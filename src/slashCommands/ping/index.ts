import { ChatInputCommandInteraction } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "ping",
    description: "Ping test",
    nameLocalizations: {
        'zh-TW': '發出測試訊息',
    },
    descriptionLocalizations: {
        'zh-TW': '測試機器人指令回傳狀況',
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
    data.reply("pong");
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();