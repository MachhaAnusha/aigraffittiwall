import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

console.log('\n🔍 AI Graffiti Wall — setup check\n');

if (!existsSync(envPath)) {
  console.log('❌ No .env file found at:', envPath);
  console.log('   Copy .env.example to .env and add your Replicate token.\n');
  process.exit(1);
}

const env = readFileSync(envPath, 'utf8');
const get = (key) => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();

const token = get('REPLICATE_API_TOKEN');
const demoMode = get('DEMO_MODE');

if (!token || token.startsWith('r8_') === false) {
  console.log('❌ REPLICATE_API_TOKEN not set in .env');
  console.log('\n   Do this:');
  console.log('   1. Go to https://replicate.com/account/api-tokens');
  console.log('   2. Create a token (starts with r8_)');
  console.log('   3. Add to .env:  REPLICATE_API_TOKEN=r8_your_token_here');
  console.log('   4. Set:           DEMO_MODE=false');
  console.log('   5. Restart:       npm run dev\n');
  process.exit(1);
}

if (demoMode === 'true') {
  console.log('⚠️  DEMO_MODE=true — AI is disabled even though you have a token.');
  console.log('   Set DEMO_MODE=false in .env and restart the server.\n');
  process.exit(1);
}

console.log('✅ REPLICATE_API_TOKEN found');
console.log('✅ DEMO_MODE is not blocking AI');
console.log('\n   Restart server if running: npm run dev');
console.log('   Controller should show: "AI generation active"');
console.log('   Then draw → Generate Art → wait ~15–30s → check /display\n');
