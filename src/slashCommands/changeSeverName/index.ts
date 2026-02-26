import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, CommandOptionType, OptionDataType } from "../../type";

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "changesevername",
    description: "change Sever Name",
    nameLocalizations: {
        'zh-TW': '更改伺服器名稱',
    },
    descriptionLocalizations: {
        'zh-TW': '更改當前伺服器名稱，更改有後冷卻時間限制',
    }
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'name',
        description: 'sever name',
        required: true,
        type: CommandOptionType.STRING,
        nameLocalizations: {
            'zh-TW': '名稱',
        },
        descriptionLocalizations: {
            'zh-TW': '伺服器名稱',
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
    await data.deferReply({ flags: MessageFlags.Ephemeral });

    console.log("options", options);

    const oldName = data.guild?.name;
    const newName = options[0] as string;
    await data.guild?.setName(newName);

    await data.editReply({
        content: `伺服器名稱已更改\n ${oldName} -> ${options[0]}`,
    });
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();