import { ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "../command";
import { Command, CommandOption, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<Command> = {
    name: "ping",
    description: "Ping test"
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
export const command = createCommand(initCommandInfo.name, initCommandInfo.description, initOptionInfoGroup);

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    data.reply("pong");
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();