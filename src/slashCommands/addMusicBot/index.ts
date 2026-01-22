import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message, TextChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, StreamType, VoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType, CommandOptionType } from "../../type";
import { addmusicbotChannel, addmusicbotErrorURLFormat, addmusicbotSuccess, addmusicbotUsed, addmusicbotUserExist, musicPanel } from "../../announcement";
import { music_previousButton, music_playButton, music_pauseButton, music_nextButton, music_exitButton, music_randomButton, music_urlButton } from "../../button";
import { EventEmitter } from 'events';
import sharp from "sharp";
import axios from "axios";
import { createChannel } from "../../channelSetting";
import { spawn } from "child_process";
import { getYtDlpPath } from "../../ytDlp";
import { getPlaylistItems, getPlaylistInfo, getVideoInfo } from "../../youTubeDataAPIv3";

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

const STREAM_SWITCH_DELAY_MS = 250;
const TRACK_SKIP_DELAY_MS = 150;
const YT_DLP_EARLY_EXIT_MS = 600;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const buildButtonRow = (...buttons: ButtonBuilder[]) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

function isValidHttpUrl(url: string): boolean {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function shouldSkipItem(item: PlaylistItem): boolean {
    const title = (item?.title || "").toLowerCase();
    if (title.includes("deleted video") || title.includes("private video")) {
        return true;
    }
    return !isValidHttpUrl(item?.url || "");
}

async function getDominantColorFromUrl(imageUrl: string): Promise<[number, number, number]> {
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
        description: 'Youtube playlist or single video url.',
        required: true,
        type: CommandOptionType.STRING,
        nameLocalizations: {
            'zh-TW': 'url',
        },
        descriptionLocalizations: {
            'zh-TW': 'Youtube播放清單或單首影片網址',
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

        const getVideoId = (targetUrl: URL) => {
            if (targetUrl.hostname.includes('youtu.be')) {
                const id = targetUrl.pathname.replace('/', '').trim();
                return id || undefined;
            }
            const videoId = targetUrl.searchParams.get('v');
            return videoId || undefined;
        };

        // 檢查是否包含播放清單 ID
        const playlistId = url.searchParams.get('list');
        const videoId = getVideoId(url);

        if (!playlistId && !videoId) {
            throw new Error('No playlist or video ID found in URL');
        }

        if (playlistId) {
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
        } else {
            const videoInfo = await getVideoInfo(videoId as string);
            if (!videoInfo) {
                throw new Error('Video not found');
            }

            const bestThumbnail = videoInfo.snippet.thumbnails?.maxres?.url ||
                videoInfo.snippet.thumbnails?.high?.url ||
                videoInfo.snippet.thumbnails?.medium?.url ||
                videoInfo.snippet.thumbnails?.default?.url || '';

            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            playlistURL = videoUrl;

            playlist = {
                title: videoInfo.snippet.title || '單首歌曲',
                url: videoUrl,
                items: [
                    {
                        url: videoUrl,
                        title: videoInfo.snippet.title || '單首歌曲',
                        author: {
                            name: videoInfo.snippet.channelTitle
                        },
                        thumbnail: bestThumbnail
                    }
                ]
            };

            console.log(`成功載入單首影片: ${playlist.title}`);
        }

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

    const buttonRowPlayState = buildButtonRow(
        music_previousButton,
        music_pauseButton,
        music_nextButton,
        music_exitButton,
        music_randomButton
    );

    const buttonRowStopState = buildButtonRow(
        music_previousButton,
        music_playButton,
        music_nextButton,
        music_exitButton,
        music_randomButton
    );

    const buttonRowLink = buildButtonRow(music_urlButton);

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

    // 先嘗試開始播放（可能會跳過不可播放影片），再更新面板
    await playNext(data.guildId as string, musicBotData);
    await updatePanel(musicBotData);

    /**
     * To play next track with index number
     */
    function stopCurrentStream(target: MusicBotData) {
        if (!target.stream) return;
        const proc: any = target.stream;
        proc.stdout?.removeAllListeners?.();
        proc.stderr?.removeAllListeners?.();
        proc.stdout?.destroy?.();
        proc.kill?.('SIGTERM');
        proc.removeAllListeners?.();
        target.stream = null;
    }

    async function playNext(id: string, target: MusicBotData) {
        // 用迴圈處理：遇到不可播放影片就跳過，避免遞迴一直爆
        while (target.currentTrackIndex < target.playlist.items.length) {
            const item = target.playlist.items[target.currentTrackIndex];
            const trackUrl = item?.url?.split('&')[0];

            console.log(
                `playNext: guild=${id}, index=${target.currentTrackIndex}/${target.playlist.items.length - 1}`
            );

            // 遇到已刪除/私人影片或髒資料就直接跳過
            if (!trackUrl || shouldSkipItem(item)) {
                console.warn(`播放失敗，切下一首（影片不可用）: index=${target.currentTrackIndex}, title=${item?.title}`);
                target.currentTrackIndex++;
                continue;
            }

            try {
                if (target.player.state.status === AudioPlayerStatus.Playing || target.player.state.status === AudioPlayerStatus.Paused) {
                    target.player.stop();
                    await new Promise(resolve => target.player.once(AudioPlayerStatus.Idle, resolve));
                }

                stopCurrentStream(target);

                // yt-dlp standalone exe：不需要 Python（Windows 下載 yt-dlp.exe）
                const ytdlpPath = await getYtDlpPath();

                const proc = spawn(
                    ytdlpPath,
                    [
                        "--no-playlist",
                        "--no-warnings",
                        "--quiet",
                        // Newer YouTube extraction may require a JS runtime to avoid missing URLs (SABR).
                        "--js-runtimes",
                        "node",
                        // Force Opus-in-WebM so @discordjs/voice can demux without ffmpeg
                        "-f",
                        "bestaudio[acodec=opus][ext=webm]",
                        "-o",
                        "-",
                        trackUrl,
                    ],
                    {
                        windowsHide: true,
                        stdio: ["ignore", "pipe", "pipe"],
                    }
                );

                // quick fail-fast: if yt-dlp exits immediately with non-zero, treat as unplayable
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(() => resolve(), YT_DLP_EARLY_EXIT_MS);
                    proc.once("exit", (code) => {
                        clearTimeout(timer);
                        if (code && code !== 0) reject(new Error(`yt-dlp exited with code ${code}`));
                        else resolve();
                    });
                    proc.once("error", (err) => {
                        clearTimeout(timer);
                        reject(err);
                    });
                });

                proc.stderr.on("data", (buf) => {
                    const msg = buf.toString().trim();
                    if (msg) console.error("yt-dlp:", msg);
                });

                target.stream = proc as any;

                const resource = createAudioResource<AudioResourceMetadata>(proc.stdout, {
                    inputType: StreamType.WebmOpus,
                    inlineVolume: true,
                    metadata: { guildId: id },
                });
                resource.volume?.setVolume(0.1);

                // 小延遲避免過快切歌造成斷管
                await delay(STREAM_SWITCH_DELAY_MS);

                target.player.play(resource);
                console.log(`Playing track: ${item.title}`);

                proc.stdout.on("error", () => {
                    // 訊息改為「切下一首」的提示，但實際換歌仍交給 Idle 流程處理
                    console.warn(
                        `播放中斷，準備切下一首: index=${target.currentTrackIndex}, title=${item?.title}`
                    );
                });

                proc.on("close", (code) => {
                    if (code && code !== 0) {
                        console.error(`yt-dlp closed with code ${code}`);
                    }
                });

                return; // 成功開始播放就結束
            } catch (error: unknown) {
                // 常見：刪除/私人/限制影片、或 yt-dlp 無法取得 opus/webm 來源 → 跳過
                console.error(`播放失敗，切下一首: index=${target.currentTrackIndex}, title=${item?.title}`, error);
                target.currentTrackIndex++;
                // 避免連續失敗刷太快
                await delay(TRACK_SKIP_DELAY_MS);
            }
        }

        // 播放清單結束：清理資源
        console.log('End of playlist, cleaning up resources...');
        stopCurrentStream(target);
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

    async function updatePanel(target: MusicBotData) {
        if (target.currentTrackIndex < target.playlist.items.length) {
            const trackName = target.playlist.items[target.currentTrackIndex].title;
            const authorName = target.playlist.items[target.currentTrackIndex].author?.name;
            const bestThumbnail = target.playlist.items[target.currentTrackIndex].thumbnail as string;
            const color = await getDominantColorFromUrl(bestThumbnail);

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

    function resolveTargetData(guildId: string | undefined, playerRef: AudioPlayer) {
        if (guildId) {
            return activeTrackGuilds.get(guildId);
        }
        // Fallback: find by player instance when metadata is missing
        for (const value of activeTrackGuilds.values()) {
            if (value.player === playerRef) {
                return value;
            }
        }
        return undefined;
    }

    player.on('stateChange', async (oldState: any, newState: any) => {
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
            const guildId = (oldState.resource.metadata as AudioResourceMetadata)?.guildId;
            const targetData = resolveTargetData(guildId, player);
            console.log(
                `player Idle: guild=${guildId || "unknown"}, resolved=${!!targetData}, manual=${targetData?.isManualSwitch ?? "n/a"}, index=${targetData?.currentTrackIndex ?? "n/a"}`
            );
            if (targetData && !targetData.isManualSwitch) {
                stopCurrentStream(targetData);
                targetData.currentTrackIndex++;
                await playNext(guildId, targetData);
                await updatePanel(targetData);
            }
            if (targetData) {
                targetData.isManualSwitch = false;
            }
        }
    });

    if (!eventRegistered) {
        playerEventEmitter.on("music_play", async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ flags: 64 });
            if (targetData.player.state.status === AudioPlayerStatus.Paused) {
                targetData.player.unpause();
                await targetData.panel.edit({ embeds: [embeds], components: [buttonRowPlayState, buttonRowLink] });
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_pause', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ flags: 64 });
            if (targetData.player.state.status === AudioPlayerStatus.Playing) {
                targetData.player.pause();
                await targetData.panel.edit({ embeds: [embeds], components: [buttonRowStopState, buttonRowLink] });
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_next', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ flags: 64 });
            if (targetData.currentTrackIndex + 1 < targetData.playlist.items.length) {
                targetData.isManualSwitch = true;
                targetData.player.stop();
                await new Promise(resolve => targetData.player.once(AudioPlayerStatus.Idle, resolve));
                stopCurrentStream(targetData);
                targetData.currentTrackIndex++;
                await playNext(interaction.guildId as string, targetData);
                await updatePanel(targetData);
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_previous', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ flags: 64 });
            if (targetData.currentTrackIndex > 0) {
                targetData.isManualSwitch = true;
                targetData.player.stop();
                await new Promise(resolve => targetData.player.once(AudioPlayerStatus.Idle, resolve));
                stopCurrentStream(targetData);
                targetData.currentTrackIndex--;
                await playNext(interaction.guildId as string, targetData);
                await updatePanel(targetData);
            }
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_random', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ flags: 64 });
            targetData.isManualSwitch = true;
            targetData.player.stop();
            await new Promise(resolve => targetData.player.once(AudioPlayerStatus.Idle, resolve));
            stopCurrentStream(targetData);
            targetData.currentTrackIndex = 0;
            targetData.playlist.items.sort(() => Math.random() - 0.5);
            await playNext(interaction.guildId as string, targetData);
            await updatePanel(targetData);
            setTimeout(() => { mes.delete() }, 500);
        });

        playerEventEmitter.on('music_exit', async (interaction: ButtonInteraction<CacheType>) => {
            const targetData = activeTrackGuilds.get(interaction.guildId as string) as MusicBotData;
            const mes = await interaction.deferReply({ flags: 64 });
            stopCurrentStream(targetData);
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