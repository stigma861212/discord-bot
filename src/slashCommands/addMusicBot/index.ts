import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message, TextChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, VoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType, CommandOptionType } from "../../type";
import { addmusicbotChannel, addmusicbotErrorURLFormat, addmusicbotSuccess, addmusicbotUsed, addmusicbotUserExist, musicPanel } from "../../announcement";
import { music_previousButton, music_playButton, music_pauseButton, music_nextButton, music_exitButton, music_randomButton, music_urlButton } from "../../button";
import { EventEmitter } from 'events';
import sharp from "sharp";
import axios from "axios";
import { createChannel } from "../../channelSetting";
import youtubedl from 'youtube-dl-exec';
import { getPlaylistItems, getPlaylistInfo } from "../../youTubeDataAPIv3";

interface AudioResourceMetadata {
    guildId: string;
}

interface PlaylistItem {
    url: string;
    title: string;
    author?: {
        name: string;
    };
    thumbnail: string;
}

interface Playlist {
    items: PlaylistItem[];
    title: string;
    url: string;
}

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
};

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
    return optionsName;
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
    let playlist: Playlist;
    let playlistURL: string = options[0] as string;

    try {
        const url = new URL(playlistURL);

        // 驗證是否為 YouTube 播放清單 URL
        if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
            throw new Error('Invalid YouTube URL');
        }

        // 檢查是否包含播放清單 ID
        const playlistId = url.searchParams.get('list');
        if (!playlistId) {
            throw new Error('No playlist ID found in URL');
        }

        // 使用 YouTube Data API 獲取播放清單資訊
        const [playlistInfo, playlistItems] = await Promise.all([
            getPlaylistInfo(playlistId),
            getPlaylistItems(playlistId)
        ]);

        if (!playlistInfo || !playlistItems || playlistItems.length === 0) {
            throw new Error('Playlist is empty or not found');
        }

        // 轉換為我們的 Playlist 格式
        playlist = {
            title: playlistInfo.snippet.title,
            url: playlistURL,
            items: playlistItems
                .filter(item => item.snippet.resourceId.videoId) // 過濾掉已刪除的影片
                .map(item => ({
                    url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                    title: item.snippet.title,
                    author: {
                        name: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle
                    },
                    thumbnail: item.snippet.thumbnails?.maxres?.url ||
                        item.snippet.thumbnails?.high?.url ||
                        item.snippet.thumbnails?.medium?.url ||
                        item.snippet.thumbnails?.default?.url || ''
                }))
        };

        console.log(`成功載入播放清單: ${playlist.title}，共 ${playlist.items.length} 首歌曲`);

    } catch (error) {
        console.error('Failed to fetch playlist', error);
        await data.reply({
            content: addmusicbotErrorURLFormat + '\n\n請確認：\n1. 網址格式正確\n2. 播放清單為公開或未列出\n3. 播放清單包含影片\n4. YouTube Data API 金鑰已設定 (YOUTUBE_V3_API)',
            flags: 64,
        });
        return;
    }

    music_urlButton.setURL(playlistURL);

    const voiceChannel = (data.member as GuildMember).voice?.channel;
    if (!voiceChannel) {
        await data.reply({
            content: addmusicbotUserExist,
            flags: 64,
        });
        return;
    } else {
        const botMember = data.guild!.members.me!;

        if (botMember.voice.channel) {
            await data.reply({
                content: addmusicbotUsed,
                flags: 64,
            });
            return;
        }

        await data.reply({
            content: addmusicbotSuccess,
            flags: 64,
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

    const musicChannel = await createChannel(
        data.guild!,
        addmusicbotChannel,
        ChannelType.GuildText,
        {
            ViewChannel: true,
            SendMessages: false,
        }
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

    const musicBotData = new MusicBotData(playlist, musicChannel, panel, connection, player, data.guildId as string);
    activeTrackGuilds.set(data.guildId as string, musicBotData);

    updatePanel(musicBotData);
    playNext(data.guildId as string, musicBotData);

    /**
     * To play next track with index number
     */
    async function playNext(id: string, target: MusicBotData) {
        if (target.currentTrackIndex < target.playlist.items.length) {
            const url = target.playlist.items[target.currentTrackIndex].url.split('&')[0];

            try {
                if (target.player.state.status === AudioPlayerStatus.Playing || target.player.state.status === AudioPlayerStatus.Paused) {
                    target.player.stop();
                    await new Promise(resolve => target.player.once(AudioPlayerStatus.Idle, resolve));
                }

                if (target.stream) {
                    target.stream.removeAllListeners();
                    target.stream.kill('SIGTERM');
                    target.stream = null;
                }

                const stream = youtubedl.exec(url, {
                    format: 'bestaudio',
                    output: '-',
                    noPlaylist: true,
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0 Safari/537.36',
                });

                if (!stream.stdout) {
                    throw new Error('Failed to fetch audio stream.');
                }

                target.stream = stream;

                const resource = createAudioResource<AudioResourceMetadata>(stream.stdout, {
                    inlineVolume: true,
                    metadata: { guildId: id },
                });
                resource.volume?.setVolume(0.1);

                await new Promise(resolve => setTimeout(resolve, 1000));

                target.player.play(resource);
                console.log(`Playing track: ${target.playlist.items[target.currentTrackIndex].title}`);

                stream.stderr!.on('data', (data) => {
                    console.error('youtube-dl error:', data.toString());
                });

                stream.on('error', (error) => {
                    console.error('Stream error:', error);
                    if (error.message?.includes('SIGTERM') || error.message?.includes('Broken pipe')) {
                        return;
                    }
                    target.currentTrackIndex++;
                    playNext(id, target);
                });

            } catch (error: unknown) {
                if (error instanceof Error) {
                    if (error.message.includes('SIGTERM') || error.message.includes('Broken pipe')) {
                        console.log('Stream terminated or pipe broken intentionally, proceeding...');
                    } else {
                        console.error('Error processing track:', error);
                        target.currentTrackIndex++;
                        await playNext(id, target);
                    }
                } else {
                    console.error('Unknown error:', error);
                    target.currentTrackIndex++;
                    await playNext(id, target);
                }
            }
        } else {
            console.log('End of playlist, cleaning up resources...');
            if (target.stream) {
                target.stream.removeAllListeners();
                target.stream.kill('SIGTERM');
                target.stream = null;
            }
            target.player.stop();
            target.connection.destroy();
            await target.panel.delete();
            await target.musicChannel.delete();
            if (activeTrackGuilds.size === 1) {
                playerEventEmitter.removeAllListeners();
                eventRegistered = false;
            }
            activeTrackGuilds.delete(id);
        }
    }

    async function updatePanel(target: MusicBotData) {
        if (target.currentTrackIndex < target.playlist.items.length) {
            const url = target.playlist.items[target.currentTrackIndex].url;
            const trackName = target.playlist.items[target.currentTrackIndex].title;
            const authorName = target.playlist.items[target.currentTrackIndex].author?.name;
            const bestThumbnail = target.playlist.items[target.currentTrackIndex].thumbnail as string;
            const color = await getDominantColorFromUrl(bestThumbnail);

            async function getDominantColorFromUrl(imageUrl: string): Promise<[number, number, number]> {
                try {
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    if (response.status !== 200) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`);
                    }
                    const buffer = Buffer.from(response.data);
                    const imageBuffer = await sharp(buffer)
                        .resize(100, 100)
                        .raw()
                        .toBuffer();
                    const pixels = new Uint8Array(imageBuffer);
                    const colorMap: { [key: string]: number } = {};
                    for (let i = 0; i < pixels.length; i += 3) {
                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];
                        const colorKey = `${r},${g},${b}`;
                        colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
                    }
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

            embeds = new EmbedBuilder()
                .setTitle(trackName)
                .addFields(
                    { name: " ", value: " ", inline: true },
                    { name: " ", value: " ", inline: true },
                    { name: " ", value: " ", inline: true },
                )
                .setFooter({ text: "Author: " + authorName })
                .setColor(color)
                .setImage(bestThumbnail);

            await target.panel.edit({
                embeds: [embeds],
                components: [buttonRowPlayState, buttonRowLink]
            });
        }
    }

    player.on('stateChange', (oldState: any, newState: any) => {
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
            const guildId = (oldState.resource.metadata as AudioResourceMetadata)?.guildId;
            const targetData = activeTrackGuilds.get(guildId);
            if (targetData && !targetData.isManualSwitch) {
                if (targetData.stream) {
                    targetData.stream.removeAllListeners();
                    targetData.stream.kill('SIGTERM');
                    targetData.stream = null;
                }
                targetData.currentTrackIndex++;
                playNext(guildId, targetData);
                updatePanel(targetData);
            }
            if (targetData) {
                targetData.isManualSwitch = false;
            }
        }
    });

    if (!eventRegistered) {
        playerEventEmitter.on("music_play", async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.player.state.status === AudioPlayerStatus.Paused) {
                targetData.player.unpause();
                await targetData.panel.edit({ embeds: [embeds], components: [buttonRowPlayState, buttonRowLink] });
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_pause', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.player.state.status === AudioPlayerStatus.Playing) {
                targetData.player.pause();
                await targetData.panel.edit({ embeds: [embeds], components: [buttonRowStopState, buttonRowLink] });
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_next', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.currentTrackIndex + 1 < targetData.playlist.items.length) {
                targetData.isManualSwitch = true;
                targetData.player.stop();
                await new Promise(resolve => targetData.player.once(AudioPlayerStatus.Idle, resolve));
                if (targetData.stream) {
                    targetData.stream.removeAllListeners();
                    targetData.stream.kill('SIGTERM');
                    targetData.stream = null;
                }
                targetData.currentTrackIndex++;
                await playNext(interaction.guildId as string, targetData);
                await updatePanel(targetData);
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_previous', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.currentTrackIndex > 0) {
                targetData.isManualSwitch = true;
                targetData.player.stop();
                await new Promise(resolve => targetData.player.once(AudioPlayerStatus.Idle, resolve));
                if (targetData.stream) {
                    targetData.stream.removeAllListeners();
                    targetData.stream.kill('SIGTERM');
                    targetData.stream = null;
                }
                targetData.currentTrackIndex--;
                await playNext(interaction.guildId as string, targetData);
                await updatePanel(targetData);
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_random', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            targetData.isManualSwitch = true;
            targetData.player.stop();
            await new Promise(resolve => targetData.player.once(AudioPlayerStatus.Idle, resolve));
            if (targetData.stream) {
                targetData.stream.removeAllListeners();
                targetData.stream.kill('SIGTERM');
                targetData.stream = null;
            }
            targetData.currentTrackIndex = 0;
            targetData.playlist.items.sort(() => Math.random() - 0.5);
            await playNext(interaction.guildId as string, targetData);
            await updatePanel(targetData);
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_exit', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ ephemeral: true });
            if (targetData.stream) {
                targetData.stream.removeAllListeners();
                targetData.stream.kill('SIGTERM');
                targetData.stream = null;
            }
            targetData.player.stop();
            targetData.connection.destroy();
            await targetData.panel.delete();
            await targetData.musicChannel.delete();
            activeTrackGuilds.delete(interaction.guildId as string);
            if (activeTrackGuilds.size === 0) {
                playerEventEmitter.removeAllListeners();
                eventRegistered = false;
            }
        });

        eventRegistered = true;
    }
};

/**Get all `setName` string in the command in order */
export const actionOption = getOptionsName();

export const playerEventEmitter = new EventEmitter();

class MusicBotData {
    constructor(playlist: Playlist, musicChannel: TextChannel, panel: Message<true>, connection: VoiceConnection, player: AudioPlayer, guildId: string) {
        this.playlist = playlist;
        this.musicChannel = musicChannel;
        this.panel = panel;
        this.connection = connection;
        this.player = player;
        this.currentTrackIndex = 0;
        this.stream = null;
        this.guildId = guildId;
        this.isManualSwitch = false;
    }
    public playlist: Playlist;
    public musicChannel: TextChannel;
    public panel: Message<true>;
    public connection: VoiceConnection;
    public player: AudioPlayer;
    public currentTrackIndex: number;
    public stream: any | null;
    public guildId: string;
    public isManualSwitch: boolean;
}