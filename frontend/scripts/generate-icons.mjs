// Renders every ManaKhata icon and splash (web, PWA, Android) from one SVG mark:
// an indigo khata page with a saffron margin rule and a rupee sign.
// Geometry matches src/components/Logo.tsx. Uses sharp, which ships with Next.js.
// Usage: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const INDIGO = '#3B4BC8', SAFFRON = '#F2A93B', WHITE = '#FFFFFF', NIGHT = '#0A0E1C'
const RUPEE = 'M13 8.5H24.5M13 12.75H24.5M14 8.5h3.25a4.25 4.25 0 0 1 0 8.5H14l8.5 6.5'

/** body: 'rounded' | 'circle' | 'none'; mark: false for a plain background layer; scale shrinks the drawing around the centre. */
function svg({ body = 'rounded', bg, mark = true, scale = 1 }) {
  const off = 16 - 16 * scale
  const shape = body === 'rounded' ? `<rect x="2" y="2" width="28" height="28" rx="7" fill="${INDIGO}"/>`
    : body === 'circle' ? `<circle cx="16" cy="16" r="15" fill="${INDIGO}"/>` : ''
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
${bg ? `<rect width="32" height="32" fill="${bg}"/>` : ''}
<g transform="translate(${off} ${off}) scale(${scale})">${shape}
${mark ? `<rect x="7.5" y="8" width="2.6" height="16" rx="1.3" fill="${SAFFRON}"/>
<path d="${RUPEE}" fill="none" stroke="${WHITE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}</g></svg>`)
}

async function icon(path, size, opts) {
  const file = join(root, path)
  mkdirSync(dirname(file), { recursive: true })
  await sharp(svg(opts), { density: Math.max(72, (size / 32) * 72) }).resize(size, size).png().toFile(file)
}

async function splash(path, width, height, background) {
  const file = join(root, path)
  const mark = Math.round(Math.min(width, height) * 0.28)
  const logo = await sharp(svg({}), { density: (mark / 32) * 72 }).resize(mark, mark).png().toBuffer()
  await sharp({ create: { width, height, channels: 3, background } })
    .composite([{ input: logo, left: Math.round((width - mark) / 2), top: Math.round((height - mark) / 2) }])
    .png().toFile(file)
}

// Web + PWA
await icon('src/app/icon.png', 32, {})
await icon('public/icon-192x192.png', 192, {})
await icon('public/icon-512x512.png', 512, {})
await icon('public/icon-maskable-512.png', 512, { body: 'none', bg: INDIGO, scale: 0.9 })
await icon('public/apple-touch-icon.png', 180, { body: 'none', bg: INDIGO })

// Capacitor asset sources
await icon('assets/icon-only.png', 1024, {})
await icon('assets/icon-foreground.png', 1024, { body: 'none', scale: 0.85 })
await icon('assets/icon-background.png', 1024, { body: 'none', bg: INDIGO, mark: false })
await splash('assets/splash.png', 2732, 2732, NIGHT)
await splash('assets/splash-dark.png', 2732, 2732, NIGHT)

// Android launcher icons (adaptive layers + legacy square/round)
const res = 'android/app/src/main/res'
for (const [dpi, size] of Object.entries({ ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  await icon(`${res}/mipmap-${dpi}/ic_launcher.png`, size, {})
  await icon(`${res}/mipmap-${dpi}/ic_launcher_round.png`, size, { body: 'circle' })
  await icon(`${res}/mipmap-${dpi}/ic_launcher_foreground.png`, size, { body: 'none', scale: 0.85 })
  await icon(`${res}/mipmap-${dpi}/ic_launcher_background.png`, size, { body: 'none', bg: INDIGO, mark: false })
}

// Android splash screens: the app opens in the dark Midnight theme, so day and night match.
const port = { ldpi: [240, 320], mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] }
for (const [dpi, [w, h]] of Object.entries(port)) {
  for (const night of ['', '-night']) {
    await splash(`${res}/drawable-port${night}-${dpi}/splash.png`, w, h, NIGHT)
    await splash(`${res}/drawable-land${night}-${dpi}/splash.png`, h, w, NIGHT)
  }
}
await splash(`${res}/drawable/splash.png`, 320, 480, NIGHT)
await splash(`${res}/drawable-night/splash.png`, 320, 240, NIGHT)
console.log('icons and splash screens written')
