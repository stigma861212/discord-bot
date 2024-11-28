import { CategoryChannel, ChannelType, Guild, GuildChannel, GuildChannelCreateOptions, PermissionOverwriteOptions, Role, TextChannel, VoiceChannel } from "discord.js";

export const createChannel = async (guild: Guild, name: string, type: ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory, permission?: PermissionOverwriteOptions, parent?: string) => {

    const option: GuildChannelCreateOptions = {
        name: name,
        type: type,
    }

    if (parent) {
        option.parent = parent;
    }

    const channel: CategoryChannel | TextChannel | VoiceChannel = await guild.channels.create(option);

    if (permission) {
        channel.permissionOverwrites.create(guild.roles.everyone, permission)
    }

    return channel
}

export const createRolePermisson = (channel: GuildChannel, role: Role, rolePermission: PermissionOverwriteOptions) => {
    channel.permissionOverwrites.create(role, rolePermission);
}