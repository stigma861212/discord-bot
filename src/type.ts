import { Channel, ChatInputCommandInteraction, Events, Role, SlashCommandBuilder, User } from "discord.js";

/**Settings command name and effect */
export type CommandModule = {
    /**command name */
    command: SlashCommandBuilder;
    /**command effect */
    action: (data: ChatInputCommandInteraction) => Promise<void>;
    /**command options*/
    actionOption: Array<string>
};

export type EventMoudle = {
    /**event name */
    name: Events;
    /**trigger once or not */
    once?: boolean
}

export enum CommandOptionType {
    STRING = 'string',
    INTEGER = 'integer',
    BOOLEAN = 'boolean',
    USER = 'user',
    CHANNEL = 'channel',
    ROLE = 'role',
    MENTIONABLE = 'mentionable'
}

export enum OptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
    MENTIONABLE = 9,
}

export type OptionDataType = string | number | boolean | Channel | Role | User;

export type Command = {
    name: string;
    description: string;
};

export type CommandOption = Command & {
    required: boolean;
    type: CommandOptionType
    maxValue?: number;
    minValue?: number;
};

export type OptionData = {
    name: string,
    type: number,
    value: string | number | boolean | undefined
}

export type ServerInfo = {
    server_id: string;
    channel_id: string;
}

export type DiscordData = ServerInfo & {
    id: number;
    server_name: string;
};

export type YoutuberSubscribeData = ServerInfo & {
    youtuber_url: string;
    youtuber_id: string;
};