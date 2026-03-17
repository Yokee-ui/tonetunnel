# ToneTunnel

ToneTunnel is a self-hosted, personal music streaming proxy. It streams directly from YouTube Music on demand, using `yt-dlp` to extract direct CDN URLs.

## Features
- **Zero Ads**: Streams direct audio only.
- **Cross-device Sync**: Real-time play/pause and queue state via Socket.io.
- **Premium UI**: Fluid Midnight Studio aesthetic, dynamic accent colors, equalizers, drag-and-drop queues.
- **No storage required**: Audio is proxied or streamed directly; no local downloads.

## Prerequisites
1. **Node.js 20+**
2. **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** must be installed and available on your system `PATH`.
   - Windows: `winget install yt-dlp`
3. **Native build tools** (required for `better-sqlite3`).
   - Windows: Install Visual Studio Build Tools with the "Desktop development with C++" workload.

## Installation

1. Clone or download the repository.
2. Install root dependencies:
   ```bash
   npm install
   ```
   *Note: If install fails on Windows, ensure C++ Build Tools are installed.*
3. Configure your token:
   Edit `server/.env` and change `AUTH_TOKEN` to your desired secret password.
4. Start development:
   ```bash
   npm run dev
   ```

## Production Deployment
1. Build both client and server:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

### PM2
For background running:
```bash
npm install -g pm2
pm2 start server/dist/index.js --name tonetunnel
```

### Remote Access (Tailscale)
Since this is a self-hosted app without heavy multi-user auth, it is highly recommended to expose it only to your personal Tailnet (Tailscale, ZeroTier) rather than the public internet. Access your PC's Tailscale IP at port 3000 to stream anywhere.
