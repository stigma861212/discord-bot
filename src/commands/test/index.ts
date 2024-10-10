import { ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "../command";
import { Command, CommandOption, CommandOptionType, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<Command> = {
    name: "test",
    description: "test test"
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
export const command = createCommand(initCommandInfo.name, initCommandInfo.description, initOptionInfoGroup);

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    // console.log("options", options);
    data.reply(`test: ${options[0]}, ${options[1]}`);
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();