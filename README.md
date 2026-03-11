# Dummyyy-Stream

A no-backend TV streaming monorepo for web (LG WebOS) and mobile (React Native) platforms, accompanied by a lightweight Admin panel to manage channel data.

## Project Structure

```
Dummyyy-Stream/
├── apps/
│   ├── web/          # Vite + React + TypeScript (for LG WebOS TV)
│   ├── mobile/       # React Native Bare + TypeScript
│   └── admin/        # Express.js Admin Interface to manage channels
├── packages/
│   └── channels/     # Shared types, data, and utilities
└── package.json      # npm workspaces root
```

## Features

- 📺 **Unified channel data** - Single source of truth for all platforms
- ⭐ **Favorites** - Locally stored favorite channels
- 🎬 **HLS streaming** - Native support for m3u8 streams
- 📱 **Cross-platform** - Web (TV) and mobile apps
- ⚙️ **Admin Panel** - Built-in interface to edit, upload, and update channels on the fly.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- For mobile development:
  - iOS: macOS with Xcode, CocoaPods
  - Android: Android Studio with Android SDK

---

## 🚀 Build and Run Instructions

### 1. Install Dependencies

From the project root, install all monorepo dependencies:
```bash
npm install
```

### 2. Configure Channel Data

You can provide your initial channel data by copying your `channels.json` file to:
```
packages/channels/data/channels.json
```
> ⚠️ This file is gitignored for security. See `channels.example.json` or the format below.
> Alternatively, you can use the **Admin Panel** to upload or create channels.

### 3. Build Shared Packages

Before running the applications, build the shared `channels` package containing types and data utilities:

```bash
npm run build:channels
```

### 4. Running the Applications

You can run individual apps from the root directory using npm workspace commands.

#### Admin Panel (Channel Management)

The Admin panel provides a UI to edit and upload `channels.json`.
```bash
npm run admin
```
- **URL**: [http://localhost:3001](http://localhost:3001)
- **PIN**: `184216` (Default authentication PIN)

#### Web App (Browser / LG WebOS TV)

Start the Vite development server for the web application:
```bash
npm run dev:web
```
- **URL**: [http://localhost:5173](http://localhost:5173)

To create a production build for the Web App:
```bash
npm run build:web
```

#### Mobile App (iOS / Android)

Start the React Native Metro bundler:
```bash
npm run dev:mobile
```
Then, build and run on your desired platform:
```bash
# iOS
cd apps/mobile
npx pod-install
npm run ios

# Android (from apps/mobile directory)
npm run android
```

---

## Channel Data Format

Each channel in `channels.json` should conform to the following JSON structure:

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
| Admin    | Express.js + Multer |
| Shared   | TypeScript |

## License

Private - All rights reserved.
