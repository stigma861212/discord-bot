import { ChatInputCommandInteraction } from "discord.js";
import { createContextMenuCommand } from "../../command";
import { CommandOption, OptionDataType, ContextMenuCommand } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<ContextMenuCommand> = {
    name: "contextmenutest",
    type: 3,
    nameLocalizations: {
        'zh-TW': '應用程式測試用指令',
    },
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
export const command = createContextMenuCommand(initCommandInfo.name, initCommandInfo.type, initCommandInfo.nameLocalizations);

/**Command action */
export const action = async (data: ChatInputCommandInteraction) => {
    data.reply("這是測試用指令阿阿阿阿阿!禁止!禁止!!!");
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();