import { CategoryChannel, ChannelType, Events, Guild, GuildChannelCreateOptions, TextChannel } from "discord.js";
import { EventMoudle } from "../../type";
import { Database, GuildFields } from "../../database";
import { announcementInfo, getRolesInfo } from "../../announcement";
import { createChannel, createRolePermisson } from "../../channelSetting";

export const event: EventMoudle = {
    name: Events.GuildCreate,
    once: false
}

export const action = async (guild: Guild) => {
    console.log("guild.name:", guild.name);

    try {
        const botViewer = await guild.roles.create({
            name: "小精靈觀察員",
            color: "#CB1B45",
            reason: "負責觀看小精靈"
        });

        const categoryChannel = await createChannel(
            guild,
            "小精靈生活圈",
            ChannelType.GuildCategory,
            {
                ViewChannel: false,
                SendMessages: false
            }
        ) as unknown as CategoryChannel

        const textHomeChannel = await createChannel(
            guild,
            "小精靈窩",
            ChannelType.GuildText,
            {
                ViewChannel: true,
                SendMessages: false,
            },
            categoryChannel.id
        ) as TextChannel;

        const textNoticeChannel = await createChannel(
            guild,
            "小精靈公告區",
            ChannelType.GuildText,
            {
                ViewChannel: false,
                SendMessages: false
            },
            categoryChannel.id
        ) as TextChannel;
        createRolePermisson(textNoticeChannel, botViewer, {
            ViewChannel: true,
        })

        const textYTNoticeChannel = await createChannel(
            guild,
            "小精靈訂閱影片通知區",
            ChannelType.GuildText,
            {
                ViewChannel: false,
                SendMessages: false
            },
            categoryChannel.id
        ) as TextChannel;
        createRolePermisson(textYTNoticeChannel, botViewer, {
            ViewChannel: true,
        })

        new Database().useGuildTable()
            .insert({
                [GuildFields.ServerId]: guild.id,
                [GuildFields.ServerName]: guild.name,
                [GuildFields.CategoryId]: categoryChannel.id,
                [GuildFields.TextHomeId]: textHomeChannel.id,
                [GuildFields.TextNoticeId]: textNoticeChannel.id,
                [GuildFields.TextYTNoticeId]: textYTNoticeChannel.id
            }, true);

        const mes = await textHomeChannel.send({
            embeds: [getRolesInfo],
            allowedMentions: { parse: [] }
        })
        await mes.react("🎟️");

        await textNoticeChannel.send({
            embeds: [announcementInfo],
            allowedMentions: { parse: [] }
        });
    } catch (error) {
        console.log("GuildCreate:", error);
    }
}