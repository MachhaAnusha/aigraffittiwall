# AI Setup Guide — AI Graffiti Wall

Your drawings are only transformed by **real AI** when the server calls **Replicate** (Stable Diffusion SDXL). Without API keys, the app uses **demo mode** (local colour/glow filters only).

## What you need (minimum for AI)

| Service | Purpose | Required? |
|---------|---------|-----------|
| **Replicate** | SDXL img2img — turns your sketch into graffiti art | **Yes** for AI |
| **Cloudinary** | Stores generated images for the display wall | Recommended |
| Google Perspective | Text moderation | Optional (dev skips if missing) |
| Google Cloud Vision | Image moderation | Optional (dev skips if missing) |

## Step-by-step

### 1. Get a Replicate API token

1. Create an account at [replicate.com](https://replicate.com)
2. Go to [Account → API tokens](https://replicate.com/account/api-tokens)
3. Create a token (starts with `r8_...`)
4. Add billing/credits — each generation costs roughly **$0.01–0.05**

### 2. Get Cloudinary credentials (recommended)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Dashboard → **API Keys**
3. Copy: Cloud name, API Key, API Secret

### 3. Edit your `.env` file

Open:

```
c:\Users\mmana\OneDrive\Documents\AiGraffitteWall\.env
```

Replace with your real keys and **turn off demo mode**:

```env
ADMIN_PASSWORD=changeme
PORT=3001
VITE_SOCKET_URL=http://localhost:3001

RATE_LIMIT_MAX=0
AUTO_APPROVE=true

# === ENABLE REAL AI ===
DEMO_MODE=false
REPLICATE_API_TOKEN=r8_paste_your_token_here

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Restart the server

Stop the terminal (`Ctrl+C`), then:

```powershell
cd c:\Users\mmana\OneDrive\Documents\AiGraffitteWall
npm run dev
```

Check the server log for:

```
Generation mode: AI (Replicate SDXL)
```

The controller header should show **"AI generation active"**.

### 5. Test

1. Draw on `/controller`
2. Choose a **style preset** (e.g. Wildstyle, Cyberpunk)
3. Set **Style intensity** ~70%
4. Click **Generate Art**
5. Wait **10–30 seconds** (AI is processing)
6. Open `/display` — enhanced graffiti should appear

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Still says "Demo mode" | Set `DEMO_MODE=false` and restart server |
| "Generation failed" | Check Replicate token and account credits |
| Stuck on "Generating" | Check server terminal for error logs |
| Image unchanged | `DEMO_MODE=true` overrides AI even with a token |

## How it works

```
Your canvas drawing
    → moderation (text + image)
    → admin approval (or auto-approve)
    → Replicate SDXL img2img + your style preset prompt
    → Cloudinary upload
    → appears on /display wall
```

No other "linking" is required — the server handles everything once `.env` is configured.
