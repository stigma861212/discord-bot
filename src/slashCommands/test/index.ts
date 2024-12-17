import { ChatInputCommandInteraction } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, CommandOptionType, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "slashtest",
    description: "slashtest",
    nameLocalizations: {
        'zh-TW': '斜線指令測試',
    },
    descriptionLocalizations: {
        'zh-TW': '帶參數的測試用指令',
    }
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'test1',
        description: 'test 1!!!',
        required: true,
        type: CommandOptionType.STRING,
        nameLocalizations: {
            'zh-TW': '測試參數1',
        },
        descriptionLocalizations: {
            'zh-TW': '參數1',
        }
    },
    {
        name: 'test2',
        description: 'test 2!!!',
        required: true,
        type: CommandOptionType.STRING,
        nameLocalizations: {
            'zh-TW': '測試參數2',
        },
        descriptionLocalizations: {
            'zh-TW': '參數2',
        }
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

if (initCommandInfo.nameLocalizations) {
    command.setNameLocalizations(initCommandInfo.nameLocalizations);
}
if (initCommandInfo.descriptionLocalizations) {
    command.setDescriptionLocalizations(initCommandInfo.descriptionLocalizations);
}

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    console.log("options", options);
    data.reply({
        content: `test: ${options[0]}, ${options[1]}, 這是測試用指令阿阿阿阿阿!禁止!禁止!!!`,
        ephemeral: true,
    });
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();