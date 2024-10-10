import { ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "../command";
import { Command, CommandOption, CommandOptionType, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<Command> = {
    name: "purge",
    description: "Delete a specified number of messages, up to 100."
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'amount',
        description: 'Specified number of messages, up to 100.',
        required: true,
        type: CommandOptionType.INTEGER,
        minValue: 1,
        maxValue: 100
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
    data.reply(`purge: ${options[0]}`);
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();