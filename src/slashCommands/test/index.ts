import { ChatInputCommandInteraction } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, CommandOptionType, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "slashtest",
    description: "slashtest"
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'test1',
        description: 'test 1!!!',
        required: true,
        type: CommandOptionType.STRING
    },
    {
        name: 'test2',
        description: 'test 2!!!',
        required: true,
        type: CommandOptionType.STRING
    }
];

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
    // console.log("options", options);
    data.reply(`test: ${options[0]}, ${options[1]}, 這是測試用指令阿阿阿阿阿!禁止!禁止!!!`);
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();