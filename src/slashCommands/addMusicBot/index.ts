import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { createSlashCommand } from "../../command";
import { SlashCommand, CommandOption, OptionDataType, CommandOptionType } from "../../type";
import ytpl from "ytpl";
import ytdl from "@distube/ytdl-core";
import { musicPanel } from "../../announcement";
import { music_previousButton, music_playButton, music_pauseButton, music_nextButton, music_exitButton } from "../../button";
import { EventEmitter } from 'events';

/**Init Command info */
const initCommandInfo: Readonly<SlashCommand> = {
    name: "addmusicbot",
    description: "add music bot into your voice channel"
}

/**Init Command option group info in order */
const initOptionInfoGroup: Readonly<Array<CommandOption>> = [
    {
        name: 'url',
        description: 'Youtube playlist url.',
        required: true,
        type: CommandOptionType.STRING,
    },
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

/**Command action */
export const action = async (data: ChatInputCommandInteraction, options: Array<OptionDataType>) => {
    // const url = options[0] as string;
    // console.log("https://music.youtube.com/playlist?list=LRSRV6WluDfrdlhe-HL2Xk4TU49ta9TRlUT_A&si=SGZsUVCktX5xhpeL");
    const playlist = await ytpl(options[0] as string);
    const voiceChannel = (data.member as GuildMember).voice?.channel;
    if (!voiceChannel) {
        await data.reply({
            content: '⚠️ 請先加入語音頻道再使用此指令！',
            ephemeral: true,
        });
        return;
    }

    await data.reply({
        content: '已送單，稍等後台會抓一隻會唱不會跳的小精靈進來語音唱歌',
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    buttonRow.addComponents(
        music_previousButton,
        music_playButton,
        music_pauseButton,
        music_nextButton,
        music_exitButton
    );

    const panel = await data.followUp({
        embeds: [musicPanel],
        components: [buttonRow]
    })

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

    let currentTrackIndex: number = 0;
    playNext(currentTrackIndex);

    function playNext(index: number) {
        if (index < playlist.items.length) {
            const url = playlist.items[index].url;
            const stream = ytdl(url, {
                filter: 'audioonly' as const,
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                    },
                },
            }).on('error', (err) => {
                console.error('Error downloading the stream:', err);
            });

            stream.on('error', (err) => {
                console.error('Stream error:', err);
            });

            const resource = createAudioResource(stream);
            player.play(resource);
            // https://music.youtube.com/playlist?list=PLNII0FFNVK7GFub48zc6fFqVcc8VdhIJ6&si=wq2b--NQFEWXVzyW
            // https://www.youtube.com/watch?v=CjaM8qWzssk&list=PLNII0FFNVK7GFub48zc6fFqVcc8VdhIJ6
        }
        else {
            connection.destroy();
        }
    }

    // 設置當前音樂播放結束後的回調
    player.on('stateChange', (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
            currentTrackIndex++;
            playNext(currentTrackIndex);
        }
    });

    playerEventEmitter.on("music_play", async (interaction: ButtonInteraction<CacheType>) => {
        if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            await interaction.reply({
                content: 'play 操作成功，接著唱！',
                ephemeral: true,
            });
        }
        else if (player.state.status === AudioPlayerStatus.Playing) {
            await interaction.reply({
                content: '就已經在唱歌了，專心聽！',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    })

    playerEventEmitter.on('music_pause', async (interaction: ButtonInteraction<CacheType>) => {
        if (player.state.status === AudioPlayerStatus.Playing) {
            player.pause();
            await interaction.reply({
                content: 'pause 操作成功，靜悄悄！',
                ephemeral: true,
            });
        }
        else if (player.state.status === AudioPlayerStatus.Paused) {
            await interaction.reply({
                content: '已經沒在唱歌了，是要小精靈滾蛋嗎?',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    });

    playerEventEmitter.on('music_next', async (interaction: ButtonInteraction<CacheType>) => {
        if (currentTrackIndex + 1 < playlist.items.length) {
            currentTrackIndex++;
            playNext(currentTrackIndex);
            await interaction.reply({
                content: 'next 操作成功，小精靈不會再唱這首破歌了...',
                ephemeral: true,
            });
        }
        else {
            await interaction.reply({
                content: '這是最後的一曲了...',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    });

    playerEventEmitter.on('music_previous', async (interaction: ButtonInteraction<CacheType>) => {
        if (currentTrackIndex > 0) {
            currentTrackIndex--;
            playNext(currentTrackIndex);
            await interaction.reply({
                content: 'previous 操作成功，小精靈準備重唱',
                ephemeral: true,
            });
        }
        else {
            await interaction.reply({
                content: '沒有前一首歌耶',
                ephemeral: true,
            });
        }
        setTimeout(async () => {
            await interaction.deleteReply();
        }, 5000);
    });

    playerEventEmitter.on('music_exit', async (interaction: ButtonInteraction<CacheType>) => {
        connection.destroy();
        await data.deleteReply();
        await panel.delete();
        await interaction.reply({
            content: 'exit 操作成功，小精靈連一刻都沒有為結束的歌單哀悼，立刻趕到後台繼續原本該做的工作',
        });
        setTimeout(async () => {
            await interaction.deleteReply();
            playerEventEmitter.removeAllListeners();
        }, 5000);
    });
};

/**Get all `setName` string in the command in order  */
export const actionOption = getOptionsName();

export const playerEventEmitter = new EventEmitter();
