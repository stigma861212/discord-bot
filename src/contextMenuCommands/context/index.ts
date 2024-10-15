import { ChatInputCommandInteraction } from "discord.js";
import { createContextMenuCommand } from "../../command";
import { CommandOption, OptionDataType, ContextMenuCommand } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<ContextMenuCommand> = {
    name: "tts",
    type: 3
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
export const command = createContextMenuCommand(initCommandInfo.name, initCommandInfo.type);

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    data.reply("tts");
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();