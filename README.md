# Dummyyy-Stream

A no-backend TV streaming monorepo for web (LG WebOS) and mobile (React Native) platforms.

## Project Structure

```
Dummyyy-Stream/
├── apps/
│   ├── web/          # Vite + React + TypeScript (for LG WebOS TV)
│   └── mobile/       # React Native Bare + TypeScript
├── packages/
│   └── channels/     # Shared types, data, and utilities
└── package.json      # npm workspaces root
```

## Features

- 📺 **Unified channel data** - Single source of truth for all platforms
- ⭐ **Favorites** - Locally stored favorite channels
- 🎬 **HLS streaming** - Native support for m3u8 streams
- 📱 **Cross-platform** - Web (TV) and mobile apps

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- For mobile development:
  - iOS: macOS with Xcode
  - Android: Android Studio with SDK

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Channel Data

Copy your `channels.json` file to:
```
packages/channels/data/channels.json
```

> ⚠️ This file is gitignored for security. See `channels.example.json` for the expected format.

### 3. Build Shared Package

```bash
npm run build:channels
```

### 4. Run Web App

```bash
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run Mobile App

```bash
# iOS
cd apps/mobile
npx pod-install
npm run ios

# Android
npm run android
```

## Channel Data Format

Each channel in `channels.json` should have:

```json
{
  "item_id": "uuid-string",
  "name": "Channel Name",
  "description": "Channel description",
  "image_url": "https://example.com/logo.png",
  "m3u8_url": "https://example.com/stream.m3u8"
}
```

## Tech Stack

| Platform | Technology |
|----------|------------|
| Web/TV   | Vite + React + TypeScript + HLS.js |
| Mobile   | React Native + react-native-video |
| Shared   | TypeScript |

## License

Private - All rights reserved.
