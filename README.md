# Discord Bot

This is a Discord bot developed using TypeScript and integrated with the YouTube API v3.

## Features

- Interacts with Discord servers
- Uses YouTube API v3 for operations
- Supports Slash Commands and Context Menu Commands to help organize servers
- Utilizes SQLite for YouTube-related data storage

## Events

This bot listens to and processes the following events:

- `clientReady`: Triggered when the bot starts and is ready.
- `guildCreate`: Triggered when the bot joins a new server.
- `interactionCreate`: Triggered when a Slash Command or Context Menu interaction occurs.
- `messageCreate`: Triggered when a new message is sent.
- `messageDelete`: Triggered when a message is deleted.
- `messageReactionAdd`: Triggered when a user adds a reaction to a message.
- `messageReactionRemove`: Triggered when a user removes a reaction from a message.
- `messageUpdate`: Triggered when a message is edited.

## Slash Commands

This bot supports the following Slash Commands:

- `/addMusicBot`: Adds a music bot to the server.
- `/deleteBotChannel`: Deletes a specified bot channel.
- `/ping`: Tests the bot's latency.
- `/purge`: Deletes multiple messages in a channel.
- `/subscribe`: Subscribes to a YouTube channel, checking every hour for new videos and sending notifications if new videos are found.

## Context Menu Commands

This bot supports the following Context Menu Commands:

- `unsubscribe`: Unsubscribes from YouTube channel notifications.

## How to Add New Commands or Events

To add new Context Menu Commands, events, or Slash Commands to this project, follow these steps:

1. **Navigate to the corresponding folder:**
   - **Context Menu Commands:** `src/contextMenuCommands/`
   - **Events:** `src/events/`
   - **Slash Commands:** `src/slashCommands/`

2. **Add the new functionality:**
   - Create a new folder or file within the appropriate directory following the existing naming conventions and structure.
   - Implement the corresponding feature in the newly created file.

This project structure allows easy expansion of bot functionalities while maintaining organization and code maintainability.

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

   Copy `.env.example` to `.env` and fill in the following details:

   ```
   DISCORD_TOKEN=
   APPLICATION_ID=
   YOUTUBE_V3_API=
   YOUTUBE_V3_API2=
   YOUTUBE_V3_URL=
   ```

## Usage

Node version (required)
```
>= 20 (tested with 20.20.0)
```

Python
```
Not required
```

Run the following command to start the bot:

```bash
npm run start
```

## Note

This markdown file was initially generated with the assistance of ChatGPT, but has been refined and supplemented based on my input to ensure accuracy and completeness. If anything is unclear, please refer to the internal code for further details.
