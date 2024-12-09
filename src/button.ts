import { ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentEmojiResolvable } from "discord.js";
import { playerEventEmitter } from "./slashCommands/addMusicBot";

const messageButton = (id: string, label: string, style: ButtonStyle, emoji?: ComponentEmojiResolvable): ButtonBuilder => {
    const button = new ButtonBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setStyle(style)
    if (emoji) button.setEmoji(emoji);
    return button;
}

export const music_previousButton = messageButton("music_previous", " ", ButtonStyle.Secondary, "⏮️");
export const music_playButton = messageButton("music_play", " ", ButtonStyle.Success, "▶️");
export const music_pauseButton = messageButton("music_pause", " ", ButtonStyle.Secondary, "⏸️");
export const music_nextButton = messageButton("music_next", " ", ButtonStyle.Secondary, "⏭️");
export const music_exitButton = messageButton("music_exit", " ", ButtonStyle.Primary, "❌");
export const music_randomButton = messageButton("music_random", " ", ButtonStyle.Primary, "🔀");

export const music_urlButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji("📋");

export async function musicButtonInteractionHandler(interaction: ButtonInteraction) {
    playerEventEmitter.emit(interaction.customId, interaction);
}