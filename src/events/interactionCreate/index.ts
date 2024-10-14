import { BaseInteraction, Events, User } from "discord.js";
import ClientDataManager from "../../clientDataManager";
import { OptionData, OptionDataType as OptionDataCollectType, OptionType } from "../../type";

export const event = {
    name: Events.InteractionCreate,
}

export const action = async (interaction: BaseInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    const action = ClientDataManager.getInstance().getActions().get(interaction.commandName);

    let optionDataList: Record<string, OptionData> = {};

    let optionsData: Array<OptionDataCollectType> = [];

    const data = interaction.options.data;

    data.forEach(element => {
        const name = element.name;
        const type = element.type;
        const value = element.value;

        optionDataList[name] = { name, type, value }
    });

    for (const data in optionDataList) {
        const item = optionDataList[data];
        switch (item.type) {
            case OptionType.STRING:
                optionsData.push(interaction.options.getString(item.name) as string);
                break;
            case OptionType.INTEGER:
                optionsData.push(interaction.options.getInteger(item.name) as number);
                break;
            case OptionType.BOOLEAN:
                optionsData.push(interaction.options.getBoolean(item.name) as boolean);
                break;
            case OptionType.USER:
                optionsData.push(interaction.options.getUser(item.name) as User);
                break;
        }
    }

    if (action != undefined) await action(interaction, optionsData);
}