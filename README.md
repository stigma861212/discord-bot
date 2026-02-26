# Discord Bot

A Discord bot built with TypeScript, integrated with YouTube Data API v3 and yt-dlp for music playback.

## Features

- Interacts with Discord servers
- Uses YouTube Data API v3 to fetch video and playlist metadata
- Uses yt-dlp to stream YouTube audio (no Python required)
- Supports Slash Commands, Context Menu Commands, and Button interactions
- Voice channel music playback with control buttons
- Uses ffmpeg-static for audio processing
- Supports localized commands (including Traditional Chinese)

## Events

The bot listens to and processes the following events:

- `clientReady`: Triggered when the bot starts and is ready.
- `guildCreate`: Triggered when the bot joins a new server.
- `interactionCreate`: Triggered when a Slash Command, Context Menu, or Button interaction occurs.
- `messageCreate`: Triggered when a new message is sent.
- `messageDelete`: Triggered when a message is deleted.
- `messageReactionAdd`: Triggered when a user adds a reaction to a message.
- `messageReactionRemove`: Triggered when a user removes a reaction from a message.
- `messageUpdate`: Triggered when a message is edited.

## Slash Commands

| Command            | Description                                                                           |
| ------------------ | ------------------------------------------------------------------------------------- |
| `/addmusicbot`     | Adds a music bot to your voice channel; supports YouTube playlist or single video URL |
| `/changesevername` | Changes the current server name (subject to cooldown)                                 |
| `/purge`           | Deletes a specified number of messages (up to 100); optionally filter by member       |

## Context Menu Commands

| Command           | Description               |
| ----------------- | ------------------------- |
| `contextmenutest` | Test Context Menu command |

## Music Control Buttons

After `/addmusicbot` creates the music panel, the following buttons control playback:

- Previous
- Play / Pause
- Next
- Leave voice channel
- Shuffle

## How to Add New Commands or Events

To add new Context Menu Commands, events, or Slash Commands:

1. **Navigate to the corresponding folder:**
   - **Context Menu Commands:** `src/contextMenuCommands/`
   - **Events:** `src/events/`
   - **Slash Commands:** `src/slashCommands/`

2. **Implement the feature:**
   - Create a new folder or file within the appropriate directory following existing naming and structure.
   - Implement the feature in the new file.

This project structure allows easy expansion while keeping the code organized and maintainable.

## Installation

1. **Clone this repository:**

   ```bash
   git clone https://github.com/stigma861212/discord-bot.git
   cd discord-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the project root with:

   ```env
   DISCORD_TOKEN=your_discord_bot_token
   APPLICATION_ID=your_application_id
   YOUTUBE_V3_API=your_youtube_data_api_v3_key
   ```

## Usage

### Node version

```
>= 20 (recommended 20; tested with 20.20.0)
```

### Start the bot

```bash
npm run start
```

### Development mode (with hot reload)

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Package as executable (Windows x64)

```bash
npm run package
```

Output is placed in the `discord-bot` folder.

## Dependencies

- **discord.js** — Discord API interaction
- **@discordjs/voice** — Voice connection and playback
- **yt-dlp-wrap** — Downloads and uses yt-dlp binary to stream YouTube audio
- **ffmpeg-static** — Audio transcoding
- **axios** — HTTP requests (including YouTube API)
- **sharp** — Image processing (music panel thumbnails and dominant color)
- **dotenv** — Environment variable loading

## Notes

- The first run of `/addmusicbot` may have a short delay while yt-dlp is downloaded.
- If anything here conflicts with the implementation, refer to the source code for accuracy.
