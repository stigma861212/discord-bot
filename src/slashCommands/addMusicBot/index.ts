import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message, TextChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, VoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType, CommandOptionType } from "../../type";
import ytpl from "ytpl";
import ytdl from "@distube/ytdl-core";
import { addmusicbotErrorURLFormat, addmusicbotSuccess, addmusicbotUsed, addmusicbotUserExist, musicPanel } from "../../announcement";
import { music_previousButton, music_playButton, music_pauseButton, music_nextButton, music_exitButton, music_randomButton, music_urlButton } from "../../button";
import { EventEmitter } from 'events';
import sharp from "sharp";
import axios from "axios";
import { createChannel } from "../../channelSetting";
import { Database, GuildFields } from "../../database";

/**Check event in use */
let eventRegistered = false;
/**Track the current number of active users. */
let activeTrackGuilds: Map<string, MusicBotData> = new Map();

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "addmusicbot",
    description: "add music bot into your voice channel",
    nameLocalizations: {
        'zh-TW': '呼叫音樂機器人',
    },
    descriptionLocalizations: {
        'zh-TW': '新增音樂機器人至你的語音頻道',
    }
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'url',
        description: 'Youtube playlist url.',
        required: true,
        type: CommandOptionType.STRING,
        nameLocalizations: {
            'zh-TW': 'url',
        },
        descriptionLocalizations: {
            'zh-TW': 'Youtube播放清單網址',
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
export const command = createSlashCommand(initCommandInfo.name, initCommandInfo.description, initOptionInfoGroup)

if (initCommandInfo.nameLocalizations) {
    command.setNameLocalizations(initCommandInfo.nameLocalizations);
}
if (initCommandInfo.descriptionLocalizations) {
    command.setDescriptionLocalizations(initCommandInfo.descriptionLocalizations);
}

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    let playlist: ytpl.Result;
    let playlistURL: string = options[0] as string;
    try {
        playlist = await ytpl(playlistURL);
    } catch (error) {
        console.error('Failed to fetch playlist');
        await data.reply({
            content: addmusicbotErrorURLFormat,
            ephemeral: true,
        });
        return;
    }

    music_urlButton.setURL(playlistURL);

    const voiceChannel = (data.member as GuildMember).voice?.channel;
    if (!voiceChannel) {
        await data.reply({
            content: addmusicbotUserExist,
            ephemeral: true,
        });
        return;
    }
    else {
        const botMember = data.guild!.members.me!;

        if (botMember.voice.channel) {
            await data.reply({
                content: addmusicbotUsed,
                ephemeral: true,
            });
            return;
        }

        await data.reply({
            content: addmusicbotSuccess,
            ephemeral: true,
        });
    }

    const buttonRowPlayState = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            music_previousButton,
            music_pauseButton,
            music_nextButton,
            music_exitButton,
            music_randomButton
        );

    const buttonRowStopState = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            music_previousButton,
            music_playButton,
            music_nextButton,
            music_exitButton,
            music_randomButton
        );

    const buttonRowLink = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            music_urlButton
        );

    const category: Array<{ category_id: string }> = new Database().useGuildTable()
        .select(GuildFields.CategoryId)
        .where(GuildFields.ServerId, data.guildId)
        .execute();

    const musicChannel = await createChannel(
        data.guild!,
        "播放室",
        ChannelType.GuildText,
        {
            ViewChannel: true,
            SendMessages: false,
        },
        category[0].category_id
    ) as TextChannel;

    /**音樂面板訊息傳送 */
    const panel = await musicChannel.send({
        embeds: [musicPanel],
        components: [buttonRowPlayState, buttonRowLink],
    });

    let embeds: EmbedBuilder;

    /**
     * Add bot to user voice channel
     */
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    const player = createAudioPlayer();
    connection.subscribe(player);

    const musicBotData = new MusicBotData(playlist, musicChannel, panel, connection, player);
    activeTrackGuilds.set(data.guildId as string, musicBotData);

    updatePanel(data.guildId as string, musicBotData);
    playNext(data.guildId as string, musicBotData);


    /**
     * To play next track with index number
     * @param index order number of the current track
     */
    async function playNext(id: string, target: MusicBotData) {
        if (target.currentTrackIndex < target.playlist.items.length) {
            const url = target.playlist.items[target.currentTrackIndex].url;
            const stream = ytdl(url, {
                filter: 'audioonly' as const,
                quality: 'lowestaudio',
                highWaterMark: 1 << 25,
            })

            try {
                const resource = createAudioResource(stream, {
                    inlineVolume: true,
                });
                resource.volume?.setVolume(0.1);

                // Wait for the stream to preload some sec(2500)
                await new Promise(async resolve => {
                    setTimeout(resolve, 2500);
                });
                target.player.unpause();
                target.player.play(resource);
            } catch (error) {
                console.log("Skip this wrong track", error);
                target.currentTrackIndex++;
                playNext(id, target);
                updatePanel(id, target);
            }
        }
        else {
            target.connection.destroy();
            await target.panel.delete();
            await target.musicChannel.delete();
            if (activeTrackGuilds.size == 1) {
                playerEventEmitter.removeAllListeners();
                eventRegistered = false;
            }
            activeTrackGuilds.delete(id);
        }
    }

    async function updatePanel(id: string, target: MusicBotData) {
        if (target.currentTrackIndex < target.playlist.items.length) {
            const url = target.playlist.items[target.currentTrackIndex].url;
            const trackName = target.playlist.items[target.currentTrackIndex].title;
            const authorName = target.playlist.items[target.currentTrackIndex].author.name;
            const bestThumbnail = target.playlist.items[target.currentTrackIndex].bestThumbnail.url as string;
            const color = await getDominantColorFromUrl(bestThumbnail);

            /**
             * Get DominantColor frome URL
             * @param imageUrl url
             * @returns rgb color data
             */
            async function getDominantColorFromUrl(imageUrl: string): Promise<[number, number, number]> {
                try {
                    // 使用 axios 下載圖片
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

                    // 確保圖片下載成功
                    if (response.status !== 200) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`);
                    }

                    // 直接使用 axios 返回的 Buffer 來處理圖片
                    const buffer = Buffer.from(response.data);

                    // 使用 sharp 處理圖片並獲取像素數據
                    const imageBuffer = await sharp(buffer)
                        .resize(100, 100)  // 可選，調整圖片大小以提高處理速度
                        .raw()
                        .toBuffer();

                    // 取得圖片的像素數據
                    const pixels = new Uint8Array(imageBuffer);

                    // 顏色統計
                    const colorMap: { [key: string]: number } = {};
                    for (let i = 0; i < pixels.length; i += 3) {  // 假設圖片是 RGB 格式
                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];

                        const colorKey = `${r},${g},${b}`;
                        if (colorMap[colorKey]) {
                            colorMap[colorKey]++;
                        } else {
                            colorMap[colorKey] = 1;
                        }
                    }

                    // 找出出現最多的顏色
                    let dominantColor = '';
                    let maxCount = 0;

                    for (const colorKey in colorMap) {
                        if (colorMap[colorKey] > maxCount) {
                            maxCount = colorMap[colorKey];
                            dominantColor = colorKey;
                        }
                    }
                    return dominantColor.split(",").map(Number) as [number, number, number];

                } catch (error) {
                    console.error('Error processing the image:', error);
                    throw error;
                }
            }

            /**新音樂資料 */
            embeds = new EmbedBuilder()
                .setTitle(trackName)
                // .setThumbnail(bestThumbnail)
                .addFields(
                    { name: " ", value: " ", inline: true },
                    { name: " ", value: " ", inline: true },
                    { name: " ", value: " ", inline: true },
                )
                .setFooter({ text: "Author: " + authorName })
                .setColor(color)
                .setImage(bestThumbnail)

            // 修改當前的音樂面板
            await target.panel.edit({
                embeds: [embeds],
                components: [buttonRowPlayState, buttonRowLink]
            })
        }
    }

    // 設置當前音樂播放結束後的回調
    player.on('stateChange', (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
            musicBotData.currentTrackIndex++;
            playNext(data.guildId as string, musicBotData);
            updatePanel(data.guildId as string, musicBotData);
        }
    });

    if (!eventRegistered) {
        playerEventEmitter.on("music_play", async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.player.state.status === AudioPlayerStatus.Paused) {
                targetData.player.unpause();
            }
            await targetData.panel.edit({
                embeds: [embeds],
                components: [buttonRowPlayState, buttonRowLink]
            })
            setTimeout(() => { mes.delete() }, 500);
        })

        playerEventEmitter.on('music_pause', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.player.state.status === AudioPlayerStatus.Playing) {
                targetData.player.pause();
            }
            await targetData.panel.edit({
                embeds: [embeds],
                components: [buttonRowStopState, buttonRowLink]
            })
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_next', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.currentTrackIndex + 1 < targetData.playlist.items.length) {
                targetData.player.pause();
                targetData.currentTrackIndex++;
                playNext(interaction.guildId as string, targetData);
                updatePanel(interaction.guildId as string, targetData);
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_previous', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.currentTrackIndex > 0) {
                targetData.player.pause();
                targetData.currentTrackIndex--;
                playNext(interaction.guildId as string, targetData);
                updatePanel(interaction.guildId as string, targetData);
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_random', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            targetData.player.pause();
            targetData.currentTrackIndex = 0;
            targetData.playlist.items.sort(() => Math.random() - 0.5);
            playNext(interaction.guildId as string, targetData);
            updatePanel(interaction.guildId as string, targetData);
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_exit', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            targetData.player.pause();

            if (activeTrackGuilds.size == 0) {
                playerEventEmitter.removeAllListeners();
                eventRegistered = false;
            }
            targetData.connection.destroy();
            mes.delete();
            await targetData.panel.delete();
            await targetData.musicChannel.delete();
            activeTrackGuilds.delete(interaction.guildId as string);
        });
        eventRegistered = true;
    }
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();

export const playerEventEmitter = new EventEmitter();

class MusicBotData {
    constructor(playlist: ytpl.Result, musicChannel: TextChannel, panel: Message<true>, connection: VoiceConnection, player: AudioPlayer) {
        this.playlist = playlist;
        this.musicChannel = musicChannel;
        this.panel = panel;
        this.connection = connection;
        this.player = player;
        this.currentTrackIndex = 0;
    }
    public playlist: ytpl.Result;
    public musicChannel: TextChannel;
    public panel: Message<true>;
    public connection: VoiceConnection;
    public player: AudioPlayer;
    public currentTrackIndex: number;
}