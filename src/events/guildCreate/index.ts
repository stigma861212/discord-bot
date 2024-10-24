import { ChannelType, Events, Guild, GuildChannelCreateOptions } from "discord.js";
import { EventMoudle } from "../../type";
import { Database, GuildFields } from "../../database";
import { announcementInfo } from "../../announcement";

export const event: EventMoudle = {
    name: Events.GuildCreate,
    once: false
}

export const action = async (guild: Guild) => {
    console.log("guild.name:", guild.name);

    try {
        const textHomeChannel = await guild.channels.create({
            name: "小精靈窩",
            type: ChannelType.GuildText,
        })

        const textNoticeChannel = await guild.channels.create({
            name: "小精靈公告區",
            type: ChannelType.GuildText,
        })

        const textYTNoticeChannel = await guild.channels.create({
            name: "小精靈訂閱影片通知區",
            type: ChannelType.GuildText,
        });

        const categoryChannel = await guild.channels.create({
            name: '小精靈生活圈',
            type: ChannelType.GuildCategory,
        });
        textHomeChannel.setParent(categoryChannel.id);
        textNoticeChannel.setParent(categoryChannel.id);
        textYTNoticeChannel.setParent(categoryChannel.id);

        new Database().useGuildTable()
            .insert({
                [GuildFields.ServerId]: guild.id,
                [GuildFields.ServerName]: guild.name,
                [GuildFields.CategoryId]: categoryChannel.id,
                [GuildFields.TextHomeId]: textHomeChannel.id,
                [GuildFields.TextNoticeId]: textNoticeChannel.id,
                [GuildFields.TextYTNoticeId]: textYTNoticeChannel.id
            }, true);

        for (const [, channel] of guild.channels.cache) {
            if (channel.type != ChannelType.GuildText) continue;
            if (channel.id === textHomeChannel.id) {
                channel.send({
                    content: `這是我家，目前沒有功能，後續規劃為管理員權限指令的互動頻道`,
                    allowedMentions: { parse: [] }
                });
            }
            else if (channel.id == textNoticeChannel.id) {
                await channel.send({
                    content: `這是我家的公告欄，小精靈會在這通知版本新功能`,
                    allowedMentions: { parse: [] }
                });
                await channel.send({ embeds: [announcementInfo], allowedMentions: { parse: [] } });
            }
            else if (channel.id == textYTNoticeChannel.id) {
                channel.send({
                    content: `這是我家的影片通知欄，小精靈會在這通知伺服器訂閱的YT影片`,
                    allowedMentions: { parse: [] }
                });
            }
        }
    } catch (error) {
        console.log("GuildCreate:", error);
    }
}