# AI Graffiti Wall

An interactive two-screen graffiti art system: users draw on `/controller`, AI transforms submissions server-side, and finished artwork appears on `/display` (projector, LED wall, or smartboard).

## Architecture

| Route | Purpose |
|-------|---------|
| `/controller` | Drawing UI (phone, tablet, laptop) |
| `/display` | Full-screen anonymous art wall |
| `/admin` | PIN-protected approval & session controls |

Real-time sync uses **Socket.io**. Moderation (Perspective + Cloud Vision) and AI generation (Replicate SDXL) run on the server before anything reaches the display.

## Quick Start

### Prerequisites

- Node.js 18+
- API keys (see [API Keys](#api-keys))

### Install

```bash
cd AiGraffitteWall
cp .env.example .env
# Edit .env with your keys

npm install
```

### Development

```bash
npm run dev
```

- Client: http://localhost:5173/controller
- Display: http://localhost:5173/display
- Admin: http://localhost:5173/admin
- Server: http://localhost:3001

Set `VITE_SOCKET_URL=http://localhost:3001` in `.env` (root or `client/.env`).

### Production

```bash
npm run build
npm start
```

Serve the built client from the Express server on port `3001` (or your `PORT`).

## Local Network Deployment

For events, run the server on one machine and point all devices to its LAN IP.

1. Find your host IP (e.g. `192.168.1.42`).
2. In `.env`:
   ```
   PORT=3001
   VITE_SOCKET_URL=http://192.168.1.42:3001
   ```
3. Rebuild the client: `npm run build --workspace=client`
4. Start: `npm start`
5. Open on devices:
   - **Projector / TV:** `http://192.168.1.42:3001/display` → tap **Go Fullscreen**
   - **Phones / tablets:** `http://192.168.1.42:3001/controller` (QR on display links here)
   - **Organiser:** `http://192.168.1.42:3001/admin`

Ensure firewall allows inbound TCP on port 3001.

## API Keys

| Variable | Service | How to obtain |
|----------|---------|---------------|
| `REPLICATE_API_TOKEN` | [Replicate](https://replicate.com/account/api-tokens) | Account → API tokens |
| `PERSPECTIVE_API_KEY` | [Google Perspective API](https://developers.perspectiveapi.com/s/docs-get-started) | Google Cloud Console, enable Comment Analyzer |
| `GOOGLE_CLOUD_VISION_KEY` | [Cloud Vision](https://cloud.google.com/vision/docs) | API key with Vision API enabled |
| `CLOUDINARY_*` | [Cloudinary](https://cloudinary.com/) | Dashboard → API Keys |
| `ADMIN_PASSWORD` | Local | Any strong PIN for `/admin` |

Without optional keys, the server logs warnings and skips that moderation step (not recommended for public events).

## Features

- **Controller:** Fabric.js canvas, brush/spray/text tools, presets, AI settings, offline-capable drawing (PWA)
- **Display:** Layered anonymous artwork, particles, Ken Burns after 30s idle, QR + participant count
- **Admin:** Approval queue, live preview, pause/clear/export, moderation sensitivity, banned words, auto-approve
- **Safety:** Text + image moderation before AI; rate limit 3 submissions per device per 5 minutes
- **Queue:** Max 20 items, sequential generation, 5-minute admin approval timeout

## Project Structure

```
/client          React + Vite + Tailwind + Fabric.js
/server          Express + Socket.io + services
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Client + server concurrently |
| `npm run build` | Production build |
| `npm start` | Run production server |

## Troubleshooting

- **Socket won’t connect:** Check `VITE_SOCKET_URL` matches server URL; rebuild client after changing.
- **CORS / mixed content:** Use `http` consistently on LAN, or HTTPS with valid certs.
- **Generation fails:** Verify `REPLICATE_API_TOKEN` and billing; check server logs (display stays clean by design).
- **Canvas blank on mobile:** Allow touch; avoid browser zoom on the page.

## License

MIT
